import { getPhaseDisplay } from '../../games/phase10Phases';

type Props = {
  phaseNumber: number;
  compact?: boolean;
};

/** Shows phase badge + requirement text for Phase 10 round entry. */
export function PhaseGoal({ phaseNumber, compact = false }: Props) {
  const { phaseNumber: num, label, finished } = getPhaseDisplay(phaseNumber);

  if (finished) {
    return <span className="phase-badge phase-badge-done">Done</span>;
  }

  return (
    <span className="phase-goal">
      <span className="phase-badge">P{num}</span>
      <span className={`phase-requirement ${compact ? 'phase-requirement-compact' : ''}`}>
        {label}
      </span>
    </span>
  );
}
