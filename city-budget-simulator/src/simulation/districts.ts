import type {
  District,
  DistrictId,
  DistrictPriority,
  GameState,
  PlayerDecisions,
  ScenarioId,
} from "./types";

const PRIORITY_WEIGHTS: Record<DistrictPriority, Record<DistrictId, number>> = {
  balanced: { core: 0.34, growth: 0.33, outer: 0.33 },
  core: { core: 0.55, growth: 0.28, outer: 0.17 },
  growth: { core: 0.22, growth: 0.52, outer: 0.26 },
  outer: { core: 0.2, growth: 0.25, outer: 0.55 },
};

/** Default three-district map for a new game. */
export function createDefaultDistricts(scenarioId: ScenarioId): District[] {
  const base: District[] = [
    {
      id: "core",
      label: "District 1 — Core",
      subtitle: "Downtown & historic neighborhoods",
      populationShare: 0.28,
      taxBaseShare: 0.42,
      roadCondition: 72,
      crimeIndex: 38,
      maintenanceNeed: 38,
    },
    {
      id: "growth",
      label: "District 2 — Growth",
      subtitle: "New corridors & commercial strips",
      populationShare: 0.38,
      taxBaseShare: 0.35,
      roadCondition: 66,
      crimeIndex: 44,
      maintenanceNeed: 34,
    },
    {
      id: "outer",
      label: "District 3 — Outer",
      subtitle: "Suburbs & industrial edges",
      populationShare: 0.34,
      taxBaseShare: 0.23,
      roadCondition: 58,
      crimeIndex: 48,
      maintenanceNeed: 28,
    },
  ];

  if (scenarioId === "rust-belt-reckoning") {
    base[0].roadCondition = 55;
    base[1].roadCondition = 52;
    base[2].roadCondition = 48;
    base[2].crimeIndex = 58;
  }
  if (scenarioId === "fiscal-precipice") {
    base.forEach((d) => {
      d.roadCondition -= 14;
      d.crimeIndex += 6;
    });
  }
  if (scenarioId === "greenfield") {
    base.forEach((d) => {
      d.roadCondition = 88;
      d.crimeIndex = 26;
    });
  }
  if (scenarioId === "coastal-squeeze") {
    base[0].crimeIndex = 32;
    base[1].roadCondition = 64;
  }

  return base;
}

export function maintenanceWeights(priority: DistrictPriority): Record<DistrictId, number> {
  return { ...PRIORITY_WEIGHTS[priority] };
}

export function totalMaintenanceNeed(state: GameState): number {
  return state.districts.reduce((s, d) => s + d.maintenanceNeed, 0);
}

/**
 * Split citywide maintenance spend by priority; decay district roads and crime.
 */
export function updateDistricts(
  state: GameState,
  decisions: PlayerDecisions,
): string[] {
  const alerts: string[] = [];
  const spend = decisions.expenditures.infrastructureMaintenance;
  const need = totalMaintenanceNeed(state);
  const weights = maintenanceWeights(decisions.districtPriority);

  for (const district of state.districts) {
    const share = weights[district.id];
    const allocated = spend * share;
    const hold = district.maintenanceNeed;
    const gap = hold - allocated;

    if (gap > 2) {
      const decay = (gap / hold) * 3.2;
      district.roadCondition = Math.max(12, district.roadCondition - decay);
      district.crimeIndex = Math.min(90, district.crimeIndex + decay * 0.35);
    } else {
      const repair = Math.min(4, (-gap / hold) * 2);
      district.roadCondition = Math.min(
        100,
        district.roadCondition + repair - 0.3,
      );
      district.crimeIndex = Math.max(15, district.crimeIndex - 0.4);
    }
  }

  const worst = [...state.districts].sort(
    (a, b) => a.roadCondition - b.roadCondition,
  )[0];
  state.runStats.lowestDistrictRoads = Math.round(worst.roadCondition);

  if (spend < need * 0.75) {
    state.runStats.maintenanceBelowHoldYears += 1;
  } else {
    state.runStats.maintenanceBelowHoldYears = 0;
  }

  if (worst.roadCondition < 40) {
    alerts.push(
      `${worst.label} roads at ${Math.round(worst.roadCondition)} — constituents are furious.`,
    );
  }

  const avgRoad =
    state.districts.reduce((s, d) => s + d.roadCondition, 0) /
    state.districts.length;
  const roadsAsset = state.systems.infrastructure.assets.find(
    (a) => a.id === "roads",
  );
  if (roadsAsset) {
    roadsAsset.condition = Math.round(avgRoad * 0.55 + roadsAsset.condition * 0.45);
  }

  return alerts;
}

export function avgDistrictRoads(state: GameState): number {
  if (!state.districts.length) return 0;
  return (
    state.districts.reduce((s, d) => s + d.roadCondition, 0) /
    state.districts.length
  );
}
