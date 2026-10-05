# Transports

MCP Builder separates server logic from transports. Start the same server over stdio, HTTP, or a custom adapter.

## Stdio

Stdio is the default transport. It reads newline-delimited JSON-RPC requests from standard input and writes responses to standard output.

```ts
await server.start({ transport: "stdio" });
```

Keep regular application output out of `stdout`; use the structured logger, which writes to `stderr`.

## HTTP

The built-in HTTP transport provides a JSON-RPC endpoint and a deployment-friendly health endpoint.

```ts
await server.start({ transport: "http", port: 3000 });
```

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/mcp` | `POST` | JSON-RPC request endpoint |
| `/health` | `GET` | Reports server name, version, and `ok` status |

The HTTP adapter uses a 1 MiB maximum request body by default. Supply `new HttpTransport({ port, maxBodySize })` if you need a different limit.

## Custom transports

Implement `MCPTransportAdapter` when a platform has its own request lifecycle.

```ts
import type { MCPTransportAdapter, MCPTransportServer } from "@agent-utils/mcp-builder";

class MyTransport implements MCPTransportAdapter {
  readonly name = "my-transport";

  async start(server: MCPTransportServer) {
    // Forward platform requests to server.handle({ method, params, metadata }).
  }

  async stop() {
    // Close platform resources.
  }
}

await server.start({ transport: new MyTransport() });
```
