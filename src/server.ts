// ─────────────────────────────────────────────────────────────────────────────
// Summit Peak Roofing — Cloudflare Worker entry (dist/server on Whop hosting)
//
// TanStack Start server entry with the template's existing /api/* routes
// mounted in front of it: API requests are handled by server/worker.ts
// (same handlers, env-based config, @whop/sdk webhook verification);
// everything else is rendered by TanStack Start (SSR + hydration).
// ─────────────────────────────────────────────────────────────────────────────
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { handleApi, type Env } from "../server/worker";

const startFetch = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    return startFetch(request);
  },
};
