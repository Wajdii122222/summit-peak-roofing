import { useEffect, useState } from "react";
import {
  BrandingElement,
  EmailElement,
  PaymentElement,
  Payments,
  WhopElements,
  usePayments,
  useWhop,
} from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { BUSINESS, PLANS_CONFIGURED, PRODUCTS } from "../config";
import { payWithToken, requestInvoice } from "../lib/api";
import type { CheckoutKind } from "./Pricing";

function randomOrderId() {
  return `ord_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function PaymentForm({
  kind,
  orderId,
  onDone,
}: {
  kind: CheckoutKind;
  orderId: string;
  onDone: (ok: boolean, paymentId?: string) => void;
}) {
  const payments = usePayments();
  const whop = useWhop();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const product = kind === "inspection" ? PRODUCTS.inspection : PRODUCTS.deposit;

  async function pay() {
    if (!payments || !whop) return;
    setError(null);
    setBusy(true);
    try {
      // Step 1.4 (docs): create a single-use confirmation token. Card data
      // never touches this page — it stays inside Whop's hosted frames.
      const { confirmationToken } = await payments.createConfirmationToken({});

      // Step 2.2: the server charges the token via the Payments API.
      const payment = await payWithToken({ confirmationToken, orderId, kind });

      if (payment.status === "paid") {
        onDone(true, payment.id);
        return;
      }
      // Step 3.1: anything else means the buyer still has a step
      // (3D Secure, bank redirect). handleNextAction runs it.
      const result = await whop.payments.handleNextAction({
        clientSecret: payment.client_secret as string,
      });
      if (result.redirected) return; // buyer returns via returnUrl
      if (result.status === "succeeded") {
        onDone(true, payment.id);
        return;
      }
      if (result.status === "processing") {
        onDone(true, payment.id);
        return;
      }
      setError(
        result.lastPaymentError?.message ?? "The payment step wasn't completed. Try again.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EmailElement />
      {/* Step 1.3: the pay button enables once the form is complete. */}
      <PaymentElement onChange={(event) => setReady(event.complete)} />
      {/* BrandingElement is required on every payment form. */}
      <BrandingElement />
      <button className="btn btn-amber pay-btn" disabled={!ready || busy} onClick={pay}>
        {busy ? "Processing…" : `Pay $${product.price} — ${product.name}`}
      </button>
      {error && <div className="form-error">{error}</div>}
      <p className="secure-note">
        Secure checkout by Whop · Card, Apple Pay &amp; Google Pay · Your card
        details never touch this site.
      </p>
    </>
  );
}

export default function CheckoutModal({
  kind,
  onClose,
}: {
  kind: CheckoutKind;
  onClose: () => void;
}) {
  const product = kind === "inspection" ? PRODUCTS.inspection : PRODUCTS.deposit;
  const [orderId] = useState(randomOrderId);
  const [paid, setPaid] = useState<null | string>(null);
  const [invoice, setInvoice] = useState<
    null | { number: string; sent: boolean } | "busy" | "error"
  >(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const requestInvoiceByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("inv-email") as HTMLInputElement).value;
    const firstName = (form.elements.namedItem("inv-name") as HTMLInputElement).value;
    setInvoice("busy");
    try {
      const res = await requestInvoice({
        kind,
        firstName,
        lastName: "",
        email,
      });
      setInvoice({ number: res.invoiceNumber, sent: res.whopInvoiceSent });
    } catch {
      setInvoice("error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {paid ? (
          <>
            <h3>✓ You're booked!</h3>
            <p className="modal-sub">
              Payment confirmed
              {paid ? ` (payment ${paid})` : ""}. We'll email your receipt and
              call within one business day to confirm your time slot.
            </p>
            <div className="order-summary">
              <div className="row">
                <span>{product.name}</span>
                <b>${product.price}</b>
              </div>
              <div className="row">
                <span>Order</span>
                <span>{orderId}</span>
              </div>
              <div className="row total">
                <span>Total paid</span>
                <span>${product.price}</span>
              </div>
            </div>
            <button className="btn btn-navy btn-block" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <h3>{product.name}</h3>
            <p className="modal-sub">{product.blurb}</p>
            <div className="order-summary">
              <div className="row">
                <span>{product.name}</span>
                <b>${product.price}</b>
              </div>
              <div className="row">
                <span>Taxes &amp; fees</span>
                <span>$0</span>
              </div>
              <div className="row total">
                <span>Total due today</span>
                <span>${product.price}</span>
              </div>
            </div>

            {PLANS_CONFIGURED ? (
              // Live checkout — Whop Payment Elements (docs:
              // https://docs.whop.com/developer/guides/payment-elements.md)
              <WhopElements elements={loadWhop()}>
                <Payments
                  accountId="biz_xxxxxxxxxxxxx"
                  plan={product.planId}
                  returnUrl={`${window.location.origin}/checkout/return?order=${orderId}`}
                >
                  <PaymentForm
                    kind={kind}
                    orderId={orderId}
                    onDone={(ok, paymentId) => ok && setPaid(paymentId ?? orderId)}
                  />
                </Payments>
              </WhopElements>
            ) : (
              // Demo mode — no plan IDs configured yet. The Elements form
              // needs a real plan, so we show the invoice path instead and
              // explain exactly what to connect.
              <div>
                <div className="demo-notice">
                  <b>Demo mode:</b> live card checkout activates once the two
                  Whop plan IDs are pasted into <code>src/config.ts</code>{" "}
                  (see README → “Connect Whop checkout”). Until then, request
                  an invoice — it's the same Whop Invoices API the live site
                  uses.
                </div>
                {invoice === null || invoice === "error" ? (
                  <form onSubmit={requestInvoiceByEmail}>
                    <div className="field">
                      <label htmlFor="inv-name">Your name</label>
                      <input id="inv-name" name="inv-name" required placeholder="James Carter" />
                    </div>
                    <div className="field">
                      <label htmlFor="inv-email">Email for the invoice</label>
                      <input
                        id="inv-email"
                        name="inv-email"
                        type="email"
                        required
                        placeholder="you@email.com"
                      />
                    </div>
                    <button className="btn btn-navy btn-block" type="submit">
                      Email Me the ${product.price} Invoice
                    </button>
                    {invoice === "error" && (
                      <div className="form-error">
                        Couldn't send the invoice — call us at {BUSINESS.phoneDisplay}.
                      </div>
                    )}
                  </form>
                ) : invoice === "busy" ? (
                  <button className="btn btn-navy btn-block" disabled>
                    Sending invoice…
                  </button>
                ) : (
                  <div className="form-success">
                    <h4>
                      ✓ {invoice.sent
                        ? `Invoice ${invoice.number} sent`
                        : `Invoice request ${invoice.number} saved`}
                    </h4>
                    <p>
                      {invoice.sent ? (
                        <>
                          Check your inbox — pay the ${product.price}{" "}
                          {product.name.toLowerCase()} by card through Whop's
                          secure checkout whenever you're ready.
                        </>
                      ) : (
                        <>
                          Demo mode: your request is saved and the invoice will
                          be emailed from Whop once checkout is connected. Call
                          us at {BUSINESS.phoneDisplay} and we'll book you in
                          right away.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
