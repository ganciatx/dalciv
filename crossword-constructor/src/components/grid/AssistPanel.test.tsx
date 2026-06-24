import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AssistPanel } from '@/components/grid/AssistPanel'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { createPuzzle } from '@/lib/grid'

vi.mock('@/lib/assistProvider', () => ({
  generateThemeSuggestions: vi.fn().mockResolvedValue({ source: 'local', candidates: [] }),
}))

vi.mock('@/lib/fillAssist', () => ({
  searchFillCandidates: vi.fn().mockResolvedValue([]),
}))

describe('AssistPanel', () => {
  it('renders theme and filler tabs when assist is visible', () => {
    usePuzzleStore.setState({
      puzzle: createPuzzle(),
      showAssist: true,
      workspace: 'grid',
    })

    render(<AssistPanel />)
    expect(screen.getByText('Assist')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Theme$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filler/ })).toBeInTheDocument()
  })
})
