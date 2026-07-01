import path from "node:path";
import { defineConfig } from "vite";

/** Build into the FastAPI static tree for production serving. */
export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/static/council-accountability/",
  build: {
    outDir: path.resolve(__dirname, "../dashboard/static/council-accountability"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
