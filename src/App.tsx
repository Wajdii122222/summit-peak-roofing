import { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Pricing, { type CheckoutKind } from "./components/Pricing";
import Financing from "./components/Financing";
import Reviews from "./components/Reviews";
import EstimateForm from "./components/EstimateForm";
import Contact, { Faq, Footer } from "./components/Contact";
import CheckoutModal from "./components/CheckoutModal";
import { PRODUCTS } from "./config";
import { trackInitiateCheckout } from "./lib/tracking";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function App() {
  const [checkout, setCheckout] = useState<CheckoutKind | null>(null);
  const [service, setService] = useState("Roof Replacement");
  const [returnStatus, setReturnStatus] = useState<string | null>(null);

  // Checkout return page (docs: Payment Elements §3.2) — Whop appends
  // ?payment=pay_...&status=succeeded|failed|canceled to the returnUrl.
  // This is display only; fulfillment comes from the payment.succeeded
  // webhook on the server.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) {
      setReturnStatus(status);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const openCheckout = useCallback((kind: CheckoutKind) => {
    // whop.track event #3 — "initiate_checkout": fired once here, the single
    // choke point for every checkout entry (header, hero, pricing cards).
    const p = kind === "inspection" ? PRODUCTS.inspection : PRODUCTS.deposit;
    trackInitiateCheckout(p.productId, p.planId, p.price);
    setCheckout(kind);
  }, []);

  const goEstimate = useCallback((svc?: string) => {
    if (svc) setService(svc);
    scrollToId("estimate");
  }, []);

  return (
    <div>
      <Header onBookInspection={() => openCheckout("inspection")} />
      {returnStatus === "succeeded" && (
        <div style={{ background: "var(--green-50)", borderBottom: "1px solid #bbf7d0", padding: "14px 0", textAlign: "center", fontWeight: 600, color: "var(--green-600)" }}>
          ✓ Payment confirmed — thank you! We'll email your receipt and call to confirm your time slot.
        </div>
      )}
      {returnStatus && returnStatus !== "succeeded" && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "14px 0", textAlign: "center", fontWeight: 600, color: "var(--red-600)" }}>
          Your payment didn't go through — you were not charged. Please try again or call us at (214) 555-0148.
        </div>
      )}
      <Hero onBookInspection={() => openCheckout("inspection")} onEstimate={() => goEstimate()} />

      <section className="section dark">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 style={{ fontSize: "clamp(34px, 4.5vw, 52px)", margin: "10px 0 14px" }}>
            From first call to final cleanup in three steps.
          </h2>
          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <h3>Inspect &amp; quote</h3>
              <p>
                Book the $149 inspection or get a free estimate. We measure, photograph,
                and give you an exact written quote — good for 30 days.
              </p>
            </div>
            <div className="step">
              <div className="num">02</div>
              <h3>Schedule &amp; finance</h3>
              <p>
                Pick your date, lock it with the $500 deposit, and choose financing
                if you want it — 0% APR for 12 months on approved credit.
              </p>
            </div>
            <div className="step">
              <div className="num">03</div>
              <h3>Install &amp; warranty</h3>
              <p>
                Our in-house crew (never day labor) installs in 1–2 days, cleans up
                like we were never there, and your 25-year workmanship warranty starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Services onEstimate={goEstimate} />
      <Pricing onCheckout={openCheckout} />
      <Financing onEstimate={() => goEstimate()} />
      <Reviews />
      <EstimateForm preselectedService={service} />
      <Faq />
      <Contact />
      <Footer />

      {checkout && <CheckoutModal kind={checkout} onClose={() => setCheckout(null)} />}
    </div>
  );
}
