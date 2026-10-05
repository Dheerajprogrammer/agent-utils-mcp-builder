# OpenAPI helpers

Import helpers from `@agent-utils/mcp-builder/openapi` when you need to inspect or generate from an OpenAPI document programmatically.

```ts
import { loadOpenApi, parseOpenApi, operationName } from "@agent-utils/mcp-builder/openapi";

const document = await loadOpenApi("./openapi.json");
const operations = parseOpenApi(document, { exclude: /admin/ });

for (const operation of operations) {
  console.log(operation.name, operation.method, operation.path);
}

console.log(operationName("GET", "/users/{id}")); // getUserById
```

## Exports

| Export | Description |
| --- | --- |
| `loadOpenApi(file)` | Reads and parses a JSON OpenAPI file. |
| `parseOpenApi(document, filter?)` | Returns supported GET, POST, PUT, PATCH, and DELETE operations. |
| `operationName(method, path)` | Produces a conventional tool name. |
| `generatedToolSource(operation)` | Creates the source for an editable tool stub. |
| `generatedFileName(operation)` | Produces a kebab-case TypeScript filename. |
