import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { whop } from "@whop/cli/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Whop Websites build (TanStack Start + Cloudflare Workers):
// - tanstackStart() provides the file-based router (src/routes/*), the SSR
//   server entry (src/server.ts — TanStack Start renders the page, /api/*
//   routes are handled by server/worker.ts) and the client entry.
// - cloudflare({ viteEnvironment: { name: "ssr" } }) builds the Worker entry
//   into dist/server/index.js and the React app into dist/client.
// - whop() packs both into dist/whop-build.zip for `whop apps deploy`.
// The React plugin is added explicitly below (Start 1.168 does not manage it).
export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    whop({ disableTanstackDevtools: true }),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Local dev: forward API calls to the template's API server
      // (run `npm run server` in a second terminal, or `npm run build:server`
      // first). In production on Whop, dist/server handles these routes.
      "/api": "http://localhost:3001",
    },
  },
});
