import { readFile } from "node:fs/promises";
import { basename } from "node:path";
export interface OpenApiOperation { name: string; method: string; path: string; description?: string; }
export const operationName = (method: string, path: string) => {
  const parts = path.split("/").filter(Boolean); const singular = (word: string) => word.endsWith("s") ? word.slice(0, -1) : word;
  const resource = parts[0] ? singular(parts[0]).replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase()) : "Root";
  const id = parts.find((part) => /^\{.+\}$/.test(part));
  const prefix = ({ get: id ? "get" : "list", post: "create", put: "update", patch: "update", delete: "delete" } as Record<string, string>)[method.toLowerCase()] ?? method.toLowerCase();
  return `${prefix}${resource}${id && method.toLowerCase() === "get" ? "By" + id.slice(1, -1).replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase()) : ""}`;
};
export const parseOpenApi = (document: { paths?: Record<string, Record<string, { operationId?: string; summary?: string }>> }, filter: { include?: RegExp; exclude?: RegExp } = {}): OpenApiOperation[] => Object.entries(document.paths ?? {}).flatMap(([path, methods]) => Object.entries(methods).filter(([method]) => /^(get|post|put|patch|delete)$/i.test(method)).filter(() => (!filter.include || filter.include.test(path)) && (!filter.exclude || !filter.exclude.test(path))).map(([method, operation]) => ({ name: operation.operationId ?? operationName(method, path), method: method.toUpperCase(), path, description: operation.summary })));
export const loadOpenApi = async (file: string) => JSON.parse(await readFile(file, "utf8")) as { paths?: Record<string, Record<string, { operationId?: string; summary?: string }>> };
export const generatedToolSource = (operation: OpenApiOperation) => `import { defineTool } from "@agent-utils/mcp-builder";\n\nexport default defineTool({\n  name: "${operation.name}",\n  description: ${JSON.stringify(operation.description ?? `${operation.method} ${operation.path}`)},\n  handler: async () => {\n    throw new Error("Implement ${operation.method} ${operation.path}");\n  }\n});\n`;
export const generatedFileName = (operation: OpenApiOperation) => `${operation.name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}.ts`;
export const sourceName = (file: string) => basename(file);
