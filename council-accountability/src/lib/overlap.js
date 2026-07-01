/** Lobby ↔ campaign overlap classification and filtering (shared with tests). */

export function overlapRole(r) {
  if (r.campaign_role) return r.campaign_role;
  const contributed = r.campaign_contributed || 0;
  const received = r.campaign_received || 0;
  if (contributed > 0 && received > 0) return "both";
  if (contributed > 0) return "contributor";
  if (received > 0) return "recipient";
  if (r.campaign_kind === "contribution") return "contributor";
  if (r.campaign_kind === "expenditure") return "recipient";
  return "other";
}

export function isOverlapContributor(r) {
  const role = overlapRole(r);
  return role === "contributor" || role === "both";
}

export function filterOverlapRows(rows, roleFilter) {
  const list = rows || [];
  if (roleFilter === "contributors") {
    return list.filter((r) => isOverlapContributor(r));
  }
  if (roleFilter === "vendors") {
    return list.filter((r) => overlapRole(r) === "recipient");
  }
  return list;
}

export function overlapRoleLabel(role) {
  if (role === "contributor") return "Campaign donor";
  if (role === "recipient") return "Campaign vendor";
  if (role === "both") return "Donor & vendor";
  return "Campaign finance";
}
