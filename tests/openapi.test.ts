import { describe, expect, it } from "vitest";
import { operationName, parseOpenApi } from "../src/openapi/index.js";
describe("OpenAPI helpers", () => { it("creates useful names", () => { expect(operationName("GET", "/users/{id}")).toBe("getUserById"); }); it("filters operations", () => { expect(parseOpenApi({ paths: { "/users": { get: {} }, "/admin": { get: {} } } }, { exclude: /admin/ })).toHaveLength(1); }); });
