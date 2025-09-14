import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  css: false,
  esbuild: {
    target: "node14",
  },
});
