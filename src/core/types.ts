import type { Logger } from "../logger/index.js";
import type { SchemaLike } from "../schemas/index.js";

export type ToolResult = unknown;
export interface MCPRequestContext<Services extends object = Record<string, never>> {
  requestId: string;
  logger: Logger;
  auth?: { subject?: string; permissions?: string[]; [key: string]: unknown };
  metadata: Record<string, unknown>;
  signal: AbortSignal;
  transport?: string;
  services: Services;
  retry<T>(operation: () => Promise<T>, options?: { retries?: number; delay?: number }): Promise<T>;
}
export type Middleware<Services extends object = Record<string, never>> = (context: MCPRequestContext<Services> & { method: string; name: string; input: unknown }, next: () => Promise<void>) => Promise<void> | void;
export interface ToolOptions<Input = unknown, Services extends object = Record<string, never>> {
  description?: string;
  input?: SchemaLike<Input>;
  inputSchema?: SchemaLike<Input>;
  handler?: (input: Input, context: MCPRequestContext<Services>) => ToolResult | Promise<ToolResult>;
  permissions?: string[];
  timeout?: number;
  maxConcurrency?: number;
  cache?: { ttl: number };
  dangerous?: boolean;
  destructive?: boolean;
  readOnly?: boolean;
  confirmationRequired?: boolean;
}
export interface ResourceOptions<Input = Record<string, string>, Services extends object = Record<string, never>> {
  uri: string;
  description?: string;
  handler: (input: Input, context: MCPRequestContext<Services>) => unknown | Promise<unknown>;
}
export interface PromptOptions<Input = Record<string, unknown>, Services extends object = Record<string, never>> {
  description?: string;
  arguments?: SchemaLike<Input>;
  handler: (input: Input, context: MCPRequestContext<Services>) => string | { messages: unknown[] } | Promise<string | { messages: unknown[] }>;
}
export interface MCPTransportAdapter { start(server: MCPTransportServer): Promise<void>; stop(): Promise<void>; readonly name?: string; }
export interface MCPTransportServer { handle(request: MCPProtocolRequest): Promise<unknown>; info(): ServerInfo; }
export interface MCPProtocolRequest { method: string; params?: Record<string, unknown>; id?: string | number | null; metadata?: Record<string, unknown>; auth?: MCPRequestContext["auth"]; signal?: AbortSignal; }
export interface ServerInfo { name: string; version: string; tools: Array<{ name: string; description?: string; inputSchema: unknown }>; resources: Array<{ name: string; uri: string; description?: string }>; prompts: Array<{ name: string; description?: string }>; }
export interface AuthAdapter { authenticate(input: { authorization?: string; headers?: Record<string, string> }): Promise<MCPRequestContext["auth"] | undefined>; }
export interface Metrics { toolCalls: number; successCount: number; errorCount: number; averageLatency: number; p95Latency: number; }
