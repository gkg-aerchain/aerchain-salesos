import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 3002,
    open: true,
    host: true,
    allowedHosts: "all",
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      // Keep @anthropic-ai/sdk out of the client bundle — it's server-side only
      external: ["@anthropic-ai/sdk"],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
