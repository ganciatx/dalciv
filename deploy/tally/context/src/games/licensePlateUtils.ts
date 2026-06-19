import type { LicensePlateRegion } from '../types';
import { LICENSE_PLATE_REGIONS } from './licensePlateRegions';

/** Regions enabled for this session (US always; Canada optional). */
export function resolveActiveRegions(includeCanada: boolean): LicensePlateRegion[] {
  return LICENSE_PLATE_REGIONS.filter(
    (region) => region.group === 'us' || includeCanada,
  );
}

/** Count checked regions in a spotted map. */
export function checklistCount(
  spotted: Record<string, boolean> | undefined,
  regions: LicensePlateRegion[],
): number {
  return regions.filter((region) => spotted?.[region.id]).length;
}

/** Whether every active region is checked. */
export function checklistComplete(
  spotted: Record<string, boolean> | undefined,
  regions: LicensePlateRegion[],
): boolean {
  return regions.length > 0 && checklistCount(spotted, regions) >= regions.length;
}

/** Empty spotted map for all known regions. */
export function emptySpottedMap(): Record<string, boolean> {
  return Object.fromEntries(LICENSE_PLATE_REGIONS.map((r) => [r.id, false]));
}
