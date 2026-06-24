import { usePuzzleStore } from '@/stores/puzzleStore'
import { useBlackSquareDrag } from '@/hooks/useBlackSquareDrag'
import { help } from '@/lib/helpContent'

/** Draggable black-square token — drag onto the grid to paint symmetric pairs. */
export function BlackSquarePalette() {
  const symmetryEnabled = usePuzzleStore((s) => s.symmetryEnabled)
  const { onPaletteDragStart, onPaletteDragEnd } = useBlackSquareDrag()

  return (
    <div className="flex items-center gap-2 border-l border-app-border pl-3">
      <div
        draggable
        role="button"
        aria-label="Drag black square onto grid"
        title={help.grid.blackSquare}
        className="grid-cell black h-8 w-8 cursor-grab active:cursor-grabbing shadow-md ring-2 ring-app-border transition-shadow hover:ring-app-accent"
        onDragStart={onPaletteDragStart}
        onDragEnd={onPaletteDragEnd}
      />
      <span className="max-w-[9rem] text-xs leading-tight text-app-subtle">
        Drag black square
        {symmetryEnabled ? ' (auto-symmetric)' : ''}
      </span>
    </div>
  )
}
