import type { BreachCheckResult } from "../types";
import { BreachCard } from "./BreachCard";
import { ProductPitch } from "./ProductPitch";
import { StatusBanner } from "./StatusBanner";

const BOOTH_BREACH_LIMIT = 4;

interface BreachResultsProps {
  result: BreachCheckResult;
  onReset: () => void;
}

export function BreachResults({ result, onReset }: BreachResultsProps) {
  const visible = result.breaches.slice(0, BOOTH_BREACH_LIMIT);
  const overflow = result.breach_count - visible.length;

  return (
    <section className="results">
      <StatusBanner result={result} />

      {result.found ? (
        <div className="breach-section">
          <h3 className="breach-section__title">Where it was exposed</h3>
          <div className="breach-list">
            {visible.map((breach, index) => (
              <BreachCard key={breach.id} breach={breach} index={index} />
            ))}
          </div>
          {overflow > 0 ? (
            <p className="breach-overflow">+ {overflow} more not shown</p>
          ) : null}
        </div>
      ) : null}

      <ProductPitch found={result.found} onReset={onReset} />
    </section>
  );
}
