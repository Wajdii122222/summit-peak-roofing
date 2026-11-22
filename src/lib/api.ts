// Client-side API wrappers for the template's server routes (server/server.ts).
// All Whop API keys stay on the server — the browser never sees them.

export interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  service: string;
  roofType: string;
  roofSizeSqft: number;
  roofAge: string;
  estimateLow: number;
  estimateHigh: number;
  message: string;
}

export interface InvoiceRequest {
  kind: "inspection" | "deposit";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, string>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Submit the estimate form → server forwards a `lead` event to Whop's
 *  Events API (POST /api/v1/events) and stores the lead. */
export function submitLead(payload: LeadPayload) {
  return postJson<{ ok: boolean; leadId: string; whopEventSent: boolean }>(
    "/api/leads",
    payload,
  );
}

/** Create + send a Whop invoice (native Invoices API) for the $149
 *  inspection or the $500 deposit. In demo mode (no API key / no plans),
 *  the request is saved locally and whopInvoiceSent is false — the UI must
 *  say so instead of claiming an invoice was emailed. */
export function requestInvoice(payload: InvoiceRequest) {
  return postJson<{
    ok: boolean;
    invoiceId: string;
    invoiceNumber: string;
    whopInvoiceSent: boolean;
  }>("/api/invoices", payload);
}

/** Charge a Payment Elements confirmation token (server calls the Payments
 *  API). Returns the payment id/status/client_secret for handleNextAction. */
export function payWithToken(body: {
  confirmationToken: string;
  orderId: string;
  kind: "inspection" | "deposit";
}) {
  return postJson<{
    id: string;
    status: string;
    client_secret?: string;
  }>("/api/pay", body);
}
