import { useState } from "react";
import { BUSINESS, FAQS } from "../config";
import { submitLead } from "../lib/api";
import { trackLead } from "../lib/tracking";

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section alt" id="faq">
      <div className="container center">
        <p className="eyebrow">Questions</p>
        <h2>Asked by nearly every homeowner.</h2>
        <div className="faq-list" style={{ textAlign: "left" }}>
          {FAQS.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <h3 onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q} <span>{open === i ? "−" : "+"}</span>
              </h3>
              {open === i && <p>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const [firstName, ...rest] = form.name.trim().split(" ");
      await submitLead({
        firstName: firstName || form.name,
        lastName: rest.join(" ") || "",
        email: form.email,
        phone: form.phone,
        address: "",
        zip: "",
        service: "Contact form",
        roofType: "asphalt",
        roofSizeSqft: 0,
        roofAge: "",
        estimateLow: 0,
        estimateHigh: 0,
        message: form.message,
      });
      trackLead(0, form.email);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please call us.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <p className="eyebrow">Contact</p>
            <h2>Talk to a roofer, not a call center.</h2>
            <p>
              Questions about your roof, an insurance claim, or financing? Call,
              email, or send the form — a project manager replies within one
              business day.
            </p>
            <div className="contact-lines">
              <div>
                <span className="ic">📞</span>
                <span>
                  <b>{BUSINESS.phoneDisplay}</b>
                  <span>{BUSINESS.hours}</span>
                </span>
              </div>
              <div>
                <span className="ic">✉️</span>
                <span>
                  <b>{BUSINESS.email}</b>
                  <span>Quotes, questions &amp; storm claims</span>
                </span>
              </div>
              <div>
                <span className="ic">📍</span>
                <span>
                  <b>{BUSINESS.address}</b>
                  <span>Serving all of DFW — {BUSINESS.serviceArea}</span>
                </span>
              </div>
              <div>
                <span className="ic">🛡️</span>
                <span>
                  <b>{BUSINESS.license}</b>
                  <span>25-year workmanship warranty on every install</span>
                </span>
              </div>
            </div>
          </div>
          <div className="form-card">
            <h3>Send us a message</h3>
            <p>We reply within one business day.</p>
            {done ? (
              <div className="form-success">
                <h4>✓ Message sent!</h4>
                <p>Thanks, {form.name.split(" ")[0]} — we'll be in touch within one business day.</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="field">
                  <label htmlFor="ct-name">Name *</label>
                  <input
                    id="ct-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="James Carter"
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ct-email">Email *</label>
                    <input
                      id="ct-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ct-phone">Phone</label>
                    <input
                      id="ct-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(214) 555-0100"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="ct-msg">Message *</label>
                  <textarea
                    id="ct-msg"
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your roof…"
                  />
                </div>
                <button className="btn btn-amber btn-block" type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send Message"}
                </button>
                {error && <div className="form-error">{error}</div>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <h4>SUMMIT PEAK ROOFING</h4>
          <p>
            Family-owned roofers serving Dallas–Fort Worth since 2009. Roof
            replacement, repairs, storm restoration, inspections, gutters and
            ventilation — done right, backed in writing.
          </p>
          <p style={{ marginTop: 14 }}>
            {BUSINESS.address}
            <br />
            {BUSINESS.phoneDisplay} · {BUSINESS.email}
          </p>
        </div>
        <div>
          <h4>Services</h4>
          <a href="#services">Roof Replacement</a>
          <a href="#services">Roof Repair</a>
          <a href="#services">Storm &amp; Hail Damage</a>
          <a href="#services">21-Point Inspection — $149</a>
          <a href="#services">Gutters &amp; Guards</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#pricing">Pricing</a>
          <a href="#financing">Financing</a>
          <a href="#reviews">Reviews</a>
          <a href="#estimate">Free Estimate</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Summit Peak Roofing LLC · {BUSINESS.license}
          </span>
          <span>Template built for Whop Websites · Secure checkout by Whop</span>
        </div>
      </div>
    </footer>
  );
}
