/** Active councilmembers for browse lists and filters. */

export function listableMembers(members) {
  return (members || [])
    .filter((m) => m.council_status === "active")
    .sort((a, b) => {
      const da = Number(a.district_num) || 99;
      const db = Number(b.district_num) || 99;
      if (da !== db) return da - db;
      return String(a.display_name || "").localeCompare(String(b.display_name || ""));
    });
}
