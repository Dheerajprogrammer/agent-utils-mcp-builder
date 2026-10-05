import { randomUUID } from "node:crypto";
import { MCPError } from "../errors/index.js";
import { createLogger, type Logger } from "../logger/index.js";
import { asZodSchema, zodToJsonSchema } from "../schemas/index.js";
import { HttpTransport } from "../transports/http.js";
import { StdioTransport } from "../transports/stdio.js";
import type { AuthAdapter, MCPProtocolRequest, MCPRequestContext, MCPTransportAdapter, MCPTransportServer, Metrics, Middleware, PromptOptions, ResourceOptions, ServerInfo, ToolOptions } from "../core/types.js";

export interface ServerOptions<Services extends object = Record<string, never>> {
  name: string; version: string; description?: string; timeout?: number; maxConcurrency?: number;
  logger?: boolean | Logger; logging?: boolean | Logger; services?: Services; env?: Record<string, "string" | { optional?: boolean }>;
  transport?: "stdio" | "http" | MCPTransportAdapter; observability?: { openTelemetry?: boolean };
}
type Listener = (...args: any[]) => void;
interface RegisteredTool { name: string; options: ToolOptions<any, any>; schema?: ReturnType<typeof asZodSchema>; active: number; cache: Map<string, { expires: number; value: unknown }>; }

export class MCPServer<Services extends object = Record<string, never>> implements MCPTransportServer {
  private readonly tools = new Map<string, RegisteredTool>();
  private readonly resources = new Map<string, ResourceOptions<any, Services>>();
  private readonly prompts = new Map<string, PromptOptions<any, Services>>();
  private middleware: Middleware<Services>[] = [];
  private listeners = new Map<string, Set<Listener>>();
  private currentTransport?: MCPTransportAdapter;
  private authAdapter?: AuthAdapter;
  private serviceBag: Services;
  private latencies: number[] = [];
  private metricState = { toolCalls: 0, successCount: 0, errorCount: 0 };
  readonly logger: Logger;

