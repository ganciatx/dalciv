import type { TimerTheme } from "../themes";
import {
  DIAL_CX,
  DIAL_CY,
  DIAL_FACE_R,
  dialPolar,
  dialSweepDegrees,
  minuteToDegrees,
  redDiskPath,
} from "./redDiskPath";

const MINUTE_MARKS = Array.from({ length: 60 }, (_, i) => i);

interface TimeTimerFaceProps {
  theme: TimerTheme;
  fractionRemaining: number;
  clockLabel: string;
  statusLabel: string;
  /** Hide status line under digits (focus mode while running). */
  minimalCenter?: boolean;
  /** Show MM:SS in the center hub. */
  showDigits?: boolean;
}

export function TimeTimerFace({
  theme,
  fractionRemaining,
  clockLabel,
  statusLabel,
  minimalCenter = false,
  showDigits = false,
}: TimeTimerFaceProps) {
  const diskD = redDiskPath(dialSweepDegrees(fractionRemaining));

  return (
    <svg
      className="timer-face"
      viewBox="0 0 400 400"
      role="img"
      aria-label={`Time remaining ${clockLabel}. ${statusLabel}`}
    >
      <defs>
        <filter id="face-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
        <clipPath id="dial-face-clip">
          <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_FACE_R} />
        </clipPath>
      </defs>

      <rect x="8" y="8" width="384" height="384" rx="18" fill={theme.frame} />
      <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_FACE_R + 6} fill={theme.frameRing} />
      <circle
        cx={DIAL_CX}
        cy={DIAL_CY}
        r={DIAL_FACE_R}
        fill={theme.face}
        filter="url(#face-shadow)"
      />

      <g clipPath="url(#dial-face-clip)">
        {diskD ? <path d={diskD} fill={theme.disk} /> : null}
      </g>

      {MINUTE_MARKS.map((min) => {
        const isMajor = min % 5 === 0;
        const len = isMajor ? 14 : 7;
        const w = isMajor ? 2.2 : 1;
        const deg = minuteToDegrees(min);
        const [x1, y1] = dialPolar(deg, DIAL_FACE_R - 4);
        const [x2, y2] = dialPolar(deg, DIAL_FACE_R - 4 - len);
        return (
          <line
            key={min}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={theme.marks}
            strokeWidth={w}
            strokeLinecap="round"
          />
        );
      })}

      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
        const [x, y] = dialPolar(minuteToDegrees(min), DIAL_FACE_R - 36);
        return (
          <text
            key={min}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="minute-label"
            fill={theme.marks}
          >
            {min === 0 ? "0" : min}
          </text>
        );
      })}

      <circle
        cx={DIAL_CX}
        cy={DIAL_CY}
        r={DIAL_FACE_R - 2}
        fill="none"
        stroke={theme.lensHighlight}
        strokeWidth="3"
      />
      <circle
        cx={DIAL_CX}
        cy={DIAL_CY}
        r={DIAL_FACE_R}
        fill="none"
        stroke={theme.lensEdge}
        strokeWidth="1.5"
      />

      <circle cx={DIAL_CX} cy={DIAL_CY} r={52} fill={theme.center} />
      {showDigits ? (
        <text
          x={DIAL_CX}
          y={minimalCenter ? DIAL_CY : DIAL_CY - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="clock-digits"
          fill={theme.centerDigits}
        >
          {clockLabel}
        </text>
      ) : null}
      {!minimalCenter && !showDigits ? (
        <text
          x={DIAL_CX}
          y={DIAL_CY}
          textAnchor="middle"
          dominantBaseline="central"
          className="status-caption"
          fill={theme.centerCaption}
        >
          {statusLabel}
        </text>
      ) : null}
      {!minimalCenter && showDigits ? (
        <text
          x={DIAL_CX}
          y={DIAL_CY + 22}
          textAnchor="middle"
          className="status-caption"
          fill={theme.centerCaption}
        >
          {statusLabel}
        </text>
      ) : null}
    </svg>
  );
}
