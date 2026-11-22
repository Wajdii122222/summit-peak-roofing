// ─────────────────────────────────────────────────────────────────────────────
// Summit Peak Roofing — Cloudflare Worker entry (dist/server on Whop hosting)
//
// Port of server/server.ts for the Workers runtime: same routes, no Express,
// no node:fs — leads/invoices/payments are kept in a per-isolate in-memory
// store (Workers have no local filesystem; persistence is best-effort only).
//
// Routes:
//   GET  /api/health    — config status (no secrets leaked)
//   POST /api/leads     — estimate form → Whop Events API `lead` event
//   POST /api/invoices  — create + send a Whop invoice (native Invoices API)
//   POST /api/pay       — charge a Payment Elements confirmation token
//   POST /api/webhooks  — payment.succeeded fulfillment (verified w/ SDK)
//
// All other paths serve the SPA from the ASSETS binding (with an index.html
// fallback for client-side routes).
//
// On Whop hosting, server-side fetch to ${WHOP_API_ORIGIN} gets the app's API
// key auto-injected by the outbound proxy, so WHOP_API_KEY can stay unset —
// "live" mode is decided by the configured plans + account id instead.
// With no plans/account configured, the server runs in DEMO mode: leads /
// invoices are stored locally and the responses say so honestly
// (whopEventSent / whopInvoiceSent === false). Nothing is faked as sent.
// ─────────────────────────────────────────────────────────────────────────────
import { unwrapWebhook } from "@whop/sdk/helpers";

export interface Env {
  /** Static-assets binding (dist/client). Present on Whop hosting. */
  ASSETS?: { fetch: (req: Request | string) => Promise<Response> };
  WHOP_API_KEY?: string;
  WHOP_API_ORIGIN?: string;
  WHOP_ACCOUNT_ID?: string;
  WHOP_WEBHOOK_SECRET?: string;
  WHOP_INSPECTION_PLAN_ID?: string;
  WHOP_DEPOSIT_PLAN_ID?: string;
}

const API_VERSION = "2026-10-24"; // native Invoices API needs >= 2026-10-24
const PRICES = { inspection: 149, deposit: 500 } as const;
const NAMES = {
  inspection: "Roof Inspection",
  deposit: "Project Deposit",
} as const;

type PlanKind = "inspection" | "deposit";

interface ResolvedConfig {
  apiKey: string;
  apiOrigin: string;
  accountId: string;
  webhookSecret: string;
  planIds: Record<PlanKind, string>;
  plansLive: boolean;
  /** True when the app is wired to Whop (real plans + account, or an API key). */
  live: boolean;
}

function resolveConfig(env: Env): ResolvedConfig {
  const planIds: Record<PlanKind, string> = {
    inspection: env.WHOP_INSPECTION_PLAN_ID || "plan_xxxxxxxxxxxxx",
    deposit: env.WHOP_DEPOSIT_PLAN_ID || "plan_xxxxxxxxxxxxx",
  };
  const plansLive = Object.values(planIds).every((p) => p !== "plan_xxxxxxxxxxxxx");
  const apiKey = env.WHOP_API_KEY || "";
  const accountId = env.WHOP_ACCOUNT_ID || "";
  return {
    apiKey,
    apiOrigin: env.WHOP_API_ORIGIN || "https://api.whop.com",
    accountId,
    webhookSecret: env.WHOP_WEBHOOK_SECRET || "",
    planIds,
    plansLive,
    live: plansLive && Boolean(accountId || apiKey),
  };
}

// ── In-memory store (replaces the filesystem persistence of server.ts) ──────
const memoryStore = new Map<string, Record<string, unknown>[]>();

