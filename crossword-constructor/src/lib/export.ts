import type { Puzzle, WordSlot } from '@/types'
import { extractAllSlots } from './grid'

export function exportJson(puzzle: Puzzle): string {
  return JSON.stringify(puzzle, null, 2)
}

export function importJson(text: string): Puzzle {
  const parsed = JSON.parse(text) as Puzzle
  if (!parsed.grid || !parsed.clues) throw new Error('Invalid puzzle JSON')
  return parsed
}

export function exportNytText(puzzle: Puzzle): string {
  const slots = extractAllSlots(puzzle.grid)
  const across = slots.filter((s) => s.direction === 'across' && !s.word.includes('?'))
  const down = slots.filter((s) => s.direction === 'down' && !s.word.includes('?'))

  const gridLines = puzzle.grid.map((row) =>
    row.map((cell) => (cell.isBlack ? '#' : cell.letter ?? '.')).join(''),
  )

  let out = `${puzzle.title}\n\n`
  out += gridLines.join('\n') + '\n\n'
  out += 'ACROSS\n'
  for (const s of across) {
    out += `${s.number}. ${puzzle.clues.across[s.number] ?? ''} (${s.word})\n`
  }
  out += '\nDOWN\n'
  for (const s of down) {
    out += `${s.number}. ${puzzle.clues.down[s.number] ?? ''} (${s.word})\n`
  }
  return out
}

export function exportWsjText(puzzle: Puzzle): string {
  const slots = extractAllSlots(puzzle.grid)
  const across = slots.filter((s) => s.direction === 'across' && !s.word.includes('?'))
  const down = slots.filter((s) => s.direction === 'down' && !s.word.includes('?'))

  let out = ''
  if (puzzle.title) out += `${puzzle.title}\n\n`

  for (const row of puzzle.grid) {
    out += row.map((cell) => (cell.isBlack ? ' ' : cell.letter ?? ' ')).join('') + '\n'
  }

  out += '\n'
  for (const s of across) {
    out += `\t${s.number}\t${puzzle.clues.across[s.number] ?? ''}\t${s.word}\n`
  }
  for (const s of down) {
    out += `\t${s.number}\t${puzzle.clues.down[s.number] ?? ''}\t${s.word}\n`
  }
  return out
}

export async function exportPuz(puzzle: Puzzle): Promise<Uint8Array> {
  const { PuzCrossword } = await import('@confuzzle/puz-crossword')
  const size = puzzle.size
  const solution = puzzle.grid
    .flat()
    .map((c) => (c.isBlack ? '.' : (c.letter ?? '-').toLowerCase()))
    .join('')

  const grid = puzzle.grid.flat().map((c) => (c.isBlack ? '.' : '-')).join('')

  const slots = extractAllSlots(puzzle.grid)
  const acrossSlots = slots.filter((s) => s.direction === 'across')
  const downSlots = slots.filter((s) => s.direction === 'down')

  const cw = new PuzCrossword({
    width: size,
    height: size,
    title: puzzle.title.slice(0, 256),
    solution,
    grid,
    clues: buildClueStrings(puzzle, acrossSlots, downSlots),
  })

  return cw.toBytes()
}

function buildClueStrings(
  puzzle: Puzzle,
  across: WordSlot[],
  down: WordSlot[],
): { across: string[]; down: string[] } {
  return {
    across: across.map((s) => puzzle.clues.across[s.number] ?? ''),
    down: down.map((s) => puzzle.clues.down[s.number] ?? ''),
  }
}

export async function importPuz(buffer: ArrayBuffer): Promise<Puzzle> {
  const { PuzCrossword } = await import('@confuzzle/puz-crossword')
  const cw = PuzCrossword.from(new Uint8Array(buffer))
  const size = cw.width as 15 | 21
  const solution = cw.solution ?? ''
  const grid: Puzzle['grid'] = []

  for (let row = 0; row < size; row++) {
    const rowCells = []
    for (let col = 0; col < size; col++) {
      const idx = row * size + col
      const ch = solution[idx] ?? '.'
      const isBlack = ch === '.'
      rowCells.push({
        isBlack,
        letter: isBlack ? null : ch.toUpperCase(),
        isRebus: false,
        rebusValue: null,
        number: null,
      })
    }
    grid.push(rowCells)
  }

  const { recalculateNumbers } = await import('./grid')
  const numbered = recalculateNumbers(grid)

  const now = new Date().toISOString()
  const clues = { across: {} as Record<number, string>, down: {} as Record<number, string> }
  const slots = extractAllSlots(numbered)

  const acrossClues = cw.clues?.across ?? []
  const downClues = cw.clues?.down ?? []
  const acrossSlots = slots.filter((s) => s.direction === 'across')
  const downSlots = slots.filter((s) => s.direction === 'down')

  acrossSlots.forEach((s, i) => {
    clues.across[s.number] = acrossClues[i] ?? ''
  })
  downSlots.forEach((s, i) => {
    clues.down[s.number] = downClues[i] ?? ''
  })

  return {
    id: crypto.randomUUID(),
    title: cw.title || 'Imported Puzzle',
    target: 'NYT',
    size,
    grid: numbered,
    clues,
    createdAt: now,
    updatedAt: now,
    notes: '',
  }
}

export function downloadBlob(data: BlobPart, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPdf(puzzle: Puzzle): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: puzzle.size > 15 ? 'landscape' : 'portrait' })
  const cellSize = puzzle.size === 15 ? 10 : 7
  const startX = 20
  const startY = 30

  doc.setFontSize(16)
  doc.text(puzzle.title, startX, 20)

  for (let row = 0; row < puzzle.size; row++) {
    for (let col = 0; col < puzzle.size; col++) {
      const x = startX + col * cellSize
      const y = startY + row * cellSize
      const cell = puzzle.grid[row][col]
      if (cell.isBlack) {
        doc.setFillColor(0, 0, 0)
        doc.rect(x, y, cellSize, cellSize, 'F')
      } else {
        doc.setDrawColor(0, 0, 0)
        doc.rect(x, y, cellSize, cellSize)
        if (cell.number) {
          doc.setFontSize(5)
          doc.text(String(cell.number), x + 1, y + 3)
        }
      }
    }
  }

  let y = startY + puzzle.size * cellSize + 15
  doc.setFontSize(10)
  const slots = extractAllSlots(puzzle.grid).filter((s) => !s.word.includes('?'))

  doc.text('ACROSS', startX, y)
  y += 6
  for (const s of slots.filter((s) => s.direction === 'across')) {
    if (y > 280) { doc.addPage(); y = 20 }
    doc.text(`${s.number}. ${puzzle.clues.across[s.number] ?? ''}`, startX, y)
    y += 5
  }

  y += 5
  doc.text('DOWN', startX, y)
  y += 6
  for (const s of slots.filter((s) => s.direction === 'down')) {
    if (y > 280) { doc.addPage(); y = 20 }
    doc.text(`${s.number}. ${puzzle.clues.down[s.number] ?? ''}`, startX, y)
    y += 5
  }

  return doc.output('blob')
}
