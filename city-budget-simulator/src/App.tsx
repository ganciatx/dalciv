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
import { LandingPage } from "./components/LandingPage";
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
  const showLandingPage = useGameStore((s) => s.showLandingPage);
  const hasSavedGame = useGameStore((s) => s.hasSavedGame);
  const showScenarioPicker = useGameStore((s) => s.showScenarioPicker);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const lastUnlockedAchievements = useGameStore((s) => s.lastUnlockedAchievements);
  const initNewGame = useGameStore((s) => s.initNewGame);
  const loadSaved = useGameStore((s) => s.loadSaved);
  const continueSavedGame = useGameStore((s) => s.continueSavedGame);
  const startNewGameFlow = useGameStore((s) => s.startNewGameFlow);
  const openLandingPage = useGameStore((s) => s.openLandingPage);
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
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ended = game.phase === "ended";

  if (showLandingPage) {
    return (
      <div className="app-shell app-shell-landing">
        <LandingPage
          hasSavedGame={hasSavedGame}
          savedCityName={hasSavedGame ? game.city.name : undefined}
          savedYear={hasSavedGame ? game.year : undefined}
          onContinue={continueSavedGame}
          onStartNew={startNewGameFlow}
        />
      </div>
    );
  }

  if (showScenarioPicker) {
    return (
      <div className="app-shell">
        <ScenarioPicker
          onStart={initNewGame}
          unlockedAchievements={unlockedAchievements}
          onBack={hasSavedGame ? openLandingPage : undefined}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-lockup">
            <span className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path
                  d="M12 2L4 7v2h2v11h12V9h2V7l-8-5zm-1 16H9v-6h2v6zm4 0h-2v-6h2v6z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <div>
              <h1>City Budget Simulator</h1>
              <p className="brand-tagline">Balance today. Build tomorrow.</p>
            </div>
          </div>
          <p className="brand-meta">
            {game.city.name} · {game.city.population.toLocaleString()} residents ·{" "}
            {scenarioTitle(game.city.scenarioId)} · {game.settings.difficulty}
          </p>
          <ChallengeLegend challengeId={game.settings.challengeId} />
          <div className="brand-links">
            <button type="button" className="link-btn" onClick={openLandingPage}>
              About the game
            </button>
            <a className="portal-link" href="/">
              ← Civic data portal
            </a>
          </div>
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
          <p className="end-screen-reason">
            {game.endReason ? END_LABELS[game.endReason] : "Campaign ended."}
          </p>
          <p className="headline-bar end-headline">
            {game.lastHeadline}
          </p>
          <FinalScorecard game={game} />
          <AchievementsPanel
            unlocked={unlockedAchievements}
            newlyUnlocked={lastUnlockedAchievements}
          />
          <div className="end-screen-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowScenarioPicker(true)}
            >
              Play again
            </button>
            <button type="button" className="btn" onClick={openLandingPage}>
              Back to home
            </button>
          </div>
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
