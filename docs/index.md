---
layout: home

hero:
  name: MCP Builder
  text: Production-minded MCP servers, without the boilerplate
  tagline: Define validated tools, resources, prompts, middleware, and transports with a small TypeScript API.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: View on npm
      link: https://www.npmjs.com/package/@agent-utils/mcp-builder

features:
  - title: Express-like API
    details: Register tools, resources, and prompts in a few readable lines of TypeScript.
  - title: Safe defaults
    details: Input validation, structured errors, request IDs, redacted logs, timeouts, and cancellation support.
  - title: Built for production
    details: Middleware, authentication hooks, permissions, rate limiting, caching, concurrency limits, and metrics.
  - title: Testable locally
    details: Exercise tools in-process with a dedicated test client—no transport or MCP host required.
  - title: Flexible transport
    details: Use stdio, HTTP with a health endpoint, or implement a custom transport adapter.
  - title: Useful tooling
    details: Scaffold projects, generate OpenAPI tool stubs, check project health, and produce Dockerfiles.
---

## Install

```bash
npm install @agent-utils/mcp-builder zod
```

```ts
import { createMCPServer } from "@agent-utils/mcp-builder";

const server = createMCPServer({ name: "hello", version: "1.0.0" });
server.tool("greet", {
  input: { name: "string" },
  handler: ({ name }) => ({ message: `Hello, ${name}!` }),
});
await server.start();
```

For questions or help, email [dheerajatoria@gmail.com](mailto:dheerajatoria@gmail.com).

Source code and contribution guidelines are available on [GitHub](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder).
