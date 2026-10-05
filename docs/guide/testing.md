# Testing

`createMCPTestClient` invokes your server in-process. It is fast, deterministic, and does not require a process transport or MCP host.

```ts
import { describe, expect, it } from "vitest";
import { createMCPServer } from "@agent-utils/mcp-builder";
import { createMCPTestClient } from "@agent-utils/mcp-builder/testing";

describe("getUser", () => {
  it("returns a user", async () => {
    const server = createMCPServer({ name: "test", version: "1.0.0", logger: false });
    server.tool("getUser", {
      input: { id: "string" },
      handler: ({ id }) => ({ id, name: "Ada" }),
    });

    const client = createMCPTestClient(server);
    await expect(client.callTool("getUser", { id: "user_123" })).resolves.toEqual({
      id: "user_123",
      name: "Ada",
    });
  });
});
```

## Test resources and prompts

```ts
const profile = await client.readResource("users://user_123");
const prompt = await client.getPrompt("reviewCode", { language: "TypeScript", code: "const n = 1" });
```

## Passing mocks

Pass mocks to your client when a test helper needs to provide test-specific context metadata.

```ts
const client = createMCPTestClient(server, {
  mocks: { database: fakeDatabase },
});
```

For application dependencies, prefer injecting a test service container with `createMCPServer({ services })` or `server.services(services)`.
