import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` serves the frontend with HMR and forwards /api to
// `npm run dev:api` (wrangler pages dev with a local D1 database).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8788",
    },
  },
});
