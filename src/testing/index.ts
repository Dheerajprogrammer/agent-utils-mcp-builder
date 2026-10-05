import type { MCPServer } from "../server/index.js";
export const createMCPTestClient = (server: MCPServer<any>, options?: { mocks?: object }) => ({
  callTool: (name: string, input: unknown, metadata?: Record<string, unknown>) => server.callTool(name, input, { method: "tools/call", metadata: { ...metadata, mocks: options?.mocks } }),
  readResource: (uri: string) => server.handle({ method: "resources/read", params: { uri } }),
  getPrompt: (name: string, args?: object) => server.handle({ method: "prompts/get", params: { name, arguments: args } }),
  info: () => server.info(),
});
export const expectTool = (server: MCPServer<any>, name: string, input: unknown) => ({ toMatchSnapshot: async () => server.callTool(name, input) });
