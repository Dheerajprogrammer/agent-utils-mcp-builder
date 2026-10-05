import { describe, expect, it } from "vitest";
import { createMCPServer, MCPError } from "../src/index.js";
import { authorize, rateLimit } from "../src/middleware/index.js";

describe("MCPServer", () => {
  it("registers, validates and calls a tool", async () => {
    const server = createMCPServer({ name: "test", version: "1" });
    server.tool("greet", { input: { name: "string" }, handler: ({ name }) => `Hello ${name}` });
    await expect(server.callTool("greet", { name: "Ada" })).resolves.toBe("Hello Ada");
    await expect(server.callTool("greet", { name: 2 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("guards duplicate names and confirmations", async () => {
    const server = createMCPServer({ name: "test", version: "1" });
    server.tool("delete", { confirmationRequired: true, handler: () => "done" });
    expect(() => server.tool("delete", { handler: () => "no" })).toThrow(MCPError);
    await expect(server.callTool("delete", {})).rejects.toMatchObject({ code: "CONFIRMATION_REQUIRED" });
    await expect(server.callTool("delete", {}, { method: "tools/call", metadata: { confirmed: true } })).resolves.toBe("done");
  });
  it("runs middleware and exposes metrics", async () => {
    const server = createMCPServer({ name: "test", version: "1" }); let seen = false;
    server.use(async (_ctx, next) => { seen = true; await next(); }); server.tool("ok", { handler: () => true });
    await server.callTool("ok", {}); expect(seen).toBe(true); expect(server.metrics().successCount).toBe(1);
  });
  it("authorizes permissioned tools", async () => {
    const server = createMCPServer({ name: "test", version: "1" }); server.use(authorize({ require: ["write"] })); server.tool("write", { handler: () => true });
    await expect(server.callTool("write", {})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("caches a tool result", async () => { const server = createMCPServer({ name: "test", version: "1" }); let calls = 0; server.tool("cached", { cache: { ttl: 1_000 }, handler: () => ++calls }); await server.callTool("cached", {}); await server.callTool("cached", {}); expect(calls).toBe(1); });
  it("resolves dynamic resources", async () => { const server = createMCPServer({ name: "test", version: "1" }); server.resource("user", { uri: "users://{id}", handler: ({ id }) => ({ id }) }); await expect(server.handle({ method: "resources/read", params: { uri: "users://42" } })).resolves.toEqual({ id: "42" }); });
  it("rate limits calls", async () => { const server = createMCPServer({ name: "test", version: "1" }); server.use(rateLimit({ requests: 1, window: "1m" })); server.tool("once", { handler: () => true }); await server.callTool("once", {}); await expect(server.callTool("once", {})).rejects.toMatchObject({ code: "RATE_LIMITED" }); });
});
