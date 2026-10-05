import { createInterface } from "node:readline";
import type { MCPTransportAdapter, MCPTransportServer } from "../core/types.js";
import { toSafeError } from "../errors/index.js";

/** JSON-RPC 2.0 stdio adapter. Suitable for MCP hosts that use line-delimited JSON. */
export class StdioTransport implements MCPTransportAdapter {
  readonly name = "stdio";
  private reader?: ReturnType<typeof createInterface>;
  async start(server: MCPTransportServer) {
    this.reader = createInterface({ input: process.stdin, crlfDelay: Infinity });
    this.reader.on("line", async (line) => {
      try {
        const request = JSON.parse(line) as { id?: string | number | null; method: string; params?: Record<string, unknown> };
        const result = await server.handle(request);
        if (request.id !== undefined) process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`);
      } catch (error) { process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: toSafeError(error) })}\n`); }
    });
  }
  async stop() { this.reader?.close(); }
}
