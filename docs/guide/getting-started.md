# Getting started

MCP Builder is a TypeScript toolkit for exposing application capabilities to MCP clients. It keeps your server definition close to ordinary application code while handling input validation, lifecycle events, errors, and transport plumbing.

## Prerequisites

- Node.js 18.17 or later
- npm, pnpm, or yarn

## Install

```bash
npm install @agent-utils/mcp-builder zod
```

## Your first server

Create `src/index.ts`:

```ts
import { createMCPServer } from "@agent-utils/mcp-builder";

const server = createMCPServer({
  name: "hello-server",
  version: "1.0.0",
});

server.tool("greet", {
  description: "Greet a person by name",
  input: { name: "string" },
  handler: async ({ name }) => ({ message: `Hello, ${name}!` }),
});

await server.start({ transport: "stdio" });
```

Run it with your preferred TypeScript runner. For example, add `tsx` and use `tsx src/index.ts`.

## Start from a scaffold

```bash
npx mcp-builder init my-server
cd my-server
npm install
npm run dev
```

The scaffold includes `src/tools`, `src/resources`, `src/prompts`, `src/middleware`, `tests`, `mcp.config.ts`, and TypeScript configuration.

## Next steps

- Add validated [tools and schemas](/guide/tools).
- Define [resources and prompts](/guide/resources-prompts).
- Protect sensitive operations with [middleware and authentication](/guide/middleware-auth).
