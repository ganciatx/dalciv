import type { Phase10Phase } from '../types';

/** Standard Phase 10 (Masters edition) phase requirements. */
export const PHASE_10_PHASES: Phase10Phase[] = [
  { phase: 1, requirement: '2 sets of 3', shortLabel: '2× set of 3' },
  { phase: 2, requirement: '1 set of 3 + 1 run of 4', shortLabel: 'set of 3 + run of 4' },
  { phase: 3, requirement: '1 set of 3 + 1 run of 7', shortLabel: 'set of 3 + run of 7' },
  { phase: 4, requirement: '1 run of 7', shortLabel: 'run of 7' },
  { phase: 5, requirement: '1 run of 8', shortLabel: 'run of 8' },
  { phase: 6, requirement: '1 run of 9', shortLabel: 'run of 9' },
  { phase: 7, requirement: '2 sets of 4', shortLabel: '2× set of 4' },
  { phase: 8, requirement: '7 cards of one color', shortLabel: '7 one color' },
  { phase: 9, requirement: '1 set of 5 + 1 set of 2', shortLabel: 'set of 5 + set of 2' },
  { phase: 10, requirement: '1 set of 5 + 1 set of 3', shortLabel: 'set of 5 + set of 3' },
];

export type PhaseDisplay = {
  phaseNumber: number | null;
  label: string;
  finished: boolean;
};

/** Resolve display copy for a player's current (or historical) phase attempt. */
export function getPhaseDisplay(phaseNumber: number): PhaseDisplay {
  if (phaseNumber > 10) {
    return { phaseNumber: null, label: 'Finished', finished: true };
  }
  const entry = PHASE_10_PHASES.find((p) => p.phase === phaseNumber);
  return {
    phaseNumber,
    label: entry?.requirement ?? `Phase ${phaseNumber}`,
    finished: false,
  };
}

/**
 * Reconstruct which phase a player was attempting at the start of a given round.
 * Walks prior rounds and increments phase when "made" was checked.
 */
export function phaseAtRoundStart(
  player: { currentPhase?: number; phaseCompletedPerRound?: boolean[] },
  roundIndex: number,
): number {
  let phase = 1;
  for (let i = 0; i < roundIndex; i++) {
    if (player.phaseCompletedPerRound?.[i]) {
      phase += 1;
    }
  }
  return phase;
}
