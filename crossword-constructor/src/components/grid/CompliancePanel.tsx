import { usePuzzleStore } from '@/stores/puzzleStore'
import { useValidationIssues } from '@/hooks/useDerivedPuzzleState'
import { help } from '@/lib/helpContent'
import type { ValidationIssue, ValidationLevel } from '@/types'

const levelStyles: Record<ValidationLevel, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-[#bfdbfe] bg-app-tint text-app-accent',
}

const levelBadge: Record<ValidationLevel, string> = {
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-app-accent text-white',
}

export function CompliancePanel() {
  const issues = useValidationIssues()
  const navigateToIssue = usePuzzleStore((s) => s.navigateToIssue)

  const grouped: Record<ValidationLevel, ValidationIssue[]> = {
    error: [],
    warning: [],
    info: [],
  }
  for (const issue of issues) grouped[issue.level].push(issue)

  if (!issues.length) {
    return (
      <div className="rounded-lg border border-green-200 bg-[#dcfce7] p-4 text-sm text-app-green">
        No compliance issues detected.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {(['error', 'warning', 'info'] as ValidationLevel[]).map((level) =>
        grouped[level].length > 0 && (
          <div key={level}>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-app-subtle">
              {level}s ({grouped[level].length})
            </h4>
            <ul className="space-y-1">
              {grouped[level].map((issue, i) => (
                <li key={`${issue.id}-${i}`}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-2 rounded border px-2 py-1.5 text-left text-sm ${levelStyles[level]}`}
                    title={help.grid.compliance.issue}
                    onClick={() => navigateToIssue(issue)}
                  >
                    <span className={`mt-0.5 shrink-0 rounded px-1 text-[10px] font-bold uppercase ${levelBadge[level]}`}>
                      {level[0]}
                    </span>
                    <span>{issue.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}
