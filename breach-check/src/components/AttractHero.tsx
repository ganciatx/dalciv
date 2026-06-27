import { ShieldMark } from "./ShieldMark";

export function AttractHero() {
  return (
    <section className="attract-hero" aria-label="Demo introduction">
      <p className="attract-hero__headline">
        Could a data breach put your tax refund at risk?
      </p>
      <p className="attract-hero__subhead">
        Enter your email for a free exposure scan. Takes seconds. Nothing is saved.
      </p>

      <div className="attract-hero__stats">
        <article className="stat-card">
          <strong>$43B+</strong>
          <span>lost to identity theft each year</span>
        </article>
        <article className="stat-card">
          <strong>1 in 4</strong>
          <span>Americans hit by ID theft</span>
        </article>
      </div>
    </section>
  );
}
