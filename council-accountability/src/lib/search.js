/** Card grid search helpers. */

export function cardMatchesSearch(haystack, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return String(haystack || "").toLowerCase().includes(q);
}
