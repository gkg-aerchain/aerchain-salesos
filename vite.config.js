import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/aerchain-pricing-proposals/",
  plugins: [react()],
  build: {
    target: "es2015",
  },
  server: {
    port: 3002,
    open: true,
    host: true,
    allowedHosts: "all",
  },
});
