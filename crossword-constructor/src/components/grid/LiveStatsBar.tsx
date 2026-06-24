import { usePuzzleStats } from '@/hooks/useDerivedPuzzleState'
import { help } from '@/lib/helpContent'

export function LiveStatsBar() {
  const stats = usePuzzleStats()

  return (
    <div className="app-panel flex flex-wrap gap-4 px-4 py-2 text-sm text-app-muted shadow-sm" title={help.grid.stats.fill}>
      <Stat label="Words" value={`${stats.wordCount} / ${stats.maxWordCount}`} warn={stats.wordCount >= stats.maxWordCount - 3} tip={help.grid.stats.words} />
      <Stat label="Black squares" value={`${stats.blackCount} (${stats.blackPercent.toFixed(1)}%)`} warn={stats.blackPercent > 17} tip={help.grid.stats.blackSquares} />
      <Stat label="Avg length" value={stats.avgWordLength.toFixed(1)} tip={help.grid.stats.avgLength} />
      <Stat label="3-letter" value={String(stats.threeLetterCount)} tip={help.grid.stats.threeLetter} />
      <Stat label="Fill" value={`${stats.fillPercent.toFixed(0)}%`} tip={help.grid.stats.fill} />
    </div>
  )
}

function Stat({ label, value, warn, tip }: { label: string; value: string; warn?: boolean; tip: string }) {
  return (
    <span className={warn ? 'font-medium text-yellow-700' : ''} title={tip}>
      <span className="text-app-subtle">{label}: </span>
      {value}
    </span>
  )
}
