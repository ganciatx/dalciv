import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuidanceSidebar } from '@/components/GuidanceSidebar'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { createPuzzle } from '@/lib/grid'

describe('GuidanceSidebar', () => {
  it('renders tabbed help sections when visible', () => {
    usePuzzleStore.setState({
      puzzle: createPuzzle(),
      showGuidance: true,
      workspace: 'grid',
    })

    render(<GuidanceSidebar />)
    expect(screen.getByText(/Guidance — NYT/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'This screen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Full guide' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shortcuts' })).toBeInTheDocument()
    expect(screen.getByText(/Hover any control for a quick tip/)).toBeInTheDocument()
  })

  it('shows searchable full guide', () => {
    usePuzzleStore.setState({
      puzzle: createPuzzle(),
      showGuidance: true,
      workspace: 'grid',
    })

    render(<GuidanceSidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'Full guide' }))
    expect(screen.getByPlaceholderText('Search controls...')).toBeInTheDocument()
    expect(screen.getByText('Grid toolbar')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search controls...'), { target: { value: 'symmetry' } })
    expect(screen.getByText('Symmetry')).toBeInTheDocument()
  })

  it('shows keyboard shortcuts tab', () => {
    usePuzzleStore.setState({
      puzzle: createPuzzle(),
      showGuidance: true,
      workspace: 'grid',
    })

    render(<GuidanceSidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'Shortcuts' }))
    expect(screen.getByText('Arrow keys')).toBeInTheDocument()
  })
})
