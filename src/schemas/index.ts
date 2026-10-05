import { z, type ZodTypeAny } from "zod";

export type ShorthandField = "string" | "number" | "boolean" | "unknown" | { type: "string" | "number" | "boolean" | "unknown"; optional?: boolean };
export type ShorthandSchema = Record<string, ShorthandField>;
export type SchemaLike<T = unknown> = undefined | ((ZodTypeAny | ShorthandSchema | JsonSchema) & { readonly __inputType?: T });
export interface JsonSchema { type?: string; properties?: Record<string, JsonSchema>; required?: string[]; enum?: unknown[]; items?: JsonSchema; additionalProperties?: boolean; [key: string]: unknown }

const primitive = (type: string) => type === "string" ? z.string() : type === "number" ? z.number() : type === "boolean" ? z.boolean() : z.unknown();
export const shorthandToZod = (schema: ShorthandSchema) => z.object(Object.fromEntries(Object.entries(schema).map(([key, field]) => {
  const config = typeof field === "string" ? { type: field, optional: false } : field;
  const value = primitive(config.type);
  return [key, config.optional ? value.optional() : value];
})));
export const jsonSchemaToZod = (schema: JsonSchema): ZodTypeAny => {
  let result: ZodTypeAny;
  if (schema.enum) result = z.enum(schema.enum as [string, ...string[]]);
  else if (schema.type === "string") result = z.string();
  else if (schema.type === "number" || schema.type === "integer") result = z.number();
  else if (schema.type === "boolean") result = z.boolean();
  else if (schema.type === "array") result = z.array(schema.items ? jsonSchemaToZod(schema.items) : z.unknown());
  else if (schema.type === "object" || schema.properties) {
    const properties = Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, value]) => [key, jsonSchemaToZod(value)]));
    result = z.object(properties).strict();
    if (schema.required) result = z.object(Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, schema.required?.includes(key) ? value : value.optional()]))).strict();
  } else result = z.unknown();
  return result;
};
export const asZodSchema = <T>(schema: SchemaLike<T>) => !schema ? undefined : "safeParse" in schema ? schema as ZodTypeAny : "type" in schema ? jsonSchemaToZod(schema as JsonSchema) : shorthandToZod(schema as ShorthandSchema);
export const zodToJsonSchema = (schema?: ZodTypeAny): JsonSchema => {
  if (!schema) return { type: "object", properties: {}, additionalProperties: false };
  // Zod v3's public JSON-schema conversion is intentionally not assumed; retain the runtime schema for validation.
  return { type: "object", additionalProperties: false, description: "Validated by the server's Zod schema" };
};
