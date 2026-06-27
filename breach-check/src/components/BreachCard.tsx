import type { BreachRecord } from "../types";
import { formatBreachDate } from "./StatusBanner";

interface BreachCardProps {
  breach: BreachRecord;
  index: number;
}

export function BreachCard({ breach, index }: BreachCardProps) {
  const dateLabel = formatBreachDate(breach.date);

  return (
    <article
      className="breach-card"
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <h3>{breach.name}</h3>
      <p className="breach-card__meta">{dateLabel}</p>
    </article>
  );
}
