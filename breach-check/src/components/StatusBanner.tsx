import type { BreachCheckResult } from "../types";
import { RiskGauge } from "./RiskGauge";

interface StatusBannerProps {
  result: BreachCheckResult;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export function StatusBanner({ result }: StatusBannerProps) {
  const { found, email } = result;
  const masked = maskEmail(email);

  return (
    <section className="status-banner" aria-live="polite">
      <RiskGauge breachCount={result.breach_count} />
      <div className="status-copy">
        {found ? (
          <>
            <h2>Your email has been exposed</h2>
            <p>
              <span className="mono">{masked}</span> was found in public breach records.
            </p>
          </>
        ) : (
          <>
            <h2>No breaches found</h2>
            <p>
              <span className="mono">{masked}</span> was not found in this scan.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export function formatBreachDate(raw: string | null): string {
  if (!raw) return "Date unknown";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Date unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatExposedRecords(count: number | null): string | null {
  if (count == null || Number.isNaN(count)) return null;
  return `${new Intl.NumberFormat("en-US").format(count)} accounts exposed`;
}
