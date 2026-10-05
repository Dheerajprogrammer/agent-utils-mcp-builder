# Tools and schemas

Tools are callable operations. A tool has a stable name, an optional description, an input schema, and a handler.

## Shorthand schemas

Use shorthand fields for compact definitions. A field can be `string`, `number`, `boolean`, or `unknown`; use `optional: true` for optional fields.

```ts
server.tool("searchUsers", {
  description: "Search the user directory",
  input: {
    query: "string",
    limit: { type: "number", optional: true },
  },
  handler: async ({ query, limit = 20 }) => searchUsers(query, limit),
});
```

## Zod schemas

Pass a Zod schema as `inputSchema` for rich validation and inferred handler input types.

```ts
import { z } from "zod";

server.tool("createUser", {
  inputSchema: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  handler: async ({ name, email }) => database.users.create({ name, email }),
});
```

## JSON Schema

JSON Schema objects are also accepted. This is useful when schemas come from external contracts.

```ts
server.tool("setEnabled", {
  inputSchema: {
    type: "object",
    properties: { enabled: { type: "boolean" } },
    required: ["enabled"],
    additionalProperties: false,
  },
  handler: ({ enabled }) => ({ enabled }),
});
```

## Handler context

The second handler argument contains request-scoped utilities.

```ts
server.tool("syncAccount", {
  input: { accountId: "string" },
  handler: async ({ accountId }, ctx) => {
    ctx.signal.throwIfAborted();
    ctx.logger.info("Syncing account", { requestId: ctx.requestId, accountId });
    return ctx.retry(() => syncAccount(accountId), { retries: 2, delay: 250 });
  },
});
```

It includes `requestId`, `logger`, `auth`, `metadata`, `signal`, `services`, `transport`, and `retry`.
