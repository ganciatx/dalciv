import { useState } from 'react'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { useValidationIssues } from '@/hooks/useDerivedPuzzleState'
import {
  downloadBlob,
  exportJson,
  exportNytText,
  exportWsjText,
  exportPuz,
  exportPdf,
} from '@/lib/export'
import { help } from '@/lib/helpContent'
import type { ExportFormat } from '@/types'

const FORMATS: ExportFormat[] = [
  { id: 'puz', label: 'Across Lite (.puz)', targets: ['NYT', 'WSJ'] },
  { id: 'nyt-text', label: 'NYT Plain Text', targets: ['NYT'] },
  { id: 'wsj-text', label: 'WSJ Plain Text', targets: ['WSJ'] },
  { id: 'pdf', label: 'PDF (solve view)', targets: ['NYT', 'WSJ'] },
  { id: 'json', label: 'JSON (backup)', targets: ['NYT', 'WSJ'] },
]

export function ExportModal() {
  const show = usePuzzleStore((s) => s.showExport)
  const setShow = usePuzzleStore((s) => s.setShowExport)
  const puzzle = usePuzzleStore((s) => s.puzzle)
  const issues = useValidationIssues()
  const [format, setFormat] = useState<ExportFormat['id']>('puz')
  const [ackWarnings, setAckWarnings] = useState(false)

  if (!show) return null

  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const canExport = errors.length === 0 && (warnings.length === 0 || ackWarnings)
  const availableFormats = FORMATS.filter((f) => f.targets.includes(puzzle.target))

  async function handleExport() {
    const base = puzzle.title.replace(/[^a-z0-9]/gi, '_') || 'puzzle'
    switch (format) {
      case 'json':
        downloadBlob(exportJson(puzzle), `${base}.json`, 'application/json')
        break
      case 'nyt-text':
        downloadBlob(exportNytText(puzzle), `${base}_nyt.txt`, 'text/plain')
        break
      case 'wsj-text':
        downloadBlob(exportWsjText(puzzle), `${base}_wsj.txt`, 'text/plain')
        break
      case 'puz': {
        const bytes = await exportPuz(puzzle)
        downloadBlob(new Uint8Array(bytes), `${base}.puz`, 'application/octet-stream')
        break
      }
      case 'pdf': {
        const blob = await exportPdf(puzzle)
        downloadBlob(blob, `${base}.pdf`, 'application/pdf')
        break
      }
    }
    setShow(false)
  }

  return (
    <div className="app-modal-backdrop">
      <div className="app-modal max-w-md">
        <h2 className="app-modal-title">Export Puzzle</h2>

        <div className="mb-4 space-y-2 text-sm">
          <h3 className="app-heading">Pre-export checklist</h3>
          {errors.length > 0 && (
            <p className="text-red-600">{errors.length} error(s) must be resolved before export.</p>
          )}
          {warnings.length > 0 && (
            <label className="flex items-center gap-2 text-yellow-700" title={help.export.ackWarnings}>
              <input type="checkbox" checked={ackWarnings} title={help.export.ackWarnings} onChange={(e) => setAckWarnings(e.target.checked)} />
              Acknowledge {warnings.length} warning(s)
            </label>
          )}
          {errors.length === 0 && warnings.length === 0 && (
            <p className="text-app-green">All checks passed.</p>
          )}
        </div>

        <label className="mb-4 block text-sm app-label" title={help.export.format}>
          Format
          <select
            className="app-select mt-1 w-full"
            title={help.export.format}
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat['id'])}
          >
            {availableFormats.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="app-btn-ghost px-4 py-2" title={help.export.cancel} onClick={() => setShow(false)}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canExport}
            className="app-btn-primary disabled:opacity-40"
            title={help.export.download}
            onClick={handleExport}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
