/** 9×9 preview grid for the hero app mockup — ported from approved design. */

type CellType = 'G' | 'Y' | 'B' | 'W'

const BG: Record<CellType, string> = {
  G: '#DCFCE7',
  Y: '#FEF9C3',
  B: '#111111',
  W: '#ffffff',
}

const COLOR: Record<CellType, string> = {
  G: '#15803D',
  Y: '#854D0E',
  B: '#111111',
  W: '#D1D5DB',
}

// [type, letter, clueNum] — G=green, Y=yellow, B=black, W=unfilled
const RAW: [CellType, string, number][] = [
  ['G', 'C', 1], ['G', 'R', 0], ['G', 'O', 0], ['G', 'S', 0], ['G', 'S', 0], ['G', 'W', 0], ['G', 'O', 0], ['G', 'R', 0], ['G', 'D', 0],
  ['G', 'O', 0], ['B', '', 0], ['W', '', 2], ['B', '', 0], ['G', 'N', 0], ['B', '', 0], ['W', '', 3], ['B', '', 0], ['G', 'E', 0],
  ['G', 'M', 0], ['W', '', 0], ['G', 'Y', 4], ['W', '', 0], ['G', 'T', 0], ['W', '', 0], ['G', 'I', 5], ['W', '', 0], ['G', 'A', 0],
  ['B', '', 0], ['Y', 'P', 6], ['Y', 'A', 0], ['Y', 'T', 0], ['Y', 'T', 0], ['Y', 'E', 0], ['Y', 'R', 0], ['Y', 'N', 0], ['B', '', 0],
  ['G', 'L', 0], ['G', 'S', 0], ['B', '', 0], ['W', '', 0], ['G', 'H', 0], ['W', '', 0], ['B', '', 0], ['G', 'L', 0], ['G', 'D', 0],
  ['B', '', 0], ['Y', 'F', 7], ['Y', 'I', 0], ['Y', 'L', 0], ['Y', 'L', 0], ['Y', 'I', 0], ['Y', 'N', 0], ['Y', 'G', 0], ['B', '', 0],
  ['W', '', 0], ['W', '', 0], ['W', '', 8], ['W', '', 0], ['W', '', 0], ['W', '', 0], ['W', '', 9], ['W', '', 0], ['W', '', 0],
  ['W', '', 0], ['B', '', 0], ['W', '', 0], ['B', '', 0], ['W', '', 0], ['B', '', 0], ['W', '', 0], ['B', '', 0], ['W', '', 0],
  ['W', '', 10], ['W', '', 0], ['W', '', 0], ['W', '', 0], ['B', '', 0], ['W', '', 11], ['W', '', 0], ['W', '', 0], ['W', '', 0],
]

export interface HeroGridCell {
  key: number
  background: string
  color: string
  letter: string
  num: string
}

export const HERO_GRID_CELLS: HeroGridCell[] = RAW.map(([type, letter, num], index) => ({
  key: index,
  background: BG[type],
  color: COLOR[type],
  letter,
  num: num > 0 ? String(num) : '',
}))
