/** Welcoming entry screen — explains the game before scenario selection. */

import heroImage from "../assets/hero.png";
const DEPARTMENTS = [
  {
    id: "safety",
    label: "Public Safety",
    hint: "Police, fire, emergency response",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "infra",
    label: "Infrastructure",
    hint: "Roads, water, transit",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 18h16v2H4v-2zm2-4l3-8h6l3 8H6zm1.5-2h9l-2-5h-5l-2 5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "education",
    label: "Education",
    hint: "Schools, libraries, workforce",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13.5L5 12v4.5c0 2.2 3.1 4 7 4s7-1.8 7-4V12l-7 4.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "parks",
    label: "Parks & Recreation",
    hint: "Green space, programs, quality of life",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2c-1 3-3 5-3 7a3 3 0 006 0c0-2-2-4-3-7zm-6 9c-2 0-3 1.5-3 3.5S4 18 6 18h12c2 0 3-1.5 3-3.5S19 11 17 11H6z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "community",
    label: "Community Services",
    hint: "Housing, health, social programs",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4v1.5h6v-2c0-2.7-5.3-4-8-4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
] as const;

const STEPS = [
  {
    num: "1",
    title: "Set the budget",
    body: "Allocate spending across departments, adjust taxes, and choose capital projects each fiscal year.",
  },
  {
    num: "2",
    title: "Navigate events",
    body: "Recessions, disasters, and political pressure test your choices. Advisors and citizens react in real time.",
  },
  {
    num: "3",
    title: "Win re-election",
    body: "Balance the books, keep services strong, and maintain coalition approval through a full mayoral term.",
  },
] as const;

export function LandingPage({
  hasSavedGame,
  savedCityName,
  savedYear,
  onContinue,
  onStartNew,
}: {
  hasSavedGame: boolean;
  savedCityName?: string;
  savedYear?: number;
  onContinue: () => void;
  onStartNew: () => void;
}) {
  return (
    <div className="landing">
      <div className="landing-sky" aria-hidden="true">
        <div className="landing-cloud landing-cloud-a" />
        <div className="landing-cloud landing-cloud-b" />
        <div className="landing-hill" />
      </div>

      <header className="landing-masthead">
        <a className="portal-link landing-portal" href="/">
          ← Dallas civic data portal
        </a>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-capital-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path
                d="M24 4L8 14v4h4v18h24V18h4v-4L24 4zm-2 28h-4v-8h4v8zm8 0h-4v-8h4v8zm8 0h-4v-8h4v8z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="landing-title">City Budget Simulator</h1>
          <p className="landing-tagline-ribbon">
            <span>★ Balance today. Build tomorrow. Get re-elected! ★</span>
          </p>
          <p className="landing-lede">
            You are the mayor. Every dollar is a trade-off — fund police or parks,
            borrow for a library or hold the line on taxes. Lead your city through
            up to 30 fiscal years of civic drama.
          </p>
          <div className="landing-cta-row">
            {hasSavedGame && (
              <button
                type="button"
                className="btn-primary btn-lg landing-cta-primary"
                onClick={onContinue}
              >
                Continue your term
                {savedCityName && savedYear != null && (
                  <span className="landing-cta-sub">
                    {savedCityName} · FY{savedYear}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              className={
                hasSavedGame
                  ? "btn btn-lg landing-cta-secondary"
                  : "btn-primary btn-lg landing-cta-primary"
              }
              onClick={onStartNew}
            >
              {hasSavedGame ? "Start a new city" : "Play your first term"}
            </button>
          </div>
          <p className="landing-desk-motto">Lead. Decide. Make an impact.</p>
        </div>

        <div className="landing-hero-art">
          <img
            src={heroImage}
            alt="Mayor at city hall desk with advisors and citizens"
            className="landing-hero-image"
            width={640}
            height={480}
          />
        </div>
      </section>

      <section className="landing-section panel landing-panel">
        <h2>How a term works</h2>
        <div className="landing-steps">
          {STEPS.map((step) => (
            <article key={step.num} className="landing-step-card">
              <span className="landing-step-num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section panel landing-panel">
        <h2>Departments you control</h2>
        <p className="landing-section-lede">
          Slide budgets, watch approval shift, and see your skyline change as
          infrastructure and safety improve — or decline.
        </p>
        <ul className="landing-dept-grid">
          {DEPARTMENTS.map((dept) => (
            <li key={dept.id} className="landing-dept-card">
              <span className="landing-dept-icon">{dept.icon}</span>
              <div>
                <strong>{dept.label}</strong>
                <span>{dept.hint}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section landing-tips panel landing-panel">
        <h2>Stay in office</h2>
        <div className="landing-tips-grid">
          <div className="landing-tip landing-tip-good">
            <span className="landing-tip-emoji" aria-hidden="true">
              ☺
            </span>
            <div>
              <strong>Citizens approve</strong>
              <p>
                Strong services, balanced budgets, and visible wins keep
                coalitions on your side.
              </p>
            </div>
          </div>
          <div className="landing-tip landing-tip-warn">
            <span className="landing-tip-emoji" aria-hidden="true">
              ★
            </span>
            <div>
              <strong>Re-election checklist</strong>
              <p>
                Track approval by faction, manage your campaign staff, and heed
                advisor briefings before each budget vote.
              </p>
            </div>
          </div>
          <div className="landing-tip landing-tip-bad">
            <span className="landing-tip-emoji" aria-hidden="true">
              ☹
            </span>
            <div>
              <strong>Game over triggers</strong>
              <p>
                Junk credit, empty coffers, pension crises, or collapsing approval
                can end your term early.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Built for civic learning — inspired by real municipal budget trade-offs.
          Toggle <strong>Policy Explainer</strong> in-game for real-world parallels.
        </p>
      </footer>
    </div>
  );
}
