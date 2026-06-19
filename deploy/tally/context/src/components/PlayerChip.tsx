type Props = {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
};

function initialFromName(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

/** Colored player marker with initial — like a pencil chip at the game table. */
export function PlayerChip({ name, color, size = 'md' }: Props) {
  return (
    <span
      className={`player-chip player-chip--${size}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-hidden
    >
      {initialFromName(name)}
    </span>
  );
}
