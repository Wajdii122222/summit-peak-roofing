# Submission notes — Summit Peak Roofing (Weassist bounty)

## What was built

A complete, working Whop Websites template for a fictional US roofing
company, **Summit Peak Roofing** (Dallas–Fort Worth), built with Vite 7 +
React 18 + TypeScript + **TanStack Start** (file-based routing, SSR) and the
official Whop SDKs. It is a real site with a working API server — not a
static mockup: the estimate form calculates a live ballpark price and saves
leads, the checkout modal mounts Whop Payment Elements, invoice requests go
through the Whop Invoices API, and all three required `whop.track` events
fire.

## Requirement checklist

| # | Brief requirement | Where it is | Verified how |
|---|---|---|---|
| 1 | Services section | `src/components/Services.tsx` — 6 services with photos | Screenshot `section-services.png` |
| 2 | Financing options | `src/components/Financing.tsx` — 0% / 12 mo, 6.99% / 60 mo, 12.99% / 120 mo | Screenshot `section-financing.png` |
| 3 | Customer reviews | `src/components/Reviews.tsx` — 6 reviews, 4.9★ / 487+ | Screenshot `section-reviews.png` |
| 4 | Contact section | `src/components/Contact.tsx` — form + phone/email/address/hours + FAQ | Screenshot `section-contact.png` |
| 5 | $149 inspection offer | `src/config.ts` `PRODUCTS.inspection`; hero card + pricing card | Screenshots + modal |
| 6 | $500 deposit | `src/config.ts` `PRODUCTS.deposit`; pricing card | Screenshots + modal |
| 7 | Whop Payment Elements checkout | `src/components/CheckoutModal.tsx` — `Payments` handle + `EmailElement` + `PaymentElement` + `BrandingElement`; `ctok_` confirmation token → `POST /api/pay` → `POST /api/v1/payments` → `handleNextAction`; fulfillment from `payment.succeeded` webhook (`server/server.ts`) | Code complete; card form mounts only once real plan IDs are set (see "Demo mode" below) |
| 8 | Leads API estimate form | `src/components/EstimateForm.tsx` → `POST /api/leads` → server forwards a `lead` event to Whop Events API (`POST /api/v1/events`, scope `event:create`) and stores the lead | Live test: form submitted, success box shown, lead saved (`lead_82ad7a80`) |
| 9 | Invoices API integration | `server/server.ts` `POST /api/invoices` — native Invoices API (`POST /invoices` with `Api-Version-Date: 2026-10-24` + idempotency key, then `POST /invoices/{id}/send`) | Live test in demo mode: invoice request saved (`#DEMO-682677`); real send happens once API key + plan IDs are set |
| 10 | 3 × whop.track events | `src/lib/tracking.ts` — `lead` (estimate submit, value = estimate midpoint), `view_content` (inspection card enters viewport, with product/variant/value/currency), `initiate_checkout` (checkout opens, single choke point in `App.openCheckout`) | Live test: all three fired and captured in `localStorage.spr_track_log` (see `work/verification-log.txt`) |

## Demo mode — read this before judging the checkout

The template ships **without real Whop credentials** (no API key, no plan
IDs — those can only come from the reviewer's own Whop business). With
placeholders in `src/config.ts` the site runs in an honest demo mode:

- Estimate + contact forms work fully (leads stored locally).
- The checkout modal shows a demo notice and offers the invoice path
  instead of a card form — it does **not** pretend a payment went through.
- `whop.track` calls fall back to console + `localStorage.spr_track_log`
  when the pixel isn't injected (on a live whop.site the pixel is
  auto-injected and `window.whop` exists before app code runs).

Set the two plan IDs + secrets per `README.md` → "Connect Whop checkout"
and every integration goes live with **zero code changes**.

## Files

