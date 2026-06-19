import type { GameDefinition, GameSession, Player } from '../types';
import {
  checklistComplete,
  checklistCount,
  resolveActiveRegions,
} from '../games/licensePlateUtils';
import { YAHTZEE_CATEGORIES, YAHTZEE_UPPER_IDS } from '../games/yahtzeeCategories';

export type YahtzeeBreakdown = {
  upperSubtotal: number;
  upperBonus: number;
  lowerSubtotal: number;
  yahtzeeBonusTotal: number;
  grandTotal: number;
  upperFilled: number;
  upperTarget: number;
};

export function yahtzeeBreakdown(player: Player): YahtzeeBreakdown {
  const scores = player.categoryScores ?? {};
  const upperSubtotal = YAHTZEE_UPPER_IDS.reduce(
    (sum, id) => sum + (scores[id] ?? 0),
    0,
  );
  const upperBonus = upperSubtotal >= 63 ? 35 : 0;
  const lowerSubtotal = YAHTZEE_CATEGORIES.filter((c) => c.section === 'lower').reduce(
    (sum, c) => sum + (scores[c.id] ?? 0),
    0,
  );
  const yahtzeeBonusTotal = (player.yahtzeeBonusCount ?? 0) * 100;
  const grandTotal = upperSubtotal + upperBonus + lowerSubtotal + yahtzeeBonusTotal;

  const upperFilled = YAHTZEE_UPPER_IDS.filter((id) => scores[id] !== null && scores[id] !== undefined).length;

  return {
    upperSubtotal,
    upperBonus,
    lowerSubtotal,
    yahtzeeBonusTotal,
    grandTotal,
    upperFilled,
    upperTarget: YAHTZEE_UPPER_IDS.length,
  };
}

export function yahtzeeCategoryFilled(player: Player, categoryId: string): boolean {
  const val = player.categoryScores?.[categoryId];
  return val !== null && val !== undefined;
}

export function yahtzeeAllCategoriesFilled(player: Player): boolean {
  return YAHTZEE_CATEGORIES.every((c) => yahtzeeCategoryFilled(player, c.id));
}

export function roundTotal(player: Player): number {
  return (player.roundScores ?? []).reduce((sum, s) => sum + s, 0);
}

export function genericTotal(player: Player): number {
  return player.runningTotal ?? 0;
}

export function playerScore(
  player: Player,
  game: GameDefinition,
  session?: GameSession,
): number {
  if (game.id === 'yahtzee') return yahtzeeBreakdown(player).grandTotal;
  if (game.id === 'generic') return genericTotal(player);
  if (game.id === 'license_plate') {
    const regions = resolveActiveRegions(session?.includeCanada ?? false);
    if (session?.licensePlateCooperative) {
      return checklistCount(session.sharedSpottedRegions, regions);
    }
    return checklistCount(player.spottedRegions, regions);
  }
  if (game.id === 'tic_tac_toe') return player.matchWins ?? 0;
  return roundTotal(player);
}

export function allPlayerScores(
  session: GameSession,
  game: GameDefinition,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of session.players) {
    out[p.name] = playerScore(p, game, session);
  }
  return out;
}

export function effectiveWinCondition(
  game: GameDefinition,
  session: GameSession,
): 'highest' | 'lowest' {
  if (game.id === 'generic' && session.genericWinCondition) {
    return session.genericWinCondition;
  }
  return game.winCondition;
}

export function determineWinnerId(
  session: GameSession,
  game: GameDefinition,
): string | undefined {
  if (session.players.length === 0) return undefined;
  const win = effectiveWinCondition(game, session);
  const sorted = [...session.players].sort((a, b) => {
    const sa = playerScore(a, game, session);
    const sb = playerScore(b, game, session);
    return win === 'highest' ? sb - sa : sa - sb;
  });
  return sorted[0]?.id;
}

export type EndConditionResult = {
  triggered: boolean;
  message?: string;
  winnerPlayerId?: string;
};

/** Evaluate auto end conditions after each score change. */
export function evaluateEndCondition(
  session: GameSession,
  game: GameDefinition,
): EndConditionResult {
  const { endCondition } = game;

  if (endCondition.type === 'all_categories_filled') {
    const allFilled = session.players.every((p) => yahtzeeAllCategoriesFilled(p));
    if (allFilled) {
      const winnerId = determineWinnerId(session, game);
      const winner = session.players.find((p) => p.id === winnerId);
      return {
        triggered: true,
        message: winner
          ? `All categories filled — ${winner.name} leads with the highest total.`
          : 'All categories filled for every player.',
        winnerPlayerId: winnerId,
      };
    }
  }

  if (endCondition.type === 'first_to_complete_phase') {
    const finisher = session.players.find((p) => (p.currentPhase ?? 1) > 10);
    if (finisher) {
      const winnerId = determineWinnerId(session, game);
      const winner = session.players.find((p) => p.id === winnerId);
      return {
        triggered: true,
        message: `${finisher.name} completed Phase 10!${winner ? ` ${winner.name} wins with the lowest total.` : ''}`,
        winnerPlayerId: winnerId,
      };
    }
  }

  if (endCondition.type === 'checklist_complete') {
    const regions = resolveActiveRegions(session.includeCanada ?? false);
    const total = regions.length;

    if (session.licensePlateCooperative) {
      if (checklistComplete(session.sharedSpottedRegions, regions)) {
        return {
          triggered: true,
          message: `All ${total} plates spotted — full list complete!`,
        };
      }
    } else {
      const completer = session.players.find((p) =>
        checklistComplete(p.spottedRegions, regions),
      );
      if (completer) {
        const winnerId = determineWinnerId(session, game);
        const leader = session.players.find((p) => p.id === winnerId);
        return {
          triggered: true,
          message: completer
            ? `${completer.name} spotted every plate!${
                leader ? ` ${leader.name} leads with ${playerScore(leader, game, session)}.` : ''
              }`
            : 'Checklist complete.',
          winnerPlayerId: winnerId,
        };
      }
    }
  }

  return { triggered: false };
}

export function sortedStandings(
  session: GameSession,
  game: GameDefinition,
): Array<{ player: Player; score: number; rank: number }> {
  const win = effectiveWinCondition(game, session);
  const sorted = [...session.players]
    .map((p) => ({ player: p, score: playerScore(p, game, session) }))
    .sort((a, b) => (win === 'highest' ? b.score - a.score : a.score - b.score));

  return sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
