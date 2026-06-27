interface RiskGaugeProps {
  breachCount: number;
}

type RiskLevel = "low" | "moderate" | "high";

function getRiskLevel(count: number): RiskLevel {
  if (count === 0) return "low";
  if (count <= 5) return "moderate";
  return "high";
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Lower risk",
  moderate: "Moderate risk",
  high: "High risk",
};

export function RiskGauge({ breachCount }: RiskGaugeProps) {
  const level = getRiskLevel(breachCount);
  const fillPercent = breachCount === 0 ? 15 : Math.min(100, 25 + breachCount * 3);

  return (
    <div className={`risk-gauge risk-gauge--${level}`}>
      <p className="risk-gauge__number" aria-hidden="true">
        {breachCount}
      </p>
      <div className="risk-gauge__text">
        <p className="risk-gauge__label">{RISK_LABEL[level]}</p>
        <p className="risk-gauge__detail">
          {breachCount === 0
            ? "No breaches found"
            : `${breachCount} known ${breachCount === 1 ? "breach" : "breaches"}`}
        </p>
      </div>
      <div className="risk-gauge__meter" aria-hidden="true">
        <div className="risk-gauge__track">
          <div className="risk-gauge__fill" style={{ width: `${fillPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
