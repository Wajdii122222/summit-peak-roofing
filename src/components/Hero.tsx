import { BUSINESS } from "../config";

export default function Hero({
  onBookInspection,
  onEstimate,
}: {
  onBookInspection: () => void;
  onEstimate: () => void;
}) {
  return (
    <>
      <section className="hero" id="top">
        <div className="hero-bg">
          <img src="/images/hero-house.webp" alt="Newly roofed suburban home in Dallas–Fort Worth" />
        </div>
        <div className="container">
          <p className="eyebrow">Roof Replacement · Repairs · Storm Damage · DFW</p>
          <h1>
            A roof that protects <em>everything under it.</em>
          </h1>
          <p className="lede">
            Family-owned roofers serving Dallas–Fort Worth since 2009. Honest
            inspections, written quotes, and installs done right the first time —
            backed by a 25-year workmanship warranty.
          </p>
          <div className="hero-actions">
            <button className="btn btn-amber" onClick={onEstimate}>
              Get My Free Estimate →
            </button>
            <button className="btn btn-white" onClick={onBookInspection}>
              Book a $149 Inspection
            </button>
          </div>
          <div className="hero-proof">
            <div>
              <b>{BUSINESS.roofsCompleted.toLocaleString()}+</b>
              <span>roofs completed</span>
            </div>
            <div>
              <b>{BUSINESS.rating} ★</b>
              <span>{BUSINESS.reviewCount}+ verified reviews</span>
            </div>
            <div>
              <b>25-year</b>
              <span>workmanship warranty</span>
            </div>
            <div>
              <b>1–2 days</b>
              <span>average install time</span>
            </div>
          </div>
        </div>
      </section>

      <div className="hero-card">
        <div className="hero-card-inner">
          <div>
            <h3>Not sure what your roof needs? Start with an inspection.</h3>
            <p>
              Our 21-point inspection includes drone photos and a written report.
              If you hire us within 30 days, the fee comes straight off your repair
              or replacement.
            </p>
          </div>
          <div className="price-tag">
            <div className="amount">
              $149 <small>flat</small>
            </div>
            <span>credited toward any work</span>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-navy" onClick={onBookInspection}>
                Book Inspection
              </button>
            </div>
          </div>
        </div>
        <div className="trustbar">
          <div>
            <span className="ic">🛡️</span>
            <span>
              <b>Licensed &amp; Insured</b>
              <span>{BUSINESS.license}</span>
            </span>
          </div>
          <div>
            <span className="ic">📋</span>
            <span>
              <b>Written Quotes Only</b>
              <span>No verbal estimates, no surprise charges</span>
            </span>
          </div>
          <div>
            <span className="ic">💳</span>
            <span>
              <b>0% APR Financing</b>
              <span>12 months same-as-cash on approved credit</span>
            </span>
          </div>
          <div>
            <span className="ic">⛈️</span>
            <span>
              <b>Storm Response Team</b>
              <span>Emergency tarping &amp; adjuster support</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
