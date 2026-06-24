import { HERO_GRID_CELLS } from '@/components/landing/heroGridData'

/** Static app preview in the hero — mirrors the approved mockup. */
export function HeroMockup() {
  return (
    <div>
      <div className="landing-mockup">
        {/* App nav bar */}
        <div className="landing-mockup-nav">
          <div className="landing-mockup-tabs">
            <span className="landing-mockup-tab">Grid</span>
            <span className="landing-mockup-tab">Words</span>
            <span className="landing-mockup-tab">Clues</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, background: '#4ADE80', borderRadius: '50%' }} />
            <span style={{ color: '#4ADE80', fontSize: 11, fontWeight: 600 }}>Compliant</span>
          </div>
          <span
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.68)',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            Export
          </span>
        </div>

        {/* Stats bar */}
        <div className="landing-mockup-stats">
          <span>Words: <strong>34</strong>/78</span>
          <span>Black: <strong>17%</strong></span>
          <span>Avg: <strong>5.3</strong></span>
          <span>Fill: <strong>41%</strong></span>
        </div>

        {/* Grid + sidebar */}
        <div className="landing-mockup-body">
          <div className="landing-mockup-grid-wrap">
            <div className="landing-mockup-grid">
              {HERO_GRID_CELLS.map((cell) => (
                <div
                  key={cell.key}
                  className="landing-mockup-cell"
                  style={{ background: cell.background }}
                >
                  {cell.num && (
                    <span className="landing-mockup-cell-num" style={{ color: cell.color }}>
                      {cell.num}
                    </span>
                  )}
                  <span className="landing-mockup-cell-letter" style={{ color: cell.color }}>
                    {cell.letter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-mockup-sidebar">
            <div className="landing-mockup-sidebar-label">Fill suggestions</div>
            <div className="landing-mockup-pattern">1-Across · C?OS?W?RD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 12 }}>
              <div className="landing-mockup-suggestion top">
                <span>CROSSWORD</span>
                <span>85</span>
              </div>
              <div className="landing-mockup-suggestion">
                <span>CLOCKWORK</span>
                <span>79</span>
              </div>
              <div className="landing-mockup-suggestion">
                <span>CROSSWAYS</span>
                <span>71</span>
              </div>
              <div className="landing-mockup-suggestion dim">
                <span>BRASSWOOD</span>
                <span>48</span>
              </div>
            </div>
            <div className="landing-mockup-compliance">
              <div className="landing-mockup-sidebar-label">Compliance</div>
              <div className="landing-mockup-compliance-row">
                <span style={{ color: '#22C55E', fontSize: 10, fontWeight: 700 }}>✓</span>
                <span>Symmetry</span>
              </div>
              <div className="landing-mockup-compliance-row">
                <span style={{ color: '#22C55E', fontSize: 10, fontWeight: 700 }}>✓</span>
                <span>Interlock</span>
              </div>
              <div className="landing-mockup-compliance-row">
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700 }}>⚠</span>
                <span>Puzzle incomplete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color key */}
      <div className="landing-mockup-legend">
        <span>
          <i style={{ background: '#DCFCE7', border: '1px solid #86EFAC' }} />
          Quality ≥ 70
        </span>
        <span>
          <i style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }} />
          Quality 40–69
        </span>
        <span>
          <i style={{ background: '#fff', border: '1px solid #E5E7EB' }} />
          Unfilled
        </span>
      </div>
    </div>
  )
}
