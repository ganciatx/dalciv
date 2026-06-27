import { ShieldMark } from "./ShieldMark";

interface ProductPitchProps {
  found: boolean;
  onReset: () => void;
}

const BENEFITS = [
  "IRS identity theft alerts",
  "Dark web monitoring",
  "Stolen refund help",
  "Identity restoration specialist",
];

export function ProductPitch({ found, onReset }: ProductPitchProps) {
  return (
    <section className="product-pitch">
      <div className="product-pitch__header">
        <ShieldMark className="product-pitch__icon" />
        <div>
          <p className="product-pitch__eyebrow">H&amp;R Block</p>
          <h2>Tax Identity Shield</h2>
        </div>
      </div>

      <p className="product-pitch__lead">
        {found
          ? "Protect your refund if identity thieves file in your name."
          : "Stay protected — new breaches happen every day."}
      </p>

      <ul className="product-pitch__benefits">
        {BENEFITS.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      <p className="product-pitch__cta">
        Ask our booth team about <strong>Tax Identity Shield</strong>.
      </p>

      <button className="reset-btn" type="button" onClick={onReset}>
        Scan another email
      </button>
    </section>
  );
}
