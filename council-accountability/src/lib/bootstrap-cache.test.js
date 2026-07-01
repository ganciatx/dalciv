import { describe, expect, it } from "vitest";
import {
  BOOTSTRAP_SESSION_KEY,
  BOOTSTRAP_SESSION_TTL_MS,
  readBootstrapSession,
  saveBootstrapSession,
} from "./bootstrap-cache.js";

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, value);
  }
}

describe("bootstrap session cache", () => {
  it("round-trips bootstrap payload within TTL", () => {
    const storage = new MemoryStorage();
    const body = { directory: { members: [{ id: "chad-west" }] } };
    const now = 1_700_000_000_000;

    saveBootstrapSession(storage, body, now);
    expect(readBootstrapSession(storage, now + 1000)).toEqual(body);
  });

  it("expires after one hour", () => {
    const storage = new MemoryStorage();
    const body = { directory: { members: [] } };
    const now = 1_700_000_000_000;

    saveBootstrapSession(storage, body, now);
    expect(
      readBootstrapSession(storage, now + BOOTSTRAP_SESSION_TTL_MS + 1)
    ).toBeNull();
  });

  it("uses the expected storage key", () => {
    const storage = new MemoryStorage();
    saveBootstrapSession(storage, { ok: true }, Date.now());
    expect(storage.getItem(BOOTSTRAP_SESSION_KEY)).toBeTruthy();
  });
});
