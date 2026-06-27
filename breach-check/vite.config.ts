import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Build into the FastAPI static tree for production serving. */
export default defineConfig({
  plugins: [react()],
  // So /static/breach-check/index.html resolves JS/CSS correctly if opened directly.
  base: "/static/breach-check/",
  server: {
    proxy: {
      "/api/breach-check": "http://127.0.0.1:8765",
    },
  },
  build: {
    outDir: "../dashboard/static/breach-check",
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
