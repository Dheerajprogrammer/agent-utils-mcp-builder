import { defineConfig } from "vitepress";

export default defineConfig({
  title: "MCP Builder",
  description: "Build TypeScript MCP servers with an Express-like API.",
  base: "/agent-utils-mcp-builder/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API Reference", link: "/reference/server" },
      { text: "npm", link: "https://www.npmjs.com/package/@agent-utils/mcp-builder" },
      { text: "GitHub", link: "https://github.com/Dheerajprogrammer/agent-utils-mcp-builder" },
    ],
    sidebar: {
      "/guide/": [
        { text: "Guide", items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Tools & schemas", link: "/guide/tools" },
          { text: "Resources & prompts", link: "/guide/resources-prompts" },
          { text: "Middleware & auth", link: "/guide/middleware-auth" },
          { text: "Transports", link: "/guide/transports" },
          { text: "Testing", link: "/guide/testing" },
          { text: "Production", link: "/guide/production" },
        ] },
      ],
      "/reference/": [
        { text: "Reference", items: [
          { text: "Server API", link: "/reference/server" },
          { text: "CLI", link: "/reference/cli" },
          { text: "OpenAPI", link: "/reference/openapi" },
          { text: "Errors & logging", link: "/reference/errors-logging" },
        ] },
      ],
    },
    socialLinks: [{ icon: "github", link: "https://github.com/Dheerajprogrammer/agent-utils-mcp-builder" }],
    footer: { message: "Released under the MIT License.", copyright: "Copyright © 2026 Agent Utils" },
    search: { provider: "local" },
  },
});
