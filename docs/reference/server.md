# Server API

## `createMCPServer(options)`

Creates an `MCPServer` instance.

```ts
const server = createMCPServer({
  name: "company-tools",
  version: "1.0.0",
  timeout: 30_000,
  maxConcurrency: 10,
  logger: true,
  services: { users: userService },
});
```

| Option | Description |
| --- | --- |
| `name` | Required server identifier. |
| `version` | Required server version. |
| `timeout` | Default tool timeout in milliseconds. |
| `maxConcurrency` | Default maximum concurrent calls per tool. |
| `logger` / `logging` | `true`, `false`, or a custom logger. |
| `services` | Application services exposed as `ctx.services`. |
| `env` | Required environment variable declarations. |
| `transport` | Default `stdio`, `http`, or a transport adapter. |

## Registration methods

### `server.tool(name, options[, handler])`

Registers a callable tool. Options include `description`, `input`, `inputSchema`, `handler`, `permissions`, `timeout`, `maxConcurrency`, `cache`, `dangerous`, `destructive`, `readOnly`, and `confirmationRequired`.

### `server.resource(name, options)`

Registers a resource with required `uri` and `handler` options. URI segments wrapped in braces are passed to the handler as strings.

### `server.prompt(name, options)`

Registers a prompt with `description`, `arguments`, and `handler` options.

### `server.use(middleware)`

Adds middleware around tool calls. Middleware has the signature `(context, next) => Promise<void> | void`.

### `server.auth(adapter)`

Sets an auth adapter. Pass a custom object with `authenticate()` or `{ type: "bearer", validate() }`.

### `server.services(services)`

Replaces the service container used by subsequent handler calls.

### `server.on(event, listener)`

Subscribes to `tool:start`, `tool:success`, or `tool:error`; returns an unsubscribe function.

## Lifecycle and introspection

| Method | Description |
| --- | --- |
| `start({ transport, port })` | Starts a transport; defaults to stdio. |
| `stop()` | Stops the current transport. |
| `handle(request)` | Handles an MCP JSON-RPC-style request. |
| `callTool(name, input, request?)` | Invokes a registered tool directly. |
| `info()` | Returns metadata for tools, resources, and prompts. |
| `metrics()` | Returns tool calls, successes, errors, average latency, and P95 latency. |
| `http({ baseURL, headers? })` | Returns a small JSON HTTP client with `get`, `post`, and `request`. |
