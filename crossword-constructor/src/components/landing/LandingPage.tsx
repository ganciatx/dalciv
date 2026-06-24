import { useCallback, useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { loadAutosave } from '@/lib/persistence'
import { help } from '@/lib/helpContent'
import type { GridSize, PublicationTarget } from '@/types'
import { LandingLogo } from '@/components/landing/LandingLogo'
import { HeroMockup } from '@/components/landing/HeroMockup'
import { FaqSection } from '@/components/landing/FaqSection'
import { StartBuildingModal } from '@/components/landing/StartBuildingModal'
import {
  FEATURES,
  HOW_IT_WORKS,
  PUBLICATION_ROWS,
} from '@/components/landing/landingData'
import './landing.css'

/** Full marketing landing page — layout and copy from approved HTML mockup. */
export function LandingPage() {
  const newPuzzle = usePuzzleStore((s) => s.newPuzzle)
  const setPuzzle = usePuzzleStore((s) => s.setPuzzle)
  const [modalOpen, setModalOpen] = useState(false)

  const autosave = loadAutosave()

  const openModal = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])

  function handleNew(size: GridSize, target: PublicationTarget) {
    newPuzzle(size, target)
  }

  function handleRestore() {
    const saved = loadAutosave()
    if (saved) setPuzzle(saved)
  }

  function scrollToHow() {
    document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing min-h-screen">
      {/* Sticky nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <button type="button" className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LandingLogo />
          </button>
          <button type="button" className="landing-btn-primary" onClick={openModal}>
            Start building
          </button>
        </div>
      </nav>

      {/* Autosave restore — preserved from prior home screen */}
      {autosave && (
        <div className="landing-autosave">
          <div className="landing-autosave-inner">
            <span>
              Unsaved session: <strong>{autosave.title}</strong>
              {' '}(modified {new Date(autosave.updatedAt).toLocaleString()})
            </span>
            <button
              type="button"
              className="landing-btn-primary"
              title={help.home.restoreSession}
              onClick={handleRestore}
            >
              Restore session
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div>
            <div className="landing-eyebrow">For crossword constructors</div>
            <h1 className="landing-hero-title">
              Build crosswords
              <br />
              <em>ready to submit.</em>
            </h1>
            <p className="landing-hero-lead">
              Live NYT and WSJ compliance checks, scored fill suggestions, and export to{' '}
              <span className="landing-code">.puz</span> — free, in your browser, no account required.
            </p>
            <div className="landing-hero-cta">
              <button type="button" className="landing-btn-primary landing-btn-primary-lg" onClick={openModal}>
                Start building →
              </button>
              <button type="button" className="landing-btn-ghost" onClick={scrollToHow}>
                How it works ↓
              </button>
            </div>
            <div className="landing-checks">
              <span className="landing-check">
                <span className="landing-check-mark">✓</span> Free
              </span>
              <span className="landing-check">
                <span className="landing-check-mark">✓</span> No account
              </span>
              <span className="landing-check">
                <span className="landing-check-mark">✓</span> Your data stays local
              </span>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing-how">
        <div className="landing-container">
          <div style={{ marginBottom: 60 }}>
            <h2 className="landing-h2">How it works</h2>
            <p className="landing-section-lead">Grid → Fill → Clues → Export. One workflow, one tool.</p>
          </div>
          <div className="landing-how-grid">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}>
                <div className="landing-step-num">{step.step}</div>
                <h3 className="landing-h3">{step.title}</h3>
                <p className="landing-body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features">
        <div className="landing-container">
          <div style={{ marginBottom: 64 }}>
            <h2 className="landing-h2">Everything a constructor needs.</h2>
            <p className="landing-section-lead" style={{ maxWidth: 520 }}>
              Not a toy grid — a focused authoring environment built for people who care about the craft.
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((feature) => (
              <div
                key={feature.step}
                className={`landing-feature-card ${feature.accent ? 'accent' : 'muted'}`}
              >
                <div className="landing-step-num landing-step-num-sm">{feature.step}</div>
                <h3 className="landing-h3">{feature.title}</h3>
                <p className="landing-body">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications */}
      <section id="publications" className="landing-pubs">
        <div className="landing-container">
          <div className="landing-pubs-grid">
            <div>
              <h2 className="landing-h2 landing-h2-sm" style={{ marginBottom: 18, lineHeight: 1.15 }}>
                Built for NYT and WSJ submission.
              </h2>
              <p className="landing-section-lead" style={{ marginBottom: 24 }}>
                Choose your target publication at the start. Export formats, compliance rules, and in-app guidance all adapt to match.
              </p>
              <p className="landing-disclaimer">
                Crossword Constructor is not affiliated with, endorsed by, or published by The New York Times or The Wall Street Journal. Publication standards cited are commonly referenced submission guidelines.
              </p>
            </div>
            <div className="landing-pubs-table">
              <div className="landing-pubs-table-header">
                <div />
                <div>NYT</div>
                <div>WSJ</div>
              </div>
              {PUBLICATION_ROWS.map((row) => (
                <div key={row.label} className={`landing-pubs-row${row.alt ? ' alt' : ''}`}>
                  <div>{row.label}</div>
                  <div>{row.nyt}</div>
                  <div className={'wsjHighlight' in row && row.wsjHighlight ? 'highlight' : undefined}>{row.wsj}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqSection />

      {/* Footer CTA */}
      <section className="landing-footer-cta">
        <div className="landing-footer-cta-inner">
          <h2>
            Start your first
            <br />
            <em>puzzle.</em>
          </h2>
          <p>Free. No account. Right now, in your browser.</p>
          <button type="button" className="landing-btn-white" onClick={openModal}>
            Start building →
          </button>
        </div>
      </section>

      {/* Site footer */}
      <footer className="landing-site-footer">
        <div className="landing-site-footer-inner">
          <div className="landing-logo" style={{ cursor: 'default' }}>
            <LandingLogo size="sm" />
          </div>
          <p>
            Not affiliated with or endorsed by The New York Times or The Wall Street Journal. All brand names are trademarks of their respective owners.
          </p>
        </div>
      </footer>

      <StartBuildingModal open={modalOpen} onClose={closeModal} onNewPuzzle={handleNew} />
    </div>
  )
}
