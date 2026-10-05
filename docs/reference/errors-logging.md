# Errors and logging

## Structured errors

Throw `MCPError` for expected, safe-to-display failures.

```ts
import { MCPError } from "@agent-utils/mcp-builder";

server.tool("getUser", {
  input: { id: "string" },
  handler: async ({ id }) => {
    const user = await database.users.findById(id);
    if (!user) {
      throw new MCPError({
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: { id },
        status: 404,
      });
    }
    return user;
  },
});
```

Unexpected errors are returned as `INTERNAL_ERROR`. In production, their internal messages are not exposed to clients.

## Logging

The default structured logger writes JSON to `stderr` and includes timestamps. Tool calls include a request ID and duration.

```ts
const server = createMCPServer({
  name: "api-tools",
  version: "1.0.0",
  logger: true,
});
```

Set `logger: false` to silence default logging or pass an object that implements `debug`, `info`, `warn`, and `error`.

```ts
const server = createMCPServer({
  name: "api-tools",
  version: "1.0.0",
  logger: {
    debug: (message, fields) => appLogger.debug(fields, message),
    info: (message, fields) => appLogger.info(fields, message),
    warn: (message, fields) => appLogger.warn(fields, message),
    error: (message, fields) => appLogger.error(fields, message),
  },
});
```

The built-in logger redacts fields whose names resemble credentials, including `token`, `secret`, `password`, `authorization`, and `apiKey`.
