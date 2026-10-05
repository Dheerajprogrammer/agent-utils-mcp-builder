# Production guide

This checklist covers the controls most MCP servers need before they are exposed to real users.

## Validate every input

Prefer Zod for input that has constraints beyond primitive types. Validation runs before the tool handler and returns `INVALID_INPUT` on failure.

## Timeouts, cancellation, and concurrency

Set global defaults when tools share an operating envelope, then override exceptions per tool.

```ts
const server = createMCPServer({
  name: "billing",
  version: "1.0.0",
  timeout: 30_000,
  maxConcurrency: 20,
});

server.tool("charge", {
  timeout: 10_000,
  maxConcurrency: 5,
  handler: async (_input, ctx) => {
    ctx.signal.throwIfAborted();
    // Call the provider.
  },
});
```

## Cache idempotent reads

Only cache results that are safe to reuse for the same input and caller context.

```ts
server.tool("getCatalog", {
  cache: { ttl: 60_000 },
  handler: () => catalog.list(),
});
```

## Use explicit controls for high-impact tools

Use authorization, `destructive`, and `confirmationRequired` for actions that change data or systems. Never rely on a model-generated argument as the only approval mechanism.

## Monitor tool behavior

Subscribe to lifecycle events and report metrics to your existing monitoring stack.

```ts
server.on("tool:error", ({ name, error }) => monitor.captureException(error, { tags: { tool: name } }));
console.log(server.metrics());
```

## HTTP deployment

Expose only the endpoints required by your deployment, terminate TLS at your platform or proxy, and use `GET /health` for readiness checks. Keep credentials in environment variables; do not include them in source code or logs.
