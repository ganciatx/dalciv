/** City silhouette — opacity reflects infrastructure + safety health. */
export function Skyline({
  infraHealth,
  crimeRate,
}: {
  infraHealth: number;
  crimeRate: number;
}) {
  const glow = Math.max(0.25, infraHealth / 100);
  const windows = Math.max(0.15, 1 - crimeRate / 100);

  return (
    <div className="skyline" aria-hidden="true">
      <svg viewBox="0 0 800 72" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a4060" />
            <stop offset="100%" stopColor="#141c27" />
          </linearGradient>
        </defs>
        <rect width="800" height="72" fill="url(#sky)" />
        {[40, 120, 200, 280, 360, 440, 520, 600, 680].map((x, i) => {
          const h = 20 + (i % 5) * 12 + (i % 3) * 8;
          return (
            <g key={x} opacity={0.5 + glow * 0.5}>
              <rect
                x={x}
                y={72 - h}
                width={48 + (i % 2) * 20}
                height={h}
                fill="#1e2d42"
                stroke="rgba(232,168,56,0.2)"
                strokeWidth="0.5"
              />
              {Array.from({ length: Math.floor(h / 10) }).map((_, row) =>
                Array.from({ length: 3 }).map((__, col) => (
                  <rect
                    key={`${x}-${row}-${col}`}
                    x={x + 8 + col * 14}
                    y={72 - h + 6 + row * 10}
                    width={6}
                    height={5}
                    fill={`rgba(232,168,56,${windows * 0.7})`}
                  />
                )),
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
