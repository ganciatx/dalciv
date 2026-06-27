import type { BreachCheckResult } from "./types";

export async function checkEmailBreaches(email: string): Promise<BreachCheckResult> {
  const params = new URLSearchParams({ email });
  const response = await fetch(`/api/breach-check/email?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => null)) as
    | BreachCheckResult
    | { detail?: string }
    | null;

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : "Unable to check this email right now.";
    throw new Error(detail);
  }

  if (!payload || typeof payload !== "object" || !("email" in payload)) {
    throw new Error("Unexpected response from breach service.");
  }

  return payload as BreachCheckResult;
}
