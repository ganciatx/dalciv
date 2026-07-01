import { describe, expect, it } from "vitest";
import { cardMatchesSearch } from "./search.js";

describe("cardMatchesSearch", () => {
  it("matches case-insensitive substrings", () => {
    expect(cardMatchesSearch("Chad West District 1", "chad")).toBe(true);
    expect(cardMatchesSearch("Chad West District 1", "district 1")).toBe(true);
  });

  it("shows all cards when query is empty", () => {
    expect(cardMatchesSearch("Chad West", "")).toBe(true);
    expect(cardMatchesSearch("Chad West", "   ")).toBe(true);
  });

  it("hides non-matching cards", () => {
    expect(cardMatchesSearch("Amy Active", "chad")).toBe(false);
  });
});
