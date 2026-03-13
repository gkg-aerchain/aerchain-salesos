import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/aerchain-pricing-proposals/" : "/",
  plugins: [react()],
  server: {
    port: 3002,
    open: true,
    host: true,
    allowedHosts: "all",
  },
});
