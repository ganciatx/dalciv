/** City skyline — brightness reflects infrastructure + safety health. */
export function Skyline({
  infraHealth,
  crimeRate,
}: {
  infraHealth: number;
  crimeRate: number;
}) {
  const glow = Math.max(0.35, infraHealth / 100);
  const windows = Math.max(0.2, 1 - crimeRate / 100);

  return (
    <div className="skyline" aria-hidden="true">
      <svg viewBox="0 0 800 88" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87ceeb" />
            <stop offset="60%" stopColor="#b8e4f5" />
            <stop offset="100%" stopColor="#d4eed8" />
          </linearGradient>
          <linearGradient id="building" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a7ab0" />
            <stop offset="100%" stopColor="#2a5080" />
          </linearGradient>
        </defs>
        <rect width="800" height="88" fill="url(#sky)" />
        {/* City hall dome — centerpiece */}
        <g opacity={0.85 + glow * 0.15}>
          <rect x="355" y="28" width="90" height="60" fill="url(#building)" rx="2" />
          <rect x="375" y="12" width="50" height="20" fill="#3d6a9e" />
          <ellipse cx="400" cy="12" rx="28" ry="14" fill="#5b9fd4" />
          <rect x="392" y="0" width="16" height="14" fill="#d4a017" rx="1" />
        </g>
        {[40, 120, 200, 520, 600, 680].map((x, i) => {
          const h = 18 + (i % 5) * 10 + (i % 3) * 6;
          return (
            <g key={x} opacity={0.55 + glow * 0.45}>
              <rect
                x={x}
                y={88 - h}
                width={44 + (i % 2) * 16}
                height={h}
                fill="url(#building)"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="0.5"
                rx="1"
              />
              {Array.from({ length: Math.floor(h / 10) }).map((_, row) =>
                Array.from({ length: 3 }).map((__, col) => (
                  <rect
                    key={`${x}-${row}-${col}`}
                    x={x + 8 + col * 12}
                    y={88 - h + 5 + row * 10}
                    width={5}
                    height={4}
                    fill={`rgba(255,220,120,${windows * 0.85})`}
                    rx="0.5"
                  />
                )),
              )}
            </g>
          );
        })}
        {/* Park green foreground */}
        <rect x="0" y="78" width="800" height="10" fill="#5ec47e" opacity="0.7" />
      </svg>
    </div>
  );
}
