# Contributing

Thanks for contributing to `@agent-utils/mcp-builder`. Contributions of code, documentation, examples, and bug reports are welcome.

## Before you begin

- Search [existing issues](https://github.com/Dheerajprogrammer/agent-utils-mcp-builder/issues) before opening a new one.
- For substantial changes, open an issue first so the approach can be discussed.
- Report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md); do not open a public issue for them.

## Local development

Use Node.js 18.17 or newer.

```bash
git clone https://github.com/Dheerajprogrammer/agent-utils-mcp-builder.git
cd agent-utils-mcp-builder
npm install
npm run validate
npm run docs:build
```

## Pull requests

1. Create a focused branch from `main`.
2. Add or update tests for behavior changes.
3. Update the documentation when a public API or CLI behavior changes.
4. Run `npm run validate` and `npm run docs:build` before submitting.
5. Describe the change, its motivation, and any migration considerations in the pull request.

Do not commit secrets, credentials, generated `dist` files, or unrelated formatting changes.
