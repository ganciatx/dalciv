import { useGame } from '../context/GameContext';
import '../styles/keypad.css';

type Props = {
  onConfirmEnd: () => void;
};

/** Non-blocking banner when an auto end condition is met. */
export function EndGameBanner({ onConfirmEnd }: Props) {
  const { endBanner, dismissEndBanner } = useGame();
  if (!endBanner?.triggered) return null;

  return (
    <div className="banner" role="status">
      <span>{endBanner.message}</span>
      <div className="banner-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={onConfirmEnd}>
          End Game
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={dismissEndBanner}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
