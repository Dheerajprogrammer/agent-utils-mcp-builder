import type { Middleware, PromptOptions, ResourceOptions, ToolOptions } from "./core/types.js";
export const defineTool = <Input>(definition: ToolOptions<Input> & { name: string }) => definition;
export const defineResource = <Input extends Record<string, string>>(definition: ResourceOptions<Input> & { name: string }) => definition;
export const definePrompt = <Input>(definition: PromptOptions<Input> & { name: string }) => definition;
export const defineMiddleware = (middleware: Middleware) => middleware;
export const defineMCPConfig = <T>(config: T) => config;