```
site/
  README.md          setup, requirement map, connect-checkout steps
  DEPLOY.md          exact steps to a live whop.site URL
  SUBMISSION-NOTES.md  (this file)
  whop.app.json      app registration (domain: summit-peak-roofing)
  package.json       scripts: build / dev / server / preview
  src/               config.ts (★ all business content), App.tsx,
                     styles.css, router.tsx, server.ts (TanStack Start
                     entry — /api/* → server/worker.ts),
                     routes/__root.tsx, routes/index.tsx,
                     lib/{tracking,api}.ts,
                     components/{Header,Hero,Services,Pricing,Financing,
                     Reviews,EstimateForm,Contact,CheckoutModal}.tsx
  server/worker.ts   Cloudflare Worker API: /api/health, /api/leads,
                     /api/invoices, /api/pay, /api/webhooks
  server/server.ts   Express API (local dev only): same routes
  public/images/     hero-house.webp, roofers-at-work.webp, storm-damage.webp
work/
  screen-recording.mp4   3:06 walkthrough (hero → services → pricing →
                         checkout modal → financing → reviews → estimate
                         form submit → invoice request → contact)
  screenshots/           section screenshots from the verification run
  verification-log.txt   console output of the automated verification
```

## Verification performed

- `npm run build` passes (tsc + vite + esbuild server bundle).
- Automated browser run (Playwright, stock Chromium): zero JS errors on the
  page; only failed requests are Google Fonts (blocked by this VM's egress
  proxy — they load normally on the live site, with system-font fallbacks).
- Estimate form submitted end-to-end; invoice request saved; all three
  `whop.track` events captured; modal opens/closes (button, overlay click,
  Escape).
- Fixed during verification: header logo/phone wrapping; modal Escape
  close; `initiate_checkout` now fires from every checkout entry point
  (header, hero, pricing) instead of only the pricing cards.

## Deployment status — LIVE

**Live URL: https://summit-peak-roofing-dfw.whop.site** (deployed
22 Nov 2026, build `apbu_ghn5ULhH8ETaM`, status approved, production).
The site was ported from a plain Vite SPA to TanStack Start 1.168
(`@tanstack/react-start` + `@tanstack/react-router` 1.170, Vite 7,
React 18) because Whop Websites require a TanStack Start build.
`GET /` returns the server-rendered hero page (HTTP 200) and
`GET /api/health` returns
`{"ok":true,"mode":"live","plansConfigured":true,"accountConfigured":true}`.
The two plan IDs are set as app secrets (`WHOP_INSPECTION_PLAN_ID`,
`WHOP_DEPOSIT_PLAN_ID`); `WHOP_ACCOUNT_ID` is reserved by the Whop
runtime and auto-injected. The screen recording is of the finished site
running locally (same build that deployed).

Known quirk: Whop's hosting rewrites the page `<title>` to the app name
("Summit Peak Roofing") via its metadata script — the template's longer
title is in the source. The server-side `lead` event was initially
rejected by the Events API (`context` fields are not accepted on that
endpoint — verified against the API); the fix (drop `context` entirely)
shipped in build `apbu_ghn5ULhH8ETaM` and a live test lead now returns
`whopEventSent: true`.

## Submission paragraph (paste into the bounty)

> Built "Summit Peak Roofing" — a complete Whop Websites template for a US
> roofing company (Vite 7 + React 18 + TypeScript + TanStack Start, SSR).
> It includes all six services with photos, three financing plans (0% /
> 12 mo, 6.99% / 60 mo, 12.99% / 120 mo), six customer reviews (4.9★),
> and a full contact section with FAQ. Both offers are live products: a
> $149 21-point inspection and a $500 project deposit, each opening a
> checkout modal wired to Whop Payment Elements (EmailElement +
> PaymentElement + BrandingElement, confirmation token → POST /api/v1/payments,
> handleNextAction, fulfillment from the payment.succeeded webhook). The
> free-estimate form has a live ballpark calculator and submits leads
> through the Whop Events API (lead event), and invoice requests go
> through the native Whop Invoices API (create + send, idempotency key).
> All three required whop.track events fire: view_content on the
> inspection card, initiate_checkout on every checkout open, and lead on
> estimate submit — verified in the browser with the events captured in
> the audit log. **Live at https://summit-peak-roofing-dfw.whop.site**
> (build apbu_ghn5ULhH8ETaM, production) — the site is deployed with the
> real plan IDs wired as app secrets, and /api/health reports live mode
> with plans configured. Screen recording and screenshots are attached.
