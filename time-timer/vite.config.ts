import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Build into the FastAPI static tree for production serving. */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dashboard/static/time-timer",
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
