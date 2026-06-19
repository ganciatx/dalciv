import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { GameSession, HistoryEntry, StartSessionOptions } from '../types';
import { getGameDefinition } from '../games/definitions';
import { emptySpottedMap } from '../games/licensePlateUtils';
import { createPlayer, localStorageAdapter } from '../storage/storage';
import {
  allPlayerScores,
  determineWinnerId,
  evaluateEndCondition,
  type EndConditionResult,
} from '../utils/scoring';
import { emptyTttBoard } from '../utils/ticTacToe';

type GameContextValue = {
  session: GameSession | null;
  endBanner: EndConditionResult | null;
  dismissEndBanner: () => void;
  startSession: (
    gameId: string,
    playerNames: string[],
    options?: StartSessionOptions,
  ) => GameSession;
  resumeSession: () => GameSession | null;
  clearActiveSession: () => void;
  updateSession: (updater: (prev: GameSession) => GameSession) => void;
  completeGame: () => { entry: HistoryEntry; session: GameSession } | null;
  history: HistoryEntry[];
};

const GameContext = createContext<GameContextValue | null>(null);

function initPlayersForGame(gameId: string, playerNames: string[]) {
  return playerNames.map((name, i) => {
    const player = createPlayer(name, i);
    if (gameId === 'license_plate') {
      return { ...player, spottedRegions: emptySpottedMap() };
    }
    if (gameId === 'tic_tac_toe') {
      return { ...player, matchWins: 0 };
    }
    return player;
  });
}

function initSessionFields(
  gameId: string,
  players: ReturnType<typeof initPlayersForGame>,
  options?: StartSessionOptions,
): Partial<GameSession> {
  if (gameId === 'generic' && options?.genericWinCondition) {
    return { genericWinCondition: options.genericWinCondition };
  }
  if (gameId === 'license_plate') {
    const cooperative = options?.licensePlateCooperative ?? false;
    const includeCanada = options?.includeCanada ?? false;
    return {
      licensePlateCooperative: cooperative,
      includeCanada,
      ...(cooperative ? { sharedSpottedRegions: emptySpottedMap() } : {}),
    };
  }
  if (gameId === 'tic_tac_toe' && players[0]) {
    return {
      tttBoard: emptyTttBoard(),
      tttTurnPlayerId: players[0].id,
      tttRoundOver: false,
      tttRoundWinnerId: null,
    };
  }
  return {};
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(() =>
    localStorageAdapter.getActiveSession(),
  );
  const [endBanner, setEndBanner] = useState<EndConditionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    localStorageAdapter.getHistory(),
  );

  const persistSession = useCallback((next: GameSession | null) => {
    setSession(next);
    localStorageAdapter.saveActiveSession(next);
  }, []);

  const startSession = useCallback(
    (gameId: string, playerNames: string[], options?: StartSessionOptions) => {
      const players = initPlayersForGame(gameId, playerNames);
      const next: GameSession = {
        id: crypto.randomUUID(),
        gameId,
        players,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        roundCount: 0,
        ...initSessionFields(gameId, players, options),
      };
      persistSession(next);
      setEndBanner(null);
      return next;
    },
    [persistSession],
  );

  const resumeSession = useCallback(() => {
    const active = localStorageAdapter.getActiveSession();
    if (active?.status === 'in_progress') {
      setSession(active);
      return active;
    }
    return null;
  }, []);

  const clearActiveSession = useCallback(() => {
    persistSession(null);
    setEndBanner(null);
  }, [persistSession]);

  const updateSession = useCallback(
    (updater: (prev: GameSession) => GameSession) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        localStorageAdapter.saveActiveSession(next);
        const game = getGameDefinition(next.gameId);
        const result = evaluateEndCondition(next, game);
        if (result.triggered) {
          setEndBanner(result);
        }
        return next;
      });
    },
    [],
  );

  const completeGame = useCallback((): { entry: HistoryEntry; session: GameSession } | null => {
    if (!session) return null;
    const game = getGameDefinition(session.gameId);
    let winnerId = determineWinnerId(session, game);
    let winnerName = session.players.find((p) => p.id === winnerId)?.name ?? 'Unknown';

    if (session.gameId === 'license_plate' && session.licensePlateCooperative) {
      winnerId = undefined;
      winnerName = 'Everyone';
    }

    const completed: GameSession = {
      ...session,
      status: 'completed',
      endedAt: new Date().toISOString(),
      winnerPlayerId: winnerId,
    };
    const entry: HistoryEntry = {
      sessionId: completed.id,
      gameId: completed.gameId,
      gameName: game.name,
      playerNames: completed.players.map((p) => p.name),
      winnerName,
      finalScores: allPlayerScores(completed, game),
      completedAt: completed.endedAt!,
    };
    localStorageAdapter.appendHistory(entry);
    localStorageAdapter.saveActiveSession(null);
    setSession(null);
    setEndBanner(null);
    setHistory(localStorageAdapter.getHistory());
    return { entry, session: completed };
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      endBanner,
      dismissEndBanner: () => setEndBanner(null),
      startSession,
      resumeSession,
      clearActiveSession,
      updateSession,
      completeGame,
      history,
    }),
    [
      session,
      endBanner,
      startSession,
      resumeSession,
      clearActiveSession,
      updateSession,
      completeGame,
      history,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
