import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    compression({ algorithm: "gzip", ext: ".gz" }),
    compression({ algorithm: "brotliCompress", ext: ".br" }),
  ],
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
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
});
