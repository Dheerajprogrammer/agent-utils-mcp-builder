import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/index.ts", "src/testing/index.ts", "src/middleware/index.ts", "src/openapi/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  banner: { js: "#!/usr/bin/env node" }
});
