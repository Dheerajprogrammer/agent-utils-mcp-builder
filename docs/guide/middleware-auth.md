# Middleware and authentication

Middleware wraps tool execution. Use it for logging, tracing, authorization, timing, or application-specific controls.

## Middleware

Middleware receives a context plus `method`, `name`, and `input`, and must call `next()` to continue.

```ts
server.use(async (ctx, next) => {
  const started = performance.now();
  try {
    await next();
    ctx.logger.info("Request completed", { name: ctx.name, durationMs: performance.now() - started });
  } catch (error) {
    ctx.logger.error("Request failed", { name: ctx.name });
    throw error;
  }
});
```

Register middleware before invoking tools. It runs in registration order.

## Bearer authentication

Attach an authentication adapter with `server.auth()`. The bearer helper removes the `Bearer ` prefix and supplies the result as `ctx.auth`.

```ts
server.auth({
  type: "bearer",
  validate: async (token) => {
    const session = await sessions.verify(token);
    return {
      subject: session.userId,
      permissions: session.permissions,
    };
  },
});
```

Never write tokens or credentials to logs. The default logger redacts common credential-like field names.

## Authorization

The `authorize` middleware checks permissions returned by your authentication layer.

```ts
import { authorize } from "@agent-utils/mcp-builder/middleware";

server.use(authorize({ require: ["users:delete"] }));
server.tool("deleteUser", {
  input: { id: "string" },
  destructive: true,
  confirmationRequired: true,
  handler: ({ id }) => database.users.delete(id),
});
```

Confirmation-required tools additionally need request metadata with `confirmed: true`. This is an explicit safety signal, not an authorization mechanism.

## Rate limiting

```ts
import { rateLimit } from "@agent-utils/mcp-builder/middleware";

server.use(rateLimit({ requests: 100, window: "1m" }));
```

The built-in limiter keys authenticated requests by `auth.subject`; unauthenticated requests share an `anonymous` bucket.
