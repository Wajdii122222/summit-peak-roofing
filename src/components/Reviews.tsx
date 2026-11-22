import { BUSINESS, REVIEWS } from "../config";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export default function Reviews() {
  return (
    <section className="section alt" id="reviews">
      <div className="container">
        <div className="reviews-head">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2>DFW homeowners keep recommending us.</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="stars">{stars(5)}</div>
            <b style={{ fontSize: 20 }}>
              {BUSINESS.rating} out of 5
            </b>
            <div style={{ color: "var(--slate-500)", fontSize: 14 }}>
              {BUSINESS.reviewCount}+ verified Google reviews
            </div>
          </div>
        </div>
        <div className="reviews-grid">
          {REVIEWS.map((r) => (
            <article className="review-card" key={r.name + r.date}>
              <div className="meta">
                <div className="who">
                  <b>{r.name}</b>
                  <span>
                    {r.location} · {r.date}
                  </span>
                </div>
                <span className="stars" style={{ fontSize: 16 }}>
                  {stars(r.rating)}
                </span>
              </div>
              <p>“{r.text}”</p>
              <span className="service-tag">{r.service}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
