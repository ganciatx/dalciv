import { usePuzzleStore } from '@/stores/puzzleStore'
import { GridCanvas } from './GridCanvas'
import { GridToolbar } from './GridToolbar'
import { AnswerPalette } from './AnswerPalette'
import { WordEntryPanel } from './WordEntryPanel'
import { AssistPanel } from './AssistPanel'
import { CompliancePanel } from './CompliancePanel'
import { LiveStatsBar } from './LiveStatsBar'

export function GridWorkspace() {
  const zoom = usePuzzleStore((s) => s.zoom)
  const size = usePuzzleStore((s) => s.puzzle.size)
  const baseCell = size === 15 ? 32 : 24
  const cellSize = Math.round(baseCell * (zoom / 100))

  return (
    <div className="app-workspace flex gap-4 p-4">
      <AnswerPalette />
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-auto">
        <GridToolbar />
        <div className="app-grid-canvas-wrap">
          <GridCanvas cellSize={cellSize} />
        </div>
        <LiveStatsBar />
      </div>
      <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto">
        <AssistPanel />
        <WordEntryPanel />
        <div className="app-panel-pad">
          <h3 className="app-heading mb-2">Compliance</h3>
          <CompliancePanel />
        </div>
      </aside>
    </div>
  )
}
