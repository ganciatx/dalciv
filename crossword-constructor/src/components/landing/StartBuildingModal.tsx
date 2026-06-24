import { useEffect, useRef } from 'react'
import { PuzzleLibrary } from '@/components/PuzzleLibrary'
import { help } from '@/lib/helpContent'
import type { GridSize, PublicationTarget } from '@/types'

interface StartBuildingModalProps {
  open: boolean
  onClose: () => void
  onNewPuzzle: (size: GridSize, target: PublicationTarget) => void
}

const PUZZLE_OPTIONS: { size: GridSize; target: PublicationTarget; label: string; hint: string }[] = [
  { size: 15, target: 'NYT', label: '15×15 — NYT', hint: help.home.new15Nyt },
  { size: 21, target: 'NYT', label: '21×21 — NYT', hint: help.home.new21Nyt },
  { size: 15, target: 'WSJ', label: '15×15 — WSJ', hint: help.home.new15Wsj },
  { size: 21, target: 'WSJ', label: '21×21 — WSJ', hint: help.home.new21Wsj },
]

/** Modal for choosing publication target — triggered by all "Start building" CTAs. */
export function StartBuildingModal({ open, onClose, onNewPuzzle }: StartBuildingModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSelect(size: GridSize, target: PublicationTarget) {
    onNewPuzzle(size, target)
    onClose()
  }

  return (
    <div
      className="landing-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="landing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-building-title"
      >
        <div className="landing-modal-header">
          <h2 id="start-building-title">Start building</h2>
          <button type="button" className="landing-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="landing-modal-body">
          <p className="landing-body" style={{ marginBottom: 16 }}>
            Pick your target publication and grid size. Compliance rules and export formats adapt automatically.
          </p>
          <div className="landing-modal-grid">
            {PUZZLE_OPTIONS.map((opt) => (
              <button
                key={`${opt.size}-${opt.target}`}
                type="button"
                className="landing-modal-option"
                title={opt.hint}
                onClick={() => handleSelect(opt.size, opt.target)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.target} submission standards</span>
              </button>
            ))}
          </div>
          <div className="landing-modal-library">
            <h3>Your puzzles</h3>
            <PuzzleLibrary />
          </div>
        </div>
      </div>
    </div>
  )
}
