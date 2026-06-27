export interface BreachRecord {
  id: string;
  name: string;
  date: string | null;
  added_date: string | null;
  domain: string | null;
  industry: string | null;
  exposed_records: number | null;
  exposed_data: string[];
  description: string | null;
  verified: boolean;
  sensitive: boolean;
  logo: string | null;
}

export interface BreachCheckResult {
  email: string;
  found: boolean;
  breach_count: number;
  breaches: BreachRecord[];
  source: string;
}

export type CheckStatus = "idle" | "loading" | "success" | "error";
