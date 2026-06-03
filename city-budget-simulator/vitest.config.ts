import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@sim": path.resolve(__dirname, "src/simulation"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
