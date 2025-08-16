import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // This ensures the dev server responds with index.html for any path
    host: true,
    strictPort: true,
  },
  preview: {
    // This ensures the preview server responds with index.html for any path
    port: 4173,
    strictPort: true,
  },
});