  constructor(readonly options: ServerOptions<Services>) {
    if (!options.name || !options.version) throw new MCPError({ code: "INVALID_SERVER", message: "Server name and version are required" });
    this.serviceBag = options.services ?? {} as Services;
    this.logger = createLogger(options.logger ?? options.logging ?? true);
    this.validateEnv(options.env);
  }
  tool<Input>(name: string, options: ToolOptions<Input, Services>, handler?: ToolOptions<Input, Services>["handler"]) {
    this.assertName(name, "tool"); if (this.tools.has(name)) throw new MCPError({ code: "DUPLICATE_TOOL", message: `Tool '${name}' is already registered` });
    const complete = { ...options, handler: handler ?? options.handler };
    if (!complete.handler) throw new MCPError({ code: "INVALID_TOOL", message: `Tool '${name}' requires a handler` });
    this.tools.set(name, { name, options: complete, schema: asZodSchema(complete.inputSchema ?? complete.input), active: 0, cache: new Map() }); return this;
  }
  resource<Input extends Record<string, string>>(name: string, options: ResourceOptions<Input, Services>) {
    this.assertName(name, "resource"); if ([...this.resources.values()].some((item) => item.uri === options.uri)) throw new MCPError({ code: "DUPLICATE_RESOURCE", message: `Resource URI '${options.uri}' is already registered` });
    this.resources.set(name, options); return this;
  }
  prompt<Input>(name: string, options: PromptOptions<Input, Services>) { this.assertName(name, "prompt"); if (this.prompts.has(name)) throw new MCPError({ code: "DUPLICATE_PROMPT", message: `Prompt '${name}' is already registered` }); this.prompts.set(name, options); return this; }
  use(middleware: Middleware<Services>) { this.middleware.push(middleware); return this; }
  usePlugin(plugin: { install(server: MCPServer<Services>): void | Promise<void> }) { void plugin.install(this); return this; }
  auth(adapter: AuthAdapter | { type: "bearer"; validate(token: string): Promise<MCPRequestContext["auth"] | boolean> }) {
    this.authAdapter = "authenticate" in adapter ? adapter : { authenticate: async ({ authorization }) => {
      const token = authorization?.replace(/^Bearer\s+/i, ""); if (!token) return undefined; const result = await adapter.validate(token); return result === true ? {} : result || undefined;
    }}; return this;
  }
  services(services: Services) { this.serviceBag = services; return this; }
  on(event: "tool:start" | "tool:success" | "tool:error", listener: Listener) { const set = this.listeners.get(event) ?? new Set(); set.add(listener); this.listeners.set(event, set); return () => set.delete(listener); }
  metrics(): Metrics { const ordered = [...this.latencies].sort((a, b) => a - b); return { ...this.metricState, averageLatency: this.latencies.length ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length : 0, p95Latency: ordered.length ? ordered[Math.ceil(ordered.length * .95) - 1]! : 0 }; }
  info(): ServerInfo { return { name: this.options.name, version: this.options.version, tools: [...this.tools.values()].map((t) => ({ name: t.name, description: t.options.description, inputSchema: zodToJsonSchema(t.schema) })), resources: [...this.resources.entries()].map(([name, r]) => ({ name, uri: r.uri, description: r.description })), prompts: [...this.prompts.entries()].map(([name, p]) => ({ name, description: p.description })) }; }
  async start(input?: { transport?: "stdio" | "http" | MCPTransportAdapter; port?: number }) { const transport = input?.transport ?? this.options.transport ?? "stdio"; this.currentTransport = transport === "stdio" ? new StdioTransport() : transport === "http" ? new HttpTransport({ port: input?.port }) : transport; await this.currentTransport.start(this); return this; }
  async stop() { await this.currentTransport?.stop(); }
  http(options: { baseURL: string; headers?: Record<string, string> }) { return { get: <T = unknown>(path: string) => this.request<T>(options, path, "GET"), post: <T = unknown>(path: string, body?: unknown) => this.request<T>(options, path, "POST", body), request: <T = unknown>(path: string, init?: RequestInit) => this.request<T>(options, path, init?.method ?? "GET", init?.body) }; }
  private async request<T>(options: { baseURL: string; headers?: Record<string, string> }, path: string, method: string, body?: unknown): Promise<T> { const response = await fetch(new URL(path, options.baseURL), { method, headers: { "content-type": "application/json", ...options.headers }, body: body === undefined ? undefined : JSON.stringify(body) }); if (!response.ok) throw new MCPError({ code: "HTTP_ERROR", message: `HTTP ${response.status}`, status: response.status }); return response.json() as Promise<T>; }
  async handle(request: MCPProtocolRequest): Promise<unknown> {
    if (request.method === "initialize") return { protocolVersion: "2025-03-26", serverInfo: { name: this.options.name, version: this.options.version }, capabilities: { tools: {}, resources: {}, prompts: {} } };
    if (request.method === "tools/list") return { tools: this.info().tools };
    if (request.method === "resources/list") return { resources: this.info().resources };
    if (request.method === "prompts/list") return { prompts: this.info().prompts };
    if (request.method === "tools/call") return this.callTool(String(request.params?.name), request.params?.arguments ?? {}, request);
    if (request.method === "resources/read") return this.readResource(String(request.params?.uri), request);
    if (request.method === "prompts/get") return this.getPrompt(String(request.params?.name), request.params?.arguments ?? {}, request);
    throw new MCPError({ code: "METHOD_NOT_FOUND", message: `Unsupported method '${request.method}'`, status: 404 });
  }
  async callTool(name: string, input: unknown, request: MCPProtocolRequest = { method: "tools/call" }): Promise<unknown> {
    const tool = this.tools.get(name); if (!tool) throw new MCPError({ code: "TOOL_NOT_FOUND", message: `Tool '${name}' was not found`, status: 404 });
    if (tool.options.confirmationRequired && request.metadata?.confirmed !== true) throw new MCPError({ code: "CONFIRMATION_REQUIRED", message: `Tool '${name}' requires explicit confirmation`, status: 409 });
    const parsed = tool.schema?.safeParse(input); if (parsed && !parsed.success) throw new MCPError({ code: "INVALID_INPUT", message: "Tool input validation failed", details: parsed.error.flatten(), status: 400 });
    const cacheKey = JSON.stringify(input); const cached = tool.cache.get(cacheKey); if (tool.options.cache && cached && cached.expires > Date.now()) return cached.value;
    const limit = tool.options.maxConcurrency ?? this.options.maxConcurrency; if (limit && tool.active >= limit) throw new MCPError({ code: "CONCURRENCY_LIMIT", message: `Tool '${name}' is at capacity`, status: 429 });
    const context = await this.context(request, "tools/call", name, parsed?.data ?? input); const started = performance.now(); tool.active++; this.metricState.toolCalls++; this.emit("tool:start", { name, context }); this.logger.info(`[MCP] tool:${name} started`, { requestId: context.requestId });
    try {
      let result: unknown; let index = -1; const run = async (): Promise<void> => { index++; const layer = this.middleware[index]; if (layer) return layer({ ...context, method: "tools/call", name, input: parsed?.data ?? input }, run); result = await this.withTimeout(Promise.resolve(tool.options.handler!(parsed?.data ?? input, context)), tool.options.timeout ?? this.options.timeout, context.signal); };
      await run(); if (tool.options.cache) tool.cache.set(cacheKey, { expires: Date.now() + tool.options.cache.ttl, value: result }); this.metricState.successCount++; this.emit("tool:success", { name, result, context }); return result;
    } catch (error) { this.metricState.errorCount++; this.emit("tool:error", { name, error, context }); throw error; }
    finally { tool.active--; const elapsed = performance.now() - started; this.latencies.push(elapsed); if (this.latencies.length > 1_000) this.latencies.shift(); this.logger.info(`[MCP] tool:${name} completed`, { requestId: context.requestId, durationMs: Math.round(elapsed) }); }
  }
  private async readResource(uri: string, request: MCPProtocolRequest) { for (const [name, resource] of this.resources) { const pattern = resource.uri.split(/(\{[^}]+\})/).map((part) => part.startsWith("{") && part.endsWith("}") ? `(?<${part.slice(1, -1)}>[^/]+)` : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(""); const match = new RegExp(`^${pattern}$`).exec(uri); if (match) return resource.handler(match.groups ?? {}, await this.context(request, "resources/read", name, match.groups ?? {})); } throw new MCPError({ code: "RESOURCE_NOT_FOUND", message: `Resource '${uri}' was not found`, status: 404 }); }
  private async getPrompt(name: string, input: unknown, request: MCPProtocolRequest) { const prompt = this.prompts.get(name); if (!prompt) throw new MCPError({ code: "PROMPT_NOT_FOUND", message: `Prompt '${name}' was not found`, status: 404 }); const schema = asZodSchema(prompt.arguments); const parsed = schema?.safeParse(input); if (parsed && !parsed.success) throw new MCPError({ code: "INVALID_INPUT", message: "Prompt arguments validation failed", details: parsed.error.flatten() }); const result = await prompt.handler(parsed?.data ?? input, await this.context(request, "prompts/get", name, parsed?.data ?? input)); return typeof result === "string" ? { messages: [{ role: "user", content: { type: "text", text: result } }] } : result; }
  private async context(request: MCPProtocolRequest, _method: string, _name: string, _input: unknown): Promise<MCPRequestContext<Services>> { const auth = request.auth ?? await this.authAdapter?.authenticate({ authorization: typeof request.metadata?.authorization === "string" ? request.metadata.authorization : undefined }); return { requestId: typeof request.id === "string" ? request.id : randomUUID(), logger: this.logger, auth, metadata: request.metadata ?? {}, signal: request.signal ?? new AbortController().signal, transport: this.currentTransport?.name, services: this.serviceBag, retry: async (operation, options = {}) => { let error: unknown; for (let i = 0; i <= (options.retries ?? 2); i++) { try { return await operation(); } catch (caught) { error = caught; if (i < (options.retries ?? 2)) await new Promise((resolve) => setTimeout(resolve, options.delay ?? 100 * (i + 1))); } } throw error; } }; }
  private async withTimeout<T>(promise: Promise<T>, timeout?: number, signal?: AbortSignal): Promise<T> { if (!timeout && !signal) return promise; return new Promise<T>((resolve, reject) => { const timer = timeout ? setTimeout(() => reject(new MCPError({ code: "TIMEOUT", message: `Operation timed out after ${timeout}ms`, status: 504 })), timeout) : undefined; const abort = () => reject(new MCPError({ code: "CANCELLED", message: "Operation cancelled", status: 499 })); signal?.addEventListener("abort", abort, { once: true }); promise.then(resolve, reject).finally(() => { if (timer) clearTimeout(timer); signal?.removeEventListener("abort", abort); }); }); }
  private assertName(name: string, type: string) { if (!/^[a-zA-Z][\w.-]*$/.test(name)) throw new MCPError({ code: "INVALID_NAME", message: `Invalid ${type} name '${name}'` }); }
  private emit(event: string, value: unknown) { this.listeners.get(event)?.forEach((listener) => listener(value)); }
  private validateEnv(env?: ServerOptions["env"]) { for (const [key, config] of Object.entries(env ?? {})) if (!process.env[key] && (config === "string" || !config.optional)) throw new MCPError({ code: "INVALID_ENV", message: `Required environment variable '${key}' is missing` }); }
}
export const createMCPServer = <Services extends object = Record<string, never>>(options: ServerOptions<Services>) => new MCPServer(options);
