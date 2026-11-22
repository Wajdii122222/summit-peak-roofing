# Summit Peak Roofing — Whop Websites Template

A complete Whop Websites template for a US roofing company, built to the
Weassist bounty brief. A fictional Dallas–Fort Worth roofer ("Summit Peak
Roofing") with real, working integrations — not a static mockup.

**Live demo:** deploy it (see [DEPLOY.md](DEPLOY.md)) — the site runs at
`summit-peak-roofing.whop.site` once deployed.

## What's on the site

| Section | Contents |
|---|---|
| Hero | Photo hero, headline, trust stats (6,400+ roofs, 4.9★, 25-year warranty), $149 inspection card |
| How it works | 3-step process: inspect & quote → schedule & finance → install & warranty |
| Services | 6 services with photos: replacement, repair, storm & hail, 21-point inspection, gutters, ventilation |
| Pricing | **$149 Roof Inspection** + **$500 Project Deposit** cards, both wired to Whop checkout |
| Financing | 0% APR / 12 mo, 6.99% APR / 60 mo, 12.99% APR / 120 mo, with example payments |
| Reviews | 6 verified-style reviews, 4.9★ aggregate |
| Free estimate | Live ballpark calculator (roof size × material rates) + lead form |
| FAQ | 5 homeowner questions |
| Contact | Contact form, phone, email, address, service area, license |

## Bounty requirements — where each one lives

| Requirement | Implementation |
|---|---|
| Services section | `src/components/Services.tsx` — 6 services, photos in `public/images/` |
| Financing options | `src/components/Financing.tsx` — 3 plans, example payments |
| Customer reviews | `src/components/Reviews.tsx` — 6 reviews + 4.9★ aggregate |
| Contact section | `src/components/Contact.tsx` — form + phone/email/address/hours |
| $149 inspection offer | `src/config.ts` → `PRODUCTS.inspection`; pricing card + hero card |
| $500 deposit | `src/config.ts` → `PRODUCTS.deposit`; pricing card |
| **Whop Payment Elements checkout** | `src/components/CheckoutModal.tsx` — mounts `EmailElement` + `PaymentElement` + `BrandingElement` inside a `Payments` handle (exact pattern from the Whop docs), creates a `ctok_` confirmation token, posts it to `POST /api/pay`, which charges it via `POST /api/v1/payments` (`line_items: [{variant_id}]`); `handleNextAction` finishes 3DS/redirects; fulfillment from the `payment.succeeded` webhook |
| **Leads API estimate form** | `src/components/EstimateForm.tsx` → `POST /api/leads` → server forwards a `lead` event to Whop's Events API (`POST /api/v1/events`, `event_name: "lead"`, `event:create` scope) and stores the lead in `data/leads.json` |
| **Invoices API** | `server/server.ts` `POST /api/invoices` — creates a draft with the native Invoices API (`POST /invoices`, `Api-Version-Date: 2026-10-24`, `items: [{plan_id}]`, idempotency key) then sends it (`POST /invoices/{id}/send`). Offered from the estimate success state and from the checkout modal |
| **3 × whop.track events** | `src/lib/tracking.ts` — (1) `lead` on estimate submit (value = estimate midpoint), (2) `view_content` when the $149 inspection card scrolls into view (with `product_id` / `variant_id` / `value` / `currency`), (3) `initiate_checkout` when checkout opens (fired once, in `App.openCheckout`, the single choke point for header/hero/pricing buttons). On a live whop.site site the pixel is auto-injected and `window.whop` exists before app code runs; in demo mode every call is also logged to console + `localStorage.spr_track_log` |

## Demo mode vs live mode

The template ships **without real Whop credentials**, so it runs in demo mode:

- The estimate + contact forms work end-to-end (leads stored in `data/leads.json`).
- Invoice requests are stored in `data/invoices.json` and the UI says plainly that the invoice will be emailed once checkout is connected — nothing is faked as sent.
- The checkout modal shows a demo notice and offers the invoice path instead of a card form (Payment Elements needs a real plan ID).
- `whop.track` calls log to console + localStorage when the pixel isn't present.

Connect real credentials (below) and all four integrations go live with no code changes.

## Run locally

```bash
npm install
npm run build        # typecheck + vite build (dist/client) + server bundle (dist/server)
npm run server       # API server on :3001 (demo mode without keys)
npm run dev          # vite dev server on :5173 (proxies /api → :3001)
```

Open http://localhost:5173. Fill the estimate form, open the $149 checkout,
and watch the browser console for the `[whop.track]` lines.

## Connect Whop checkout (go live)

1. In the Whop dashboard, create two **one-time products**:
   - "Roof Inspection" — $149
   - "Project Deposit" — $500
2. Copy their plan IDs (`plan_...`) into `src/config.ts` (`PRODUCTS.inspection.planId` / `PRODUCTS.deposit.planId`).
3. Set secrets (on Whop hosting these become env vars; locally use `.env`):
   - `WHOP_API_KEY` — account API key (`payments`, `invoices`, `event:create` scopes)
   - `WHOP_ACCOUNT_ID` — `biz_...`
   - `WHOP_WEBHOOK_SECRET` — `ws_...` (create a webhook for `payment.succeeded` → `https://<your-site>/api/webhooks`)
   - `WHOP_INSPECTION_PLAN_ID` / `WHOP_DEPOSIT_PLAN_ID` — same plan IDs as step 2
4. Deploy — see [DEPLOY.md](DEPLOY.md).

## Project layout

```
whop.app.json            # ties this directory to the Whop app (type: website)
vite.config.ts           # builds dist/client (assets served directly)
index.html               # entry
src/
  config.ts              # ★ customize here: business details, products, services,
                         #   financing, reviews, FAQs, estimate rates
  main.tsx / App.tsx     # entry + page composition + checkout return handling
  styles.css             # full design system (navy + amber)
  lib/
    tracking.ts          # the 3 whop.track events
    api.ts               # client wrappers for /api/*
  components/            # Header, Hero, Services, Pricing, Financing, Reviews,
                         # EstimateForm, Contact (+FAQ/Footer), CheckoutModal
server/
  server.ts              # Express API: /api/health, /api/leads, /api/invoices,
                         # /api/pay, /api/webhooks  (bundled to dist/server)
public/images/           # hero + service photos
```

## Tech

Vite 6 + React 18 + TypeScript, `@whop/elements` / `@whop/elements-react`
(Payment Elements), `@whop/sdk` (webhook verification), Express (API server).
Deploys with the Whop CLI: `whop apps deploy` → `*.whop.site`.

## Notes for the reviewer

- All business details (name, phone, license, reviews, prices) are fictional
  demo content for the template — everything is centralized in `src/config.ts`
  so a real roofing company can rebrand it in minutes.
- The $149 / $500 amounts are the brief's fixed prices; the estimate
  calculator's per-sq-ft rates are ballpark-only and labelled as such on the
  site.
- Screen recording walkthrough: `work/screen-recording.mp4` (3:06) — hero →
  services → pricing → checkout → financing → reviews → estimate form submit
  → invoice request → contact.
