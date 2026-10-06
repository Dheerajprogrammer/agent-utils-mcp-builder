# @agent-utils/mcp-builder

Build Model Context Protocol (MCP) servers with an Express-like, TypeScript-first API. Register tools, resources, and prompts; validate input; add middleware and security controls; then run over stdio or HTTP.

[![npm version](https://img.shields.io/npm/v/@agent-utils/mcp-builder)](https://www.npmjs.com/package/@agent-utils/mcp-builder)
[![GitHub repository](https://img.shields.io/badge/GitHub-agent--utils--mcp--builder-181717?logo=github)](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder)
[![Sponsor Dheerajprogrammer](https://img.shields.io/badge/Sponsor-Dheerajprogrammer-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Dheerajprogrammer)

**Documentation:** [dheerajprogrammer.github.io/agent-utils-mcp-builder](https://dheerajprogrammer.github.io/agent-utils-mcp-builder/)

**Contributing:** Read the [contribution guide](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/blob/main/CONTRIBUTING.md), open an [issue](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/issues), or submit a pull request.

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Tools and validation](#tools-and-validation)
- [Resources and prompts](#resources-and-prompts)
- [Middleware, auth, and safety](#middleware-auth-and-safety)
- [Transports](#transports)
- [Testing](#testing)
- [CLI](#cli)
- [OpenAPI generation](#openapi-generation)
- [Support](#support)

## Installation

```bash
npm install @agent-utils/mcp-builder zod
```

Requires Node.js 18.17 or newer.

## Quick start

Create `src/index.ts`:

```ts
import { createMCPServer } from "@agent-utils/mcp-builder";

const server = createMCPServer({
  name: "my-server",
  version: "1.0.0",
});

server.tool("getUser", {
  description: "Get user information",
  input: { userId: "string" },
  handler: async ({ userId }) => ({
    id: userId,
    name: "John",
  }),
});

await server.start({ transport: "stdio" });
```

Start from a generated project instead:

```bash
npx mcp-builder init my-server
cd my-server
npm install
npm run dev
```

## Tools and validation

Register a tool with `server.tool(name, options)`. Use the compact shorthand schema, a JSON Schema object, or Zod through `inputSchema`. Invalid input is rejected before your handler executes.

```ts
import { z } from "zod";

server.tool("createUser", {
  description: "Create a user",
  inputSchema: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  handler: async ({ name, email }, ctx) => {
    ctx.logger.info("Creating user", { requestId: ctx.requestId });
    return { id: crypto.randomUUID(), name, email };
  },
});
```

Handlers receive a request context with `requestId`, `logger`, `auth`, `metadata`, `signal`, `services`, and `retry`. Use `ctx.signal.throwIfAborted()` in long-running work.

```ts
server.tool("fetchProfile", {
  timeout: 10_000,
  handler: async (_input, ctx) =>
    ctx.retry(() => fetch("https://example.com/profile").then((response) => response.json())),
});
```

Use `defineTool()` when you prefer exporting tool definitions from separate files:

```ts
import { defineTool } from "@agent-utils/mcp-builder";

export default defineTool({
  name: "ping",
  description: "Check connectivity",
  handler: () => ({ ok: true }),
});
```

## Resources and prompts

Resources can use URI parameters, while prompts return a string or MCP-style messages.

```ts
server.resource("user", {
  uri: "users://{id}",
  handler: async ({ id }) => ({ id, name: "John" }),
});

server.prompt("reviewCode", {
  description: "Review source code",
  arguments: { language: "string", code: "string" },
  handler: ({ language, code }) => `Review this ${language} code:\n\n${code}`,
});
```

## Middleware, auth, and safety

Add middleware in registration order with `server.use()`. Built-in `authorize` and `rateLimit` middleware are exported from `@agent-utils/mcp-builder/middleware`.

```ts
import { authorize, rateLimit } from "@agent-utils/mcp-builder/middleware";

server.auth({
  type: "bearer",
  validate: async (token) => ({
    subject: await verifyToken(token),
    permissions: ["users:read"],
  }),
});

server.use(rateLimit({ requests: 100, window: "1m" }));
server.use(authorize({ require: ["users:read"] }));
```

Tool options include `timeout`, `maxConcurrency`, `cache`, `permissions`, `readOnly`, `dangerous`, `destructive`, and `confirmationRequired`.

```ts
server.tool("deleteUser", {
  confirmationRequired: true,
  destructive: true,
  handler: async () => ({ deleted: true }),
});
```

Confirmation-required calls must include request metadata with `confirmed: true`. Do not use metadata as proof of identity—authenticate and authorize sensitive operations.

## Transports

### Stdio

Stdio is the default transport and uses newline-delimited JSON-RPC messages.

```ts
await server.start({ transport: "stdio" });
```

### HTTP

HTTP exposes `POST /mcp` for JSON-RPC requests and `GET /health` for deployment health checks. Request bodies are capped at 1 MiB by default.

```ts
await server.start({ transport: "http", port: 3000 });
```

```json
{
  "status": "ok",
  "server": "my-server",
  "version": "1.0.0"
}
```

Custom adapters implement `MCPTransportAdapter` and can be passed to `server.start({ transport: adapter })`.

## Testing

Use the in-process test client to invoke handlers without starting a transport.

```ts
import { createMCPTestClient } from "@agent-utils/mcp-builder/testing";

const client = createMCPTestClient(server);
const user = await client.callTool("getUser", { userId: "123" });
```

## CLI

```bash
# Create a starter project
npx mcp-builder init my-server

# Generate editable tool stubs from an OpenAPI document
npx mcp-builder generate openapi.json --include="/users/*"

# Create a production Dockerfile
npx mcp-builder generate docker

# Check Node.js and essential project files
npx mcp-builder doctor

# Check for mcp.config.ts
npx mcp-builder validate
```

The commands `dev`, `build`, and `test` identify the matching project script and print the command to run. Use your package scripts directly for execution:

```bash
npm run dev
npm run build
npm test
```

## OpenAPI generation

The OpenAPI generator creates one editable TypeScript tool stub per selected operation in `src/tools/`. It maps common REST operations to names such as `getUserById`, `createUser`, and `deleteUser`.

```bash
npx mcp-builder generate ./openapi.json --exclude="/admin/*"
```

## Observability and errors

Subscribe to tool lifecycle events and inspect aggregate metrics:

```ts
server.on("tool:success", ({ name }) => console.log(`${name} succeeded`));
console.log(server.metrics());
```

Use `MCPError` for safe, structured errors. Unexpected errors are mapped to a generic message in production, and the default logger redacts fields that look like tokens, passwords, secrets, authorization values, or API keys.

```ts
import { MCPError } from "@agent-utils/mcp-builder";

throw new MCPError({
  code: "USER_NOT_FOUND",
  message: "User not found",
  details: { userId },
});
```

## Security

Validate all tool input, authenticate every sensitive request, enforce permissions server-side, and apply explicit confirmation for destructive operations. Avoid logging credentials or placing secrets in tool output. Review the [security policy](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/blob/main/SECURITY.md) before deploying publicly.

## Development

```bash
npm install
npm run validate
npm run build
```

See the [contribution guide](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/blob/main/CONTRIBUTING.md) for contribution guidance.

## Support

For questions, documentation feedback, or issues, email [dheerajatoria@gmail.com](mailto:dheerajatoria@gmail.com). For security vulnerabilities, follow the private reporting guidance in the [security policy](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/blob/main/SECURITY.md).
