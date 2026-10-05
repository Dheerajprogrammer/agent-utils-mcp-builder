# Resources and prompts

Resources expose data addressed by a URI. Prompts provide reusable message templates for clients.

## Resources

Use a fixed URI for a singleton resource:

```ts
server.resource("serviceStatus", {
  uri: "status://service",
  handler: async () => ({ healthy: true, checkedAt: new Date().toISOString() }),
});
```

Use `{parameter}` in a URI for dynamic resources. Parameters are passed to the handler.

```ts
server.resource("user", {
  uri: "users://{id}",
  description: "A user profile",
  handler: async ({ id }) => database.users.findById(id),
});
```

Resource URIs must be unique. A request for an unknown URI returns an `MCPError` with code `RESOURCE_NOT_FOUND`.

## Prompts

A prompt returns either a string or an object with `messages`.

```ts
server.prompt("reviewCode", {
  description: "Generate a code review request",
  arguments: {
    language: "string",
    code: "string",
  },
  handler: ({ language, code }) => `Review this ${language} code:\n\n${code}`,
});
```

Returning structured messages gives you complete control over prompt roles and content:

```ts
server.prompt("releaseNotes", {
  arguments: { changes: "string" },
  handler: ({ changes }) => ({
    messages: [
      { role: "user", content: { type: "text", text: `Write release notes for:\n${changes}` } },
    ],
  }),
});
```

Use `defineResource()` and `definePrompt()` to create reusable exported definitions in your own project structure.
