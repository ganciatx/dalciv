import { describe, expect, it } from "vitest";
import {
  filterOverlapRows,
  isOverlapContributor,
  overlapRole,
  overlapRoleLabel,
} from "./overlap.js";

const donor = {
  entity: "Apartment Association",
  campaign_role: "contributor",
  campaign_contributed: 2500,
  campaign_received: 0,
};

const vendor = {
  entity: "Print Shop LLC",
  campaign_role: "recipient",
  campaign_contributed: 0,
  campaign_received: 1200,
};

const both = {
  entity: "Dual Corp",
  campaign_contributed: 500,
  campaign_received: 300,
};

describe("overlapRole", () => {
  it("prefers explicit campaign_role", () => {
    expect(overlapRole(donor)).toBe("contributor");
    expect(overlapRole(vendor)).toBe("recipient");
  });

  it("derives both when money flows both ways", () => {
    expect(overlapRole(both)).toBe("both");
  });

  it("falls back to campaign_kind for member-level rows", () => {
    expect(
      overlapRole({ campaign_kind: "contribution", campaign_amount: 100 })
    ).toBe("contributor");
    expect(
      overlapRole({ campaign_kind: "expenditure", campaign_amount: 50 })
    ).toBe("recipient");
  });
});

describe("filterOverlapRows", () => {
  const rows = [donor, vendor, both];

  it("returns all rows when filter is all", () => {
    expect(filterOverlapRows(rows, "all")).toHaveLength(3);
  });

  it("shows donors for contributors filter (includes both)", () => {
    const filtered = filterOverlapRows(rows, "contributors");
    expect(filtered.map((r) => r.entity)).toEqual([
      "Apartment Association",
      "Dual Corp",
    ]);
    expect(filtered.every(isOverlapContributor)).toBe(true);
  });

  it("shows vendor-only overlaps for vendors filter", () => {
    const filtered = filterOverlapRows(rows, "vendors");
    expect(filtered.map((r) => r.entity)).toEqual(["Print Shop LLC"]);
  });
});

describe("overlapRoleLabel", () => {
  it("uses user-facing donor/vendor language", () => {
    expect(overlapRoleLabel("contributor")).toBe("Campaign donor");
    expect(overlapRoleLabel("recipient")).toBe("Campaign vendor");
    expect(overlapRoleLabel("both")).toBe("Donor & vendor");
  });
});
