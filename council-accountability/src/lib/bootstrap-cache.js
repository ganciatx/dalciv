/** Client-side bootstrap cache for instant council-accountability paint. */

export const BOOTSTRAP_SESSION_KEY = "ca-bootstrap-v1";
export const BOOTSTRAP_SESSION_TTL_MS = 60 * 60 * 1000;

export function readBootstrapSession(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(BOOTSTRAP_SESSION_KEY);
    if (!raw) return null;
    const { savedAt, body } = JSON.parse(raw);
    if (!body || now - savedAt > BOOTSTRAP_SESSION_TTL_MS) return null;
    return body;
  } catch {
    return null;
  }
}

export function saveBootstrapSession(storage, body, now = Date.now()) {
  try {
    storage.setItem(
      BOOTSTRAP_SESSION_KEY,
      JSON.stringify({ savedAt: now, body })
    );
  } catch {
    /* quota / private mode */
  }
}
