// ─────────────────────────────────────────────────────────────────────────────
// Summit Peak Roofing — API server (dist/server on Whop hosting)
//
// Routes:
//   GET  /api/health    — config status (no secrets leaked)
//   POST /api/leads     — estimate form → Whop Events API `lead` event
//                        (docs: https://docs.whop.com/api-reference/events/create-event)
//   POST /api/invoices  — create + send a Whop invoice (native Invoices API)
//                        (docs: https://docs.whop.com/developer/guides/invoices.md)
//   POST /api/pay       — charge a Payment Elements confirmation token
//                        (docs: https://docs.whop.com/developer/guides/payment-elements.md)
//   POST /api/webhooks  — payment.succeeded fulfillment (verified w/ SDK)
//
// On Whop hosting, server-side fetch to ${WHOP_API_ORIGIN} gets the app's API
// key auto-injected by the outbound proxy, so WHOP_API_KEY can stay unset.
// Locally, set it in .env (sandbox keys for testing — never production keys).
// With no key configured, the server runs in DEMO mode: leads/invoices are
// stored locally and the responses say so honestly (whopEventSent /
// whopInvoiceSent === false). Nothing is faked as sent to Whop.
// ─────────────────────────────────────────────────────────────────────────────
import express from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { unwrapWebhook } from "@whop/sdk/helpers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

const WHOP_API_KEY = process.env.WHOP_API_KEY || "";
const WHOP_API_ORIGIN = process.env.WHOP_API_ORIGIN || "https://api.whop.com";
const WHOP_ACCOUNT_ID = process.env.WHOP_ACCOUNT_ID || "";
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || "";
const API_VERSION = "2026-10-24"; // native Invoices API needs >= 2026-10-24

// Plan IDs for the two one-time products. Set via env (or Whop secrets) once
// the products exist in the dashboard. Demo placeholders otherwise.
const PLAN_IDS = {
  inspection: process.env.WHOP_INSPECTION_PLAN_ID || "plan_xxxxxxxxxxxxx",
  deposit: process.env.WHOP_DEPOSIT_PLAN_ID || "plan_xxxxxxxxxxxxx",
};
const PRICES = { inspection: 149, deposit: 500 } as const;
const NAMES = {
  inspection: "Roof Inspection",
  deposit: "Project Deposit",
} as const;

const LIVE = Boolean(WHOP_API_KEY);
const PLANS_LIVE = Object.values(PLAN_IDS).every((p) => p !== "plan_xxxxxxxxxxxxx");

const app = express();

// Capture the raw body for webhook signature verification.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody: Buffer }).rawBody = buf;
    },
  }),
);

async function store(kind: string, record: Record<string, unknown>) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const file = path.join(DATA_DIR, `${kind}.json`);
    let rows: unknown[] = [];
    try {
      rows = JSON.parse(await fs.readFile(file, "utf8")) as unknown[];
    } catch {
      rows = [];
    }
    rows.push({ ...record, storedAt: new Date().toISOString() });
    await fs.writeFile(file, JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(`[store:${kind}]`, err);
  }
}

async function whop(
  method: string,
  pathName: string,
  body?: unknown,
  idempotencyKey?: string,
) {
  const res = await fetch(`${WHOP_API_ORIGIN}/api/v1${pathName}`, {
    method,
    headers: {
      Authorization: `Bearer ${WHOP_API_KEY}`,
      "Api-Version-Date": API_VERSION,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
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

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: LIVE ? "live" : "demo",
    plansConfigured: PLANS_LIVE,
    accountConfigured: Boolean(WHOP_ACCOUNT_ID),
  });
});

// ── Leads: estimate form / contact form ──────────────────────────────────────
app.post("/api/leads", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  if (!b.email || typeof b.email !== "string" || !b.email.includes("@")) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }
  const leadId = `lead_${randomUUID().slice(0, 8)}`;
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
  await store("leads", lead);

  // Whop Events API — server-side `lead` event (the pixel's browser-side
  // `whop.track("lead")` is the same event; the server copy carries the full
  // lead record for attribution). Requires the `event:create` scope.
  let whopEventSent = false;
  if (LIVE && WHOP_ACCOUNT_ID) {
    try {
      await whop("POST", "/events", {
        account_id: WHOP_ACCOUNT_ID,
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
        context: {
          service: String(lead.service || ""),
          roof_type: String(lead.roofType || ""),
          zip: String(lead.zip || ""),
        },
      });
      whopEventSent = true;
    } catch (err) {
      console.error("[leads] Whop event failed:", err);
    }
  }
  res.json({ ok: true, leadId, whopEventSent });
});

