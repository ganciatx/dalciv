import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Build into the FastAPI static tree for production serving. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sim": path.resolve(__dirname, "src/simulation"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dashboard/static/city-budget-simulator"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
