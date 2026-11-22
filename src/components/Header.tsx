import { BUSINESS } from "../config";

export default function Header({ onBookInspection }: { onBookInspection: () => void }) {
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>
            ★ <b>{BUSINESS.rating} rated</b> by {BUSINESS.reviewCount}+ DFW homeowners
          </span>
          <span>
            {BUSINESS.hours} · <b>Licensed &amp; Insured</b>
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container">
          <a className="logo" href="#top">
            <span className="logo-mark">⛰</span>
            <span>
              <span className="logo-name">
                SUMMIT PEAK <span>ROOFING</span>
              </span>
              <br />
              <span className="logo-sub">Dallas – Fort Worth</span>
            </span>
          </a>
          <nav className="nav">
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#financing">Financing</a>
            <a href="#reviews">Reviews</a>
            <a href="#estimate">Free Estimate</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-cta">
            <a className="header-phone" href={BUSINESS.phoneHref}>
              {BUSINESS.phoneDisplay}
            </a>
            <button className="btn btn-amber btn-sm" onClick={onBookInspection}>
              Book $149 Inspection
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