// ── Invoices: $149 inspection / $500 deposit ────────────────────────────────
app.post("/api/invoices", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  const kind = b.kind === "deposit" ? "deposit" : "inspection";
  if (!b.email || typeof b.email !== "string" || !b.email.includes("@")) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }
  const name = `${String(b.firstName ?? "")} ${String(b.lastName ?? "")}`.trim() || "Customer";

  // Demo mode (no API key or no plans): persist the request and say so.
  if (!LIVE || !PLANS_LIVE) {
    const n = String(Date.now()).slice(-6);
    const invoiceNumber = `#DEMO-${n}`;
    await store("invoices", {
      id: `demo_${randomUUID().slice(0, 8)}`,
      number: invoiceNumber,
      kind,
      amount: PRICES[kind],
      email: b.email,
      name,
      whopInvoiceSent: false,
    });
    res.json({
      ok: true,
      invoiceId: `demo_${n}`,
      invoiceNumber,
      whopInvoiceSent: false,
    });
    return;
  }

  try {
    // 1. Create a draft (POST /invoices) — charges nothing, emails no one.
    const invoice = (await whop(
      "POST",
      "/invoices",
      {
        account_id: WHOP_ACCOUNT_ID || undefined,
        email_address: b.email,
        customer_name: name,
        items: [{ plan_id: PLAN_IDS[kind], quantity: 1 }],
        metadata: {
          kind,
          source: "summit-peak-roofing-website",
          ...(typeof b.address === "string" && b.address ? { address: b.address } : {}),
        },
      },
      randomUUID(),
    )) as { id: string; number: string; status: string };

    // 2. Send it — issues the invoice and emails it to the customer.
    await whop("POST", `/invoices/${invoice.id}/send`, {}, randomUUID());
    await store("invoices", {
      id: invoice.id,
      number: invoice.number,
      kind,
      amount: PRICES[kind],
      email: b.email,
      name,
      whopInvoiceSent: true,
    });
    res.json({
      ok: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      whopInvoiceSent: true,
    });
  } catch (err) {
    console.error("[invoices]", err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "Could not create the invoice.",
    });
  }
});

// ── Pay: charge a Payment Elements confirmation token ───────────────────────
app.post("/api/pay", async (req, res) => {
  const b = req.body as Record<string, unknown>;
  if (typeof b.confirmationToken !== "string" || !b.confirmationToken.startsWith("ctok_")) {
    res.status(400).json({ error: "Missing confirmation token." });
    return;
  }
  if (!LIVE || !PLANS_LIVE) {
    res.status(503).json({
      error: "Checkout is not connected yet — connect the Whop plans in src/config.ts first.",
    });
    return;
  }
  const kind = b.kind === "deposit" ? "deposit" : "inspection";
  try {
    // POST /payments — charges the variant with the token's payment method.
    // Collection runs in the background; the response is the payment as
    // created, not its outcome (see the client-side handleNextAction flow).
    const payment = (await whop(
      "POST",
      "/payments",
      {
        confirmation_token: b.confirmationToken,
        line_items: [{ variant_id: PLAN_IDS[kind], quantity: 1 }],
        metadata: { order_id: String(b.orderId ?? ""), kind },
        return_url: `${req.headers.origin ?? ""}/checkout/return?order=${String(b.orderId ?? "")}`,
      },
      randomUUID(),
    )) as { id: string; status: string; client_secret?: string };
    res.json({ id: payment.id, status: payment.status, client_secret: payment.client_secret });
  } catch (err) {
    console.error("[pay]", err);
    res.status(502).json({
      error: err instanceof Error ? err.message : "Payment could not be created.",
    });
  }
});

// ── Webhooks: fulfill from payment.succeeded — never from the return URL ────
app.post("/api/webhooks", async (req, res) => {
  if (!WHOP_WEBHOOK_SECRET) {
    res.status(500).json({ error: "Webhook secret not configured." });
    return;
  }
  try {
    const rawBody = (req as unknown as { rawBody: Buffer }).rawBody;
    const event = await unwrapWebhook(rawBody, req.headers, WHOP_WEBHOOK_SECRET);
    if (event?.type === "payment.succeeded") {
      const payment = event.data as { id?: string; metadata?: Record<string, string> };
      console.info("[webhook] payment.succeeded", payment.id, payment.metadata);
      await store("payments", {
        paymentId: payment.id,
        metadata: payment.metadata ?? {},
        event: "payment.succeeded",
      });
      // Fulfillment happens here: mark the order paid, schedule the
      // inspection / lock the install date, send the confirmation email.
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[webhook] verification failed:", err);
    res.status(400).json({ error: "Invalid webhook signature." });
  }
});

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.info(
    `[summit-peak-roofing api] listening on :${PORT} — mode: ${LIVE ? "live" : "demo"}, plans: ${PLANS_LIVE ? "configured" : "demo placeholders"}`,
  );
});
