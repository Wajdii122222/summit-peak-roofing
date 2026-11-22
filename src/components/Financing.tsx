import { FINANCING } from "../config";

export default function Financing({ onEstimate }: { onEstimate: () => void }) {
  return (
    <section className="section" id="financing">
      <div className="container">
        <p className="eyebrow">Financing</p>
        <h2>A new roof shouldn't wait for a savings account.</h2>
        <p className="lede">
          Spread the cost with fixed monthly payments. Approval takes about 5
          minutes and checking your rate doesn't affect your credit score.
        </p>
        <div className="fin-grid">
          {FINANCING.map((f) => (
            <div className="fin-card" key={f.name}>
              <div className="apr">{f.name.split(" ")[0]} {f.name.split(" ")[1]}</div>
              <h3>{f.name.split(" ").slice(2).join(" ") || "APR"}</h3>
              <p>{f.desc}</p>
              <div className="example">{f.example}</div>
            </div>
          ))}
        </div>
        <p className="fin-note">
          Financing is provided through our third-party lending partners, subject
          to credit approval. Example payments assume the project total shown and
          exclude taxes and fees. Your exact rate and term are confirmed before
          any work begins — and a roof replacement may also qualify for
          manufacturer rebates and energy-efficiency credits. Ask us during your
          estimate.
        </p>
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-amber" onClick={onEstimate}>
            Check My Rate With a Free Estimate →
          </button>
        </div>
      </div>
    </section>
  );
}
