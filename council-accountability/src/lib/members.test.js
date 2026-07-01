import { describe, expect, it } from "vitest";
import { listableMembers } from "./members.js";

describe("listableMembers", () => {
  it("returns only active members sorted by district", () => {
    const members = [
      { id: "b", display_name: "Bob", council_status: "active", district_num: 2 },
      { id: "z", display_name: "Zed", council_status: "former", district_num: 1 },
      { id: "a", display_name: "Amy", council_status: "active", district_num: 1 },
    ];
    expect(listableMembers(members).map((m) => m.id)).toEqual(["a", "b"]);
  });
});
