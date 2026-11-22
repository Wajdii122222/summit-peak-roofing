import { SERVICES } from "../config";

export default function Services({ onEstimate }: { onEstimate: (service: string) => void }) {
  return (
    <section className="section" id="services">
      <div className="container">
        <p className="eyebrow">What we do</p>
        <h2>Every roofing service, under one roof.</h2>
        <p className="lede">
          From a single missing shingle to a full replacement after a Texas hail
          storm — one crew, one warranty, one company accountable for it all.
        </p>
        <div className="services-grid">
          {SERVICES.map((s) => (
            <article className="service-card" key={s.id}>
              <img src={s.image} alt={s.title} loading="lazy" />
              <div className="service-body">
                <span className="ic">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <ul>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <button className="link-arrow" onClick={() => onEstimate(s.title)}>
                  Get an estimate →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