function store(kind: string, record: Record<string, unknown>): void {
  const rows = memoryStore.get(kind) ?? [];
  rows.push({ ...record, storedAt: new Date().toISOString() });
  // Bound the memory so a long-lived isolate cannot grow without limit.
  if (rows.length > 500) rows.splice(0, rows.length - 500);
  memoryStore.set(kind, rows);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function whop(
  cfg: ResolvedConfig,
  method: string,
  pathName: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Api-Version-Date": API_VERSION,
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
  // Only send an Authorization header when a key is configured — on Whop
  // hosting the outbound proxy injects the app's API key automatically.
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  const res = await fetch(`${cfg.apiOrigin}/api/v1${pathName}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { type?: string; message?: string };
  };
  if (!res.ok) {
    throw new Error(
      `${data.error?.type ?? "whop_error"}: ${data.error?.message ?? `HTTP ${res.status}`}`,
    );
  }
  return data;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed.";
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = (await request.json()) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

// ── Route handlers ───────────────────────────────────────────────────────────
async function handleHealth(cfg: ResolvedConfig): Promise<Response> {
  return json({
    ok: true,
    mode: cfg.live ? "live" : "demo",
    plansConfigured: cfg.plansLive,
    accountConfigured: Boolean(cfg.accountId),
  });
}

async function handleLeads(request: Request, cfg: ResolvedConfig): Promise<Response> {
  const b = await readBody(request);
  if (!b.email || typeof b.email !== "string" || !b.email.includes("@")) {
    return json({ error: "A valid email is required." }, 400);
  }
  const leadId = `lead_${crypto.randomUUID().slice(0, 8)}`;
  const lead = {
    id: leadId,
    firstName: b.firstName ?? "",
    lastName: b.lastName ?? "",
    email: b.email,
    phone: b.phone ?? "",
    address: b.address ?? "",
    zip: b.zip ?? "",
    service: b.service ?? "",
    roofType: b.roofType ?? "",
    roofSizeSqft: b.roofSizeSqft ?? 0,
    roofAge: b.roofAge ?? "",
    estimateLow: b.estimateLow ?? 0,
    estimateHigh: b.estimateHigh ?? 0,
    message: b.message ?? "",
  };
  store("leads", lead);

  // Whop Events API — server-side `lead` event (the pixel's browser-side
  // `whop.track("lead")` is the same event; the server copy carries the full
  // lead record for attribution). Requires the `event:create` scope.
  let whopEventSent = false;
  if (cfg.live && cfg.accountId) {
    try {
      await whop(cfg, "POST", "/events", {
        account_id: cfg.accountId,
        event_name: "lead",
        event_id: leadId,
        user: {
          email: lead.email,
          phone: String(lead.phone || ""),
          first_name: String(lead.firstName || ""),
          last_name: String(lead.lastName || ""),
        },
        value:
          typeof lead.estimateHigh === "number" && lead.estimateHigh > 0
            ? Math.round((Number(lead.estimateLow) + Number(lead.estimateHigh)) / 2)
            : undefined,
        currency: "usd",
        // NOTE: the Events API rejects ANY `context` fields on this
        // endpoint (verified: with context → 400 parameter_invalid;
        // without → 200). Do not re-add context here.
      });
      whopEventSent = true;
    } catch (err) {
      console.error("[leads] Whop event failed:", err);
    }
  }
  return json({ ok: true, leadId, whopEventSent });
}

async function handleInvoices(request: Request, cfg: ResolvedConfig): Promise<Response> {
  const b = await readBody(request);
  const kind: PlanKind = b.kind === "deposit" ? "deposit" : "inspection";
  if (!b.email || typeof b.email !== "string" || !b.email.includes("@")) {
    return json({ error: "A valid email is required." }, 400);
  }
  const name = `${String(b.firstName ?? "")} ${String(b.lastName ?? "")}`.trim() || "Customer";

  // Demo mode (no API key / no plans): persist the request and say so.
  if (!cfg.live) {
    const n = String(Date.now()).slice(-6);
    const invoiceNumber = `#DEMO-${n}`;
    store("invoices", {
      id: `demo_${crypto.randomUUID().slice(0, 8)}`,
      number: invoiceNumber,
      kind,
      amount: PRICES[kind],
      email: b.email,
      name,
      whopInvoiceSent: false,
    });
    return json({
      ok: true,
      invoiceId: `demo_${n}`,
      invoiceNumber,
      whopInvoiceSent: false,
    });
  }

  try {
    // 1. Create a draft (POST /invoices) — charges nothing, emails no one.
    const invoice = (await whop(
      cfg,
      "POST",
      "/invoices",
      {
        account_id: cfg.accountId || undefined,
        email_address: b.email,
        customer_name: name,
        items: [{ plan_id: cfg.planIds[kind], quantity: 1 }],
        metadata: {
          kind,
          source: "summit-peak-roofing-website",
          ...(typeof b.address === "string" && b.address ? { address: b.address } : {}),
        },
      },
      crypto.randomUUID(),
    )) as { id: string; number: string; status: string };

    // 2. Send it — issues the invoice and emails it to the customer.
    await whop(cfg, "POST", `/invoices/${invoice.id}/send`, {}, crypto.randomUUID());
    store("invoices", {
      id: invoice.id,
      number: invoice.number,
      kind,
      amount: PRICES[kind],
      email: b.email,
      name,
      whopInvoiceSent: true,
    });
    return json({
      ok: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      whopInvoiceSent: true,
    });
  } catch (err) {
    console.error("[invoices]", err);
    return json({ error: errorMessage(err) || "Could not create the invoice." }, 502);
  }
}

async function handlePay(request: Request, cfg: ResolvedConfig): Promise<Response> {
  const b = await readBody(request);
  if (typeof b.confirmationToken !== "string" || !b.confirmationToken.startsWith("ctok_")) {
    return json({ error: "Missing confirmation token." }, 400);
  }
  if (!cfg.live) {
    return json(
      {
        error:
          "Checkout is not connected yet — connect the Whop plans in src/config.ts first.",
      },
      503,
    );
  }
  const kind: PlanKind = b.kind === "deposit" ? "deposit" : "inspection";
  try {
    // POST /payments — charges the variant with the token's payment method.
    // Collection runs in the background; the response is the payment as
    // created, not its outcome (see the client-side handleNextAction flow).
    const payment = (await whop(
      cfg,
      "POST",
      "/payments",
      {
        confirmation_token: b.confirmationToken,
        line_items: [{ variant_id: cfg.planIds[kind], quantity: 1 }],
        metadata: { order_id: String(b.orderId ?? ""), kind },
        return_url: `${request.headers.get("origin") ?? ""}/checkout/return?order=${String(b.orderId ?? "")}`,
      },
      crypto.randomUUID(),
    )) as { id: string; status: string; client_secret?: string };
    return json({ id: payment.id, status: payment.status, client_secret: payment.client_secret });
  } catch (err) {
    console.error("[pay]", err);
    return json({ error: errorMessage(err) || "Payment could not be created." }, 502);
  }
}

async function handleWebhooks(request: Request, cfg: ResolvedConfig): Promise<Response> {
  if (!cfg.webhookSecret) {
    return json({ error: "Webhook secret not configured." }, 500);
  }
  try {
    // The signature covers the exact bytes sent — verify the raw text,
    // never a re-serialized body.
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    for (const name of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
      const value = request.headers.get(name);
      if (value) headers[name] = value;
    }
    const event = unwrapWebhook(rawBody, { headers, key: cfg.webhookSecret }) as {
      type?: string;
      data?: { id?: string; metadata?: Record<string, string> };
    };
    if (event?.type === "payment.succeeded") {
      const payment = event.data ?? {};
      console.info("[webhook] payment.succeeded", payment.id, payment.metadata);
      store("payments", {
        paymentId: payment.id,
        metadata: payment.metadata ?? {},
        event: "payment.succeeded",
      });
      // Fulfillment happens here: mark the order paid, schedule the
      // inspection / lock the install date, send the confirmation email.
    }
    return json({ received: true });
  } catch (err) {
    console.error("[webhook] verification failed:", err);
    return json({ error: "Invalid webhook signature." }, 400);
  }
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const cfg = resolveConfig(env);
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/api/health" && request.method === "GET") return handleHealth(cfg);
  if (path === "/api/leads" && request.method === "POST") return handleLeads(request, cfg);
  if (path === "/api/invoices" && request.method === "POST") return handleInvoices(request, cfg);
  if (path === "/api/pay" && request.method === "POST") return handlePay(request, cfg);
  if (path === "/api/webhooks" && request.method === "POST") return handleWebhooks(request, cfg);
  return json({ error: "Not found." }, 404);
}

// ── Worker entry ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    // Static assets / SPA fallback via the ASSETS binding.
    if (env.ASSETS && (request.method === "GET" || request.method === "HEAD")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
      // Client-side route (e.g. /checkout/return) — serve the SPA shell.
      return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }

    return new Response("Not found", { status: 404 });
  },
};
