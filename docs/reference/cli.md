# CLI reference

Run the CLI with `npx mcp-builder <command>`.

| Command | Description |
| --- | --- |
| `init [name]` | Creates a starter TypeScript server project. |
| `generate <openapi.json>` | Creates editable tool stubs from OpenAPI operations. |
| `generate docker` | Writes a Dockerfile for a built server. |
| `doctor` | Checks Node.js, `package.json`, and `mcp.config.ts`. |
| `validate` | Checks for `mcp.config.ts`. |
| `dev` | Identifies the project `dev` script. |
| `build` | Identifies the project `build` script. |
| `test` | Identifies the project `test` script. |

## Init

```bash
npx mcp-builder init customer-support
```

The generated project includes a source entry point, feature folders, tests, config, package manifest, TypeScript config, and a README.

## Generate from OpenAPI

```bash
npx mcp-builder generate ./openapi.json
npx mcp-builder generate ./openapi.json --include="/users/*"
npx mcp-builder generate ./openapi.json --exclude="/admin/*"
```

Generated tools intentionally contain a placeholder implementation. Review the generated files, add authentication and request mapping, then replace the placeholder with your application logic.

## Docker

```bash
npx mcp-builder generate docker
docker build -t my-mcp-server .
```
