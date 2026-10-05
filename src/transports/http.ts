import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { MCPTransportAdapter, MCPTransportServer } from "../core/types.js";
import { toSafeError } from "../errors/index.js";

export class HttpTransport implements MCPTransportAdapter {
  readonly name = "http";
  private server?: ReturnType<typeof createServer>;
  constructor(private readonly options: { port?: number; host?: string; maxBodySize?: number } = {}) {}
  async start(mcp: MCPTransportServer) {
    this.server = createServer(async (req, res) => this.route(mcp, req, res));
    await new Promise<void>((resolve, reject) => this.server!.once("error", reject).listen(this.options.port ?? 3000, this.options.host ?? "127.0.0.1", resolve));
  }
  private async route(mcp: MCPTransportServer, req: IncomingMessage, res: ServerResponse) {
    if (req.method === "GET" && req.url === "/health") return this.json(res, 200, { status: "ok", server: mcp.info().name, version: mcp.info().version });
    if (req.method !== "POST" || req.url !== "/mcp") return this.json(res, 404, { error: "Not found" });
    try {
      const chunks: Buffer[] = []; let length = 0; const max = this.options.maxBodySize ?? 1_048_576;
      for await (const part of req) { length += part.length; if (length > max) throw new Error("Request body too large"); chunks.push(part); }
      const body = JSON.parse(Buffer.concat(chunks).toString()) as { method: string; params?: Record<string, unknown>; id?: string | number | null };
      const result = await mcp.handle({ ...body, auth: await undefined, metadata: { headers: req.headers } });
      this.json(res, 200, { jsonrpc: "2.0", id: body.id ?? null, result });
    } catch (error) { this.json(res, 400, { jsonrpc: "2.0", id: null, error: toSafeError(error) }); }
  }
  private json(res: ServerResponse, status: number, data: unknown) { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(data)); }
  async stop() { if (this.server) await new Promise<void>((resolve, reject) => this.server!.close((error) => error ? reject(error) : resolve())); }
}
