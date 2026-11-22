import { useMemo, useState } from "react";
import { ESTIMATE_RATES } from "../config";
import { requestInvoice, submitLead } from "../lib/api";
import { trackLead } from "../lib/tracking";

const SERVICES = [
  "Roof Replacement",
  "Roof Repair",
  "Storm & Hail Damage",
  "21-Point Inspection",
  "Gutters & Guards",
  "Attic Ventilation & Insulation",
  "Not sure yet",
];

const ROOF_TYPES = [
  { value: "asphalt", label: "Asphalt shingles" },
  { value: "metal", label: "Metal" },
  { value: "tile", label: "Tile / clay / concrete" },
  { value: "flat", label: "Flat / low-slope" },
];

export default function EstimateForm({
  preselectedService,
}: {
  preselectedService: string;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    service: preselectedService || "Roof Replacement",
    roofType: "asphalt",
    roofSizeSqft: 1800,
    roofAge: "10-20 years",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    low: number;
    high: number;
    leadId: string;
    whopEventSent: boolean;
  }>(null);
  const [invoiceState, setInvoiceState] = useState<
    null | { number: string; sent: boolean } | "busy" | "error"
  >(null);

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Ballpark range from the selected roof type + size (display only).
  const { low, high } = useMemo(() => {
    const rate = ESTIMATE_RATES[form.roofType] ?? ESTIMATE_RATES.asphalt;
    const sizeFactor = form.roofSizeSqft < 1200 ? 1.15 : form.roofSizeSqft > 2600 ? 0.92 : 1;
    return {
      low: Math.round(((rate.low * form.roofSizeSqft) / 100) * sizeFactor) * 100,
      high: Math.round(((rate.high * form.roofSizeSqft) / 100) * sizeFactor) * 100,
    };
  }, [form.roofType, form.roofSizeSqft]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await submitLead({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        zip: form.zip,
        service: form.service,
        roofType: form.roofType,
        roofSizeSqft: form.roofSizeSqft,
        roofAge: form.roofAge,
        estimateLow: low,
        estimateHigh: high,
        message: form.message,
      });
      // whop.track event #1 — "lead": fired when the estimate form is
      // submitted (value = midpoint of the ballpark estimate).
      trackLead((low + high) / 2, form.email);
      setDone({ low, high, leadId: res.leadId, whopEventSent: res.whopEventSent });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us instead.");
    } finally {
      setBusy(false);
    }
  };

  const requestInspectionInvoice = async () => {
    if (!done) return;
    setInvoiceState("busy");
    try {
      const res = await requestInvoice({
        kind: "inspection",
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setInvoiceState({ number: res.invoiceNumber, sent: res.whopInvoiceSent });
    } catch {
      setInvoiceState("error");
    }
  };

  return (
    <section className="section" id="estimate">
      <div className="container">
        <div className="estimate-wrap">
          <div className="estimate-copy">
            <p className="eyebrow">Free estimate</p>
            <h2>Get your ballpark price in 60 seconds.</h2>
            <p>
              Tell us about your roof and we'll give you an instant ballpark range
              — then a real human follows up within one business day with an exact,
              written quote. No obligation, no pressure.
            </p>
            <div className="calc-box">
              <h3>Your ballpark estimate</h3>
              <p>
                {form.roofSizeSqft.toLocaleString()} sq ft ·{" "}
                {ROOF_TYPES.find((t) => t.value === form.roofType)?.label} ·{" "}
                {form.service}
              </p>
              <div className="calc-range">
                ${low.toLocaleString()} – ${high.toLocaleString()}
              </div>
              <small>
                Rough range only — final price depends on pitch, layers, decking
                condition and material. Your written quote is exact.
              </small>
            </div>
            <p style={{ marginTop: 20, fontSize: 14 }}>
              Prefer to talk? Call{" "}
              <a href="tel:+12145550148" style={{ fontWeight: 700 }}>
                (214) 555-0148
              </a>{" "}
              — a real roofer answers, 7 days a week.
            </p>
          </div>

          <div className="form-card">
            <h3>Request my free estimate</h3>
            <p>We reply within one business day with your exact written quote.</p>
            {done ? (
              <div>
                <div className="form-success">
                  <h4>✓ Thanks, {form.firstName} — request received!</h4>
                  <p>
                    Your ballpark range is{" "}
                    <b>
                      ${done.low.toLocaleString()} – ${done.high.toLocaleString()}
                    </b>
                    . We'll email your exact written quote to{" "}
                    <b>{form.email}</b> within one business day.
                    <br />
                    <span style={{ fontSize: 13, color: "var(--slate-500)" }}>
                      Lead #{done.leadId}
                      {done.whopEventSent
                        ? " · recorded in Whop as a lead event."
                        : " · saved (Whop lead event will sync once the API key is connected)."}
                    </span>
                  </p>
                </div>
                <div style={{ marginTop: 18 }}>
                  <p style={{ fontSize: 14.5, marginBottom: 10 }}>
                    Want the $149 inspection locked in now? We can email you a
                    Whop invoice for it — pay by card when you're ready.
                  </p>
                  {invoiceState === null && (
                    <button className="btn btn-navy btn-block" onClick={requestInspectionInvoice}>
                      Email Me an Invoice for the $149 Inspection
                    </button>
                  )}
                  {invoiceState === "busy" && (
                    <button className="btn btn-navy btn-block" disabled>
                      Sending invoice…
                    </button>
                  )}
                  {typeof invoiceState === "object" && invoiceState !== null && (
                    <div className="form-success" style={{ marginTop: 0 }}>
                      <h4>
                        ✓ {invoiceState.sent
                          ? `Invoice ${invoiceState.number} sent`
                          : `Invoice request ${invoiceState.number} saved`}
                      </h4>
                      <p>
                        {invoiceState.sent ? (
                          <>
                            Check {form.email} — your $149 inspection invoice is on
                            its way, payable by card through Whop's secure checkout.
                          </>
                        ) : (
                          <>
                            Demo mode: the invoice request is saved and will be
                            emailed from Whop once checkout is connected. Call us
                            at (214) 555-0148 and we'll book your inspection
                            right away.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  {invoiceState === "error" && (
                    <div className="form-error">
                      Couldn't send the invoice just now — call us at (214)
                      555-0148 and we'll sort it in a minute.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ef-first">First name *</label>
                    <input
                      id="ef-first"
                      required
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="James"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ef-last">Last name *</label>
                    <input
                      id="ef-last"
                      required
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Carter"
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ef-email">Email *</label>
                    <input
                      id="ef-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ef-phone">Phone *</label>
                    <input
                      id="ef-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="(214) 555-0100"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="ef-address">Home address</label>
                  <input
                    id="ef-address"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street address, Dallas, TX"
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ef-zip">ZIP code *</label>
                    <input
                      id="ef-zip"
                      required
                      pattern="[0-9]{5}"
                      value={form.zip}
                      onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="75201"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ef-service">Service needed *</label>
                    <select
                      id="ef-service"
                      value={form.service}
                      onChange={(e) => set("service", e.target.value)}
                    >
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ef-type">Roof type</label>
                    <select
                      id="ef-type"
                      value={form.roofType}
                      onChange={(e) => set("roofType", e.target.value)}
                    >
                      {ROOF_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="ef-age">Roof age</label>
                    <select
                      id="ef-age"
                      value={form.roofAge}
                      onChange={(e) => set("roofAge", e.target.value)}
                    >
                      {["Under 5 years", "5-10 years", "10-20 years", "20+ years", "Not sure"].map(
                        (a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="ef-size">
                    Approximate roof size: {form.roofSizeSqft.toLocaleString()} sq ft
                  </label>
                  <input
                    id="ef-size"
                    type="range"
                    min={800}
                    max={4000}
                    step={100}
                    value={form.roofSizeSqft}
                    onChange={(e) => set("roofSizeSqft", Number(e.target.value))}
                    style={{ padding: 0 }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ef-msg">Anything we should know? (optional)</label>
                  <textarea
                    id="ef-msg"
                    rows={3}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="e.g. Leak above the kitchen after the last storm…"
                  />
                </div>
                <button className="btn btn-amber btn-block" type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Get My Free Estimate →"}
                </button>
                {error && <div className="form-error">{error}</div>}
                <p className="form-note">
                  No spam, ever. Your details go only to Summit Peak Roofing.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
