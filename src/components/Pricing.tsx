import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "../config";
import { trackViewContent } from "../lib/tracking";

export type CheckoutKind = "inspection" | "deposit";

export default function Pricing({
  onCheckout,
}: {
  onCheckout: (kind: CheckoutKind) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [viewed, setViewed] = useState(false);

  // whop.track event #2 — "view_content": fired once when the $149
  // inspection card scrolls into view, with product + variant + value.
  // (Docs: https://docs.whop.com/developer/websites/tracking)
  useEffect(() => {
    if (viewed) return;
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackViewContent(
            PRODUCTS.inspection.productId,
            PRODUCTS.inspection.planId,
            PRODUCTS.inspection.price,
          );
          setViewed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [viewed]);

  const openCheckout = (kind: CheckoutKind) => {
    // initiate_checkout is fired in App.openCheckout (the single choke
    // point for every checkout entry) — not here, to avoid double-firing.
    onCheckout(kind);
  };

  return (
    <section className="section alt" id="pricing">
      <div className="container">
        <p className="eyebrow">Simple, honest pricing</p>
        <h2>Two ways to get started. No surprises.</h2>
        <p className="lede">
          Pay for an inspection, or lock your project in with a deposit. Both are
          handled by secure Whop checkout — card, Apple Pay, or Google Pay.
        </p>
        <div className="pricing-grid">
          <div className="price-card featured" ref={cardRef}>
            <span className="badge">Most popular</span>
            <h3>Roof Inspection</h3>
            <div className="price">
              $149 <small>one-time</small>
            </div>
            <p>{PRODUCTS.inspection.blurb}</p>
            <ul>
              <li>21-point roof &amp; attic inspection</li>
              <li>Drone photos + written report</li>
              <li>Honest repair-or-replace recommendation</li>
              <li>$149 credited toward any work within 30 days</li>
              <li>Booked within 48 hours, 7 days a week</li>
            </ul>
            <button className="btn btn-amber btn-block" onClick={() => openCheckout("inspection")}>
              Book Inspection — $149
            </button>
          </div>
          <div className="price-card">
            <h3>Project Deposit</h3>
            <div className="price">
              $500 <small>one-time</small>
            </div>
            <p>{PRODUCTS.deposit.blurb}</p>
            <ul>
              <li>Locks your install date on the calendar</li>
              <li>Locks today's material pricing</li>
              <li>Applied in full to your project total</li>
              <li>Refundable up to 7 days before work starts</li>
              <li>Or request an invoice by email instead</li>
            </ul>
            <button className="btn btn-navy btn-block" onClick={() => openCheckout("deposit")}>
              Pay Deposit — $500
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
