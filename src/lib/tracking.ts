// ─────────────────────────────────────────────────────────────────────────────
// whop.track helpers — Whop Websites tracking
// Docs: https://docs.whop.com/developer/websites/tracking
//
// On a live whop.site site, Whop injects the pixel into every page and
// `window.whop` exists before app code runs. Page views, checkout views and
// purchases are tracked automatically — never fire those yourself.
// The three events this template fires (the bounty requirement):
//   1. "lead"               — estimate form submitted
//   2. "view_content"       — inspection product card viewed (with variant_id /
//                             product_id / value / currency, per the docs)
//   3. "initiate_checkout"  — checkout opened for the inspection or deposit
// Each call is also logged to the console and to localStorage in demo mode so
// the flow is verifiable without a live pixel.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    whop?: {
      track: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

export type TrackEventName =
  | "lead"
  | "view_content"
  | "initiate_checkout"
  | "schedule"
  | "contact";

export function trackEvent(
  event: TrackEventName,
  params: Record<string, unknown> = {},
): void {
  try {
    if (typeof window !== "undefined" && window.whop?.track) {
      window.whop.track(event, params);
    }
  } catch {
    // Pixel errors must never break the site.
  }
  // Demo-mode audit trail: visible in the console and persisted locally.
  const entry = { event, params, at: new Date().toISOString() };
  try {
    const log = JSON.parse(localStorage.getItem("spr_track_log") || "[]") as unknown[];
    log.push(entry);
    localStorage.setItem("spr_track_log", JSON.stringify(log.slice(-50)));
  } catch {
    /* storage unavailable — ignore */
  }
  console.info("[whop.track]", event, params);
}

/** 1 of 3 — estimate form submitted (a lead). */
export function trackLead(valueUsd: number, email?: string): void {
  trackEvent("lead", {
    value: Math.round(valueUsd),
    currency: "usd",
    ...(email ? { email } : {}),
  });
}

/** 2 of 3 — a product (the $149 inspection) was viewed. */
export function trackViewContent(productId: string, variantId: string, valueUsd: number): void {
  trackEvent("view_content", {
    product_id: productId,
    variant_id: variantId,
    value: valueUsd,
    currency: "usd",
  });
}

/** 3 of 3 — checkout opened for a product. */
export function trackInitiateCheckout(
  productId: string,
  variantId: string,
  valueUsd: number,
): void {
  trackEvent("initiate_checkout", {
    product_id: productId,
    variant_id: variantId,
    value: valueUsd,
    currency: "usd",
  });
}
