# Deploying Summit Peak Roofing to a live whop.site URL

The template is complete and builds cleanly. The deploy itself needs a
signed-in Whop session (the CLI's `whop auth login` opens a browser OAuth
flow), so it can't run from a headless VM. The steps below take ~10 minutes
in a browser.

## 0. Prerequisites

- A Whop account (the business the site will belong to)
- Node.js 18+ and the Whop CLI: `curl -fsSL https://whop.com/install.sh | sh`

## 1. Sign in

```bash
whop auth login        # opens the browser once, pins the CLI to your business
whop quickstart        # picks (or creates) the business every command acts on
```

## 2. Register the app and link this directory

```bash
cd summit-peak-roofing
whop apps init --app_type website --name "Summit Peak Roofing" --domain summit-peak-roofing --dir .
```

This registers the app on Whop, claims `summit-peak-roofing.whop.site`, and
writes the app id into `whop.app.json`. (If the domain is taken, pick another
`--domain` — e.g. `summit-peak-roofing-dfw`.)

If the app was already created on whop.com (Websites → New website), link this
code to it instead:

```bash
whop apps init --app app_xxxxxxxxxxxxx --dir .
```

## 3. Create the two products (checkout)

In the Whop dashboard → Checkout links / Products, create two **one-time**
products:

| Product | Price | Use |
|---|---|---|
| Roof Inspection | $149 | Inspection checkout + invoice |
| Project Deposit | $500 | Deposit checkout + invoice |

Copy each product's plan ID (`plan_...`) and paste them into
`src/config.ts`:

```ts
PRODUCTS.inspection.planId = "plan_..."; // $149
PRODUCTS.deposit.planId = "plan_...";    // $500
```

Also set the same IDs as secrets (step 4) so the server can use them.

## 4. Set secrets

```bash
whop apps secrets set --secret WHOP_API_KEY=...
whop apps secrets set --secret WHOP_ACCOUNT_ID=biz_...
whop apps secrets set --secret WHOP_WEBHOOK_SECRET=ws_...
whop apps secrets set --secret WHOP_INSPECTION_PLAN_ID=plan_...
whop apps secrets set --secret WHOP_DEPOSIT_PLAN_ID=plan_...
```

- `WHOP_API_KEY`: account API key with `payments`, `invoices`, `event:create`
  scopes (Dashboard → Developer → API keys). Sandbox keys work for testing;
  production keys move real money.
- `WHOP_WEBHOOK_SECRET`: create a webhook in the dashboard for
  `payment.succeeded` pointing at
  `https://summit-peak-roofing.whop.site/api/webhooks`, then copy its `ws_`
  secret.

## 5. Deploy

```bash
whop apps deploy
```

This builds the client (`dist/client`), bundles the server (`dist/server`),
uploads, and promotes the build to production. The site goes live at:

**https://summit-peak-roofing.whop.site**

Verify: `whop apps builds list`, and check the live site — hero, pricing,
estimate form, and the checkout modal. Roll back any time with
`whop apps builds promote <older-build-id>`.

## 6. Verify the integrations live

1. **Pixel / tracking:** open the site, scroll to Pricing (fires
   `view_content`), open the $149 checkout (fires `initiate_checkout`),
   submit the estimate form (fires `lead`). Check the pixel dashboard in
   Whop (Websites → pixel dashboard) — events appear ~1 minute after the visit.
2. **Leads API:** submit the estimate form; the lead appears in the Events
   API / dashboard and in the app's server logs (`whop apps logs <app_id>`).
3. **Invoices API:** from the estimate success state, click "Email Me an
   Invoice" — a numbered Whop invoice is emailed to the address entered.
4. **Payment Elements:** open the $149 checkout with the plan IDs set — the
   card/Apple Pay/Google Pay form mounts. Pay with a test card in sandbox
   (or a real card in production) and confirm `payment.succeeded` hits
   `/api/webhooks` (check `whop apps logs`).

## Troubleshooting

- `whop apps deploy` fails typecheck → run `npm run build` locally first and
  fix the reported error.
- Checkout modal shows the demo notice → the plan IDs in `src/config.ts`
  are still placeholders; complete step 3 and redeploy.
- Invoice request says "demo mode" → `WHOP_API_KEY` or the plan-ID secrets
  aren't set; complete step 4 and redeploy (secrets are read at runtime, a
  redeploy picks them up).
- Webhook 400s → the `ws_` secret doesn't match the dashboard webhook; reset
  it with `whop apps secrets set`.
