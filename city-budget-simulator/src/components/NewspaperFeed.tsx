import type { GameState } from "../simulation/types";

export function NewspaperFeed({ game }: { game: GameState }) {
  const papers = [...game.newspapers].reverse().slice(0, 6);
  if (!papers.length) return null;

  return (
    <div className="panel newspaper-panel">
      <h2>{game.city.name} Daily</h2>
      <ul className="newspaper-list">
        {papers.map((n, i) => (
          <li key={`${n.year}-${i}`} className={i === 0 ? "latest" : ""}>
            <span className="paper-year">FY{n.year}</span>
            <span className="paper-headline">{n.headline}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
