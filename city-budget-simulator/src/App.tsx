import { useEffect } from "react";
import {
  AchievementsPanel,
  ChallengeLegend,
} from "./components/AchievementsPanel";
import { BudgetEditor } from "./components/BudgetEditor";
import { Dashboard } from "./components/Dashboard";
import { DevelopmentPanel } from "./components/DevelopmentPanel";
import { DistrictsPanel } from "./components/DistrictsPanel";
import { EventTimeline } from "./components/EventTimeline";
import { FinalScorecard } from "./components/FinalScorecard";
import { HistoryCharts } from "./components/HistoryCharts";
import { PoliticalPanel } from "./components/PoliticalPanel";
import { StaffPanel } from "./components/StaffPanel";
import { PolicyExplainer } from "./components/PolicyExplainer";
import { ScenarioPicker } from "./components/ScenarioPicker";
import { YearSummaryModal } from "./components/YearSummaryModal";
import { ACHIEVEMENTS } from "./simulation/achievements";
import { SCENARIOS, useGameStore } from "./store/gameStore";

const END_LABELS: Record<string, string> = {
  fiscal_crisis: "Fiscal crisis — cash insolvency and junk credit.",
  election_loss: "Lost re-election — coalition approval collapsed.",
  state_takeover: "State oversight — pension and deficit thresholds breached.",
  liquidity_trap: "Bond markets closed — junk rating and empty coffers.",
  completed: "Term complete — see your stewardship scorecard.",
};

function scenarioTitle(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.title ?? id;
}

export default function App() {
  const game = useGameStore((s) => s.game);
  const draft = useGameStore((s) => s.draft);
  const view = useGameStore((s) => s.view);
  const showScenarioPicker = useGameStore((s) => s.showScenarioPicker);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const lastUnlockedAchievements = useGameStore((s) => s.lastUnlockedAchievements);
  const initNewGame = useGameStore((s) => s.initNewGame);
  const loadSaved = useGameStore((s) => s.loadSaved);
  const setView = useGameStore((s) => s.setView);
  const setShowScenarioPicker = useGameStore((s) => s.setShowScenarioPicker);
  const togglePolicyExplainer = useGameStore((s) => s.togglePolicyExplainer);
  const patchDraft = useGameStore((s) => s.patchDraft);
  const patchDraftExpenditure = useGameStore((s) => s.patchDraftExpenditure);
  const advanceYear = useGameStore((s) => s.advanceYear);
  const resetGame = useGameStore((s) => s.resetGame);
  const yearSummary = useGameStore((s) => s.yearSummary);
  const dismissYearSummary = useGameStore((s) => s.dismissYearSummary);

  useEffect(() => {
    if (!loadSaved()) setShowScenarioPicker(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ended = game.phase === "ended";

  if (showScenarioPicker) {
    return (
      <div className="app-shell">
        <ScenarioPicker
          onStart={initNewGame}
          unlockedAchievements={unlockedAchievements}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1>City Budget Simulator</h1>
          <p>
            {game.city.name} · {game.city.population.toLocaleString()} residents ·{" "}
            {scenarioTitle(game.city.scenarioId)} · {game.settings.difficulty}
          </p>
          <ChallengeLegend challengeId={game.settings.challengeId} />
          <a className="portal-link" href="/">
            ← Dallas civic data portal
          </a>
        </div>
        <nav className="nav-tabs" aria-label="Views">
          {(
            [
              ["dashboard", "Dashboard"],
              ["budget", "Budget"],
              ["development", "Development"],
              ["districts", "Districts"],
              ["timeline", "Timeline"],
              ["history", "History"],
              ["politics", "Politics"],
              ["staff", "Staff"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
              disabled={
                ended &&
                (id === "budget" ||
                  id === "development" ||
                  id === "districts" ||
                  id === "staff")
              }
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className={`btn ${game.settings.policyExplainer ? "active-toggle" : ""}`}
            onClick={togglePolicyExplainer}
            title="Show real-world policy parallels"
          >
            Explainer {game.settings.policyExplainer ? "on" : "off"}
          </button>
          {!ended && (
            <button type="button" className="btn-primary" onClick={advanceYear}>
              Adopt budget &amp; advance to FY{game.year + 1}
            </button>
          )}
          <button type="button" className="btn" onClick={resetGame}>
            New game
          </button>
        </div>
      </header>

      {lastUnlockedAchievements.length > 0 &&
        !ended &&
        !yearSummary && (
          <div className="achievement-toast">
            Achievement unlocked:{" "}
            {lastUnlockedAchievements
              .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id)
              .join(" · ")}
          </div>
        )}

      {yearSummary && (
        <YearSummaryModal summary={yearSummary} onDismiss={dismissYearSummary} />
      )}

      {ended ? (
        <div className="end-screen">
          <h2>Game over</h2>
          <p style={{ color: "var(--ink-muted)" }}>
            {game.endReason ? END_LABELS[game.endReason] : "Campaign ended."}
          </p>
          <p className="headline-bar" style={{ maxWidth: 560, margin: "24px auto" }}>
            {game.lastHeadline}
          </p>
          <FinalScorecard game={game} />
          <AchievementsPanel
            unlocked={unlockedAchievements}
            newlyUnlocked={lastUnlockedAchievements}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowScenarioPicker(true)}
          >
            Play again
          </button>
        </div>
      ) : (
        <>
          {view === "dashboard" && <Dashboard game={game} />}
          {view === "budget" && (
            <>
              <BudgetEditor
                game={game}
                draft={draft}
                onPatch={patchDraft}
                onPatchExpenditure={patchDraftExpenditure}
              />
              <PolicyExplainer game={game} draft={draft} />
            </>
          )}
          {view === "development" && (
            <DevelopmentPanel
              game={game}
              draft={draft}
              onPatch={patchDraft}
              onPatchExpenditure={patchDraftExpenditure}
            />
          )}
          {view === "districts" && (
            <DistrictsPanel
              game={game}
              draftPriority={draft.districtPriority}
              onPriorityChange={(p) => patchDraft({ districtPriority: p })}
            />
          )}
          {view === "timeline" && <EventTimeline game={game} />}
          {view === "history" && <HistoryCharts game={game} />}
          {view === "politics" && <PoliticalPanel game={game} />}
          {view === "staff" && (
            <StaffPanel game={game} draft={draft} onPatch={patchDraft} />
          )}
        </>
      )}
    </div>
  );
}
