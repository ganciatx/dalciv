import { usePuzzleStore } from '@/stores/puzzleStore'
import { BlackSquarePalette } from '@/components/grid/BlackSquarePalette'
import { help } from '@/lib/helpContent'
import type { GridSize } from '@/types'

export function GridToolbar() {
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const symmetryEnabled = usePuzzleStore((s) => s.symmetryEnabled)
  const rebusMode = usePuzzleStore((s) => s.rebusMode)
  const zoom = usePuzzleStore((s) => s.zoom)
  const setSymmetryEnabled = usePuzzleStore((s) => s.setSymmetryEnabled)
  const setRebusMode = usePuzzleStore((s) => s.setRebusMode)
  const setZoom = usePuzzleStore((s) => s.setZoom)
  const showAssist = usePuzzleStore((s) => s.showAssist)
  const setShowAssist = usePuzzleStore((s) => s.setShowAssist)
  const clearGrid = usePuzzleStore((s) => s.clearGrid)
  const resetGrid = usePuzzleStore((s) => s.resetGrid)
  const resizeGrid = usePuzzleStore((s) => s.resizeGrid)

  function confirmAction(msg: string, action: () => void) {
    if (window.confirm(msg)) action()
  }

  return (
    <div className="app-panel flex flex-wrap items-center gap-2 px-3 py-2">
      <label className="flex items-center gap-1 text-sm text-app-muted" title={help.grid.toolbar.size}>
        Size
        <select
          className="rounded border border-app-border px-2 py-1 text-sm"
          title={help.grid.toolbar.size}
          value={puzzle.size}
          onChange={(e) => {
            const size = Number(e.target.value) as GridSize
            confirmAction(`Change grid to ${size}×${size}? This clears the grid.`, () => resizeGrid(size))
          }}
        >
          <option value={15}>15×15</option>
          <option value={21}>21×21</option>
        </select>
      </label>

      <button
        type="button"
        className={`rounded px-2 py-1 text-sm ${symmetryEnabled ? 'bg-app-tint text-app-accent' : 'bg-yellow-100 text-yellow-800'}`}
        title={help.grid.toolbar.symmetry}
        onClick={() => setSymmetryEnabled(!symmetryEnabled)}
      >
        Symmetry {symmetryEnabled ? 'On' : 'Off'}
      </button>

      <button
        type="button"
        className={`rounded px-2 py-1 text-sm ${rebusMode ? 'bg-purple-100 text-purple-800' : 'bg-app-warm'}`}
        title={help.grid.toolbar.rebus}
        onClick={() => setRebusMode(!rebusMode)}
      >
        Rebus {rebusMode ? 'On' : 'Off'}
      </button>

      <button
        type="button"
        className="rounded bg-app-warm px-2 py-1 text-sm hover:bg-app-border"
        title={help.grid.toolbar.clearLetters}
        onClick={() => confirmAction('Clear all letters?', clearGrid)}
      >
        Clear Letters
      </button>

      <button
        type="button"
        className="rounded bg-app-warm px-2 py-1 text-sm hover:bg-app-border"
        title={help.grid.toolbar.resetGrid}
        onClick={() => confirmAction('Reset entire grid?', resetGrid)}
      >
        Reset Grid
      </button>

      <BlackSquarePalette />

      <button
        type="button"
        className={`rounded px-2 py-1 text-sm ${showAssist ? 'bg-app-tint text-app-accent' : 'bg-app-warm'}`}
        onClick={() => setShowAssist(!showAssist)}
        title={help.grid.toolbar.assist}
      >
        Assist {showAssist ? 'On' : 'Off'}
      </button>

      <div className="flex items-center gap-1 text-sm text-app-muted" title={help.grid.toolbar.zoom}>
        Zoom
        {[75, 100, 125, 150].map((z) => (
          <button
            key={z}
            type="button"
            title={`${help.grid.toolbar.zoom} (${z}%)`}
            className={`rounded px-2 py-1 ${zoom === z ? 'bg-app-accent text-white' : 'bg-app-warm'}`}
            onClick={() => setZoom(z)}
          >
            {z}%
          </button>
        ))}
      </div>
    </div>
  )
}
