/**
 * SVG wedge for the Time Timer® red disk.
 * 0° = 12 o'clock on the dial; sweep increases clockwise (same as minute ticks).
 */

export const DIAL_CX = 200;
export const DIAL_CY = 200;
export const DIAL_FACE_R = 168;

/** Minute position on dial → degrees clockwise from 12 o'clock. */
export function minuteToDegrees(minute: number): number {
  return minute * 6;
}

/** Cartesian point on the dial (SVG y-down). */
export function dialPolar(deg: number, radius: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [
    DIAL_CX + radius * Math.cos(rad),
    DIAL_CY + radius * Math.sin(rad),
  ];
}

/**
 * Pie wedge from 12 o'clock sweeping clockwise by `sweepDeg` (0–360).
 * Returns null when there is nothing to draw.
 */
export function redDiskPath(sweepDeg: number, radius = DIAL_FACE_R): string | null {
  const sweep = Math.min(360, Math.max(0, sweepDeg));
  if (sweep <= 0) return null;

  if (sweep >= 359.995) {
    return [
      `M ${DIAL_CX} ${DIAL_CY - radius}`,
      `A ${radius} ${radius} 0 1 1 ${DIAL_CX} ${DIAL_CY + radius}`,
      `A ${radius} ${radius} 0 1 1 ${DIAL_CX} ${DIAL_CY - radius}`,
      "Z",
    ].join(" ");
  }

  const [x0, y0] = dialPolar(0, radius);
  const [x1, y1] = dialPolar(sweep, radius);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${DIAL_CX} ${DIAL_CY}`,
    `L ${x0} ${y0}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`,
    "Z",
  ].join(" ");
}

/** Remaining time on a 60-minute face → clockwise sweep in degrees. */
export function dialSweepDegrees(fractionOf60: number): number {
  return Math.min(360, Math.max(0, fractionOf60 * 360));
}
