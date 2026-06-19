import type { ReactNode } from 'react';
import { resolveGameTheme } from '../theme/gameThemes';

type Props = {
  gameId?: string | null;
  className?: string;
  children: ReactNode;
};

/** Applies per-game CSS accent variables through `data-game-theme`. */
export function GameThemeScope({ gameId, className = '', children }: Props) {
  const theme = resolveGameTheme(gameId);
  return (
    <div className={`game-theme-scope ${className}`.trim()} data-game-theme={theme}>
      {children}
    </div>
  );
}
