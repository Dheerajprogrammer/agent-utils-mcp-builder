import { createMCPServer } from "@agent-utils/mcp-builder";
const server = createMCPServer({ name: "hello-world", version: "1.0.0" });
server.tool("hello", { input: { name: "string" }, handler: ({ name }) => ({ message: `Hello, ${name}!` }) });
server.start();
