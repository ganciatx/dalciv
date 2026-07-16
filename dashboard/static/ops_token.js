/**
 * Shared OPS_API_TOKEN helpers for dashboard + command portal.
 * Storage key and header contract must stay aligned with dashboard/ops_auth.py.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "sivic_ops_token";
  const HEADER = "X-Ops-Token";
  const QUERY = "ops_token";

  function getToken() {
    return global.sessionStorage.getItem(STORAGE_KEY) || "";
  }

  function setToken(token) {
    const value = String(token || "").trim();
    if (value) {
      global.sessionStorage.setItem(STORAGE_KEY, value);
    }
    return value;
  }

  /** Seed from ?ops_token=, then scrub it from the URL bar. */
  function seedFromUrl() {
    const params = new URLSearchParams(global.location.search);
    const fromUrl = params.get(QUERY);
    if (!fromUrl) return "";
    setToken(fromUrl);
    params.delete(QUERY);
    const qs = params.toString();
    global.history.replaceState(
      {},
      "",
      global.location.pathname + (qs ? `?${qs}` : "") + global.location.hash,
    );
    return getToken();
  }

  function headers() {
    const token = getToken();
    return token ? { [HEADER]: token } : {};
  }

  /** Prompt once per session when mutating calls need a token. */
  function ensureToken() {
    let token = getToken();
    if (token) return token;
    token = (global.prompt("OPS_API_TOKEN required for this action:") || "").trim();
    return setToken(token);
  }

  function opsFetch(url, options) {
    const opts = options || {};
    const token = ensureToken();
    if (!token) {
      return Promise.reject(new Error("OPS_API_TOKEN is required"));
    }
    const nextHeaders = new Headers(opts.headers || {});
    nextHeaders.set(HEADER, token);
    return global.fetch(url, { ...opts, headers: nextHeaders });
  }

  /**
   * Wire the command unlock form (#unlock / #token / #err).
   * @param {{ notConfigured?: boolean }} opts
   */
  function bindUnlockForm(opts) {
    const options = opts || {};
    const err = global.document.getElementById("err");
    const form = global.document.getElementById("unlock");
    if (!form || !err) return;

    const paramsBefore = new URLSearchParams(global.location.search);
    const rejectedAttempt = paramsBefore.has(QUERY);
    seedFromUrl();

    if (options.notConfigured) {
      err.textContent =
        "Server is missing OPS_API_TOKEN — set it in the environment.";
      err.hidden = false;
    } else if (rejectedAttempt) {
      err.textContent = "Token rejected. Check OPS_API_TOKEN and try again.";
      err.hidden = false;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = global.document.getElementById("token");
      const token = setToken(input ? input.value : "");
      global.location.replace(
        "/command?" + QUERY + "=" + encodeURIComponent(token),
      );
    });
  }

  global.SivicOpsToken = {
    STORAGE_KEY,
    HEADER,
    QUERY,
    getToken,
    setToken,
    seedFromUrl,
    headers,
    ensureToken,
    opsFetch,
    bindUnlockForm,
  };
})(typeof window !== "undefined" ? window : globalThis);
