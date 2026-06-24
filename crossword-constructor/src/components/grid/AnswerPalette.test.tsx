import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnswerPalette } from '@/components/grid/AnswerPalette'
import { usePuzzleStore } from '@/stores/puzzleStore'
import { createPuzzle } from '@/lib/grid'

describe('AnswerPalette', () => {
  it('renders answer bank entries and placement direction toggle', () => {
    const puzzle = createPuzzle()
    puzzle.answerBank = ['OCEAN', 'CORAL']
    usePuzzleStore.setState({
      puzzle,
      placementDirection: 'across',
      workspace: 'grid',
    })

    render(<AnswerPalette />)
    expect(screen.getByText('Answers')).toBeInTheDocument()
    expect(screen.getByText('OCEAN')).toBeInTheDocument()
    expect(screen.getByText('CORAL')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'across' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'down' })).toBeInTheDocument()
  })

  it('adds a word to the bank from the input', () => {
    usePuzzleStore.setState({ puzzle: createPuzzle(), placementDirection: 'across' })
    render(<AnswerPalette />)

    fireEvent.change(screen.getByPlaceholderText('Add word...'), { target: { value: 'tide' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(usePuzzleStore.getState().puzzle.answerBank).toEqual(['TIDE'])
  })

  it('switches placement direction', () => {
    usePuzzleStore.setState({ puzzle: createPuzzle(), placementDirection: 'across' })
    render(<AnswerPalette />)

    fireEvent.click(screen.getByRole('button', { name: 'down' }))
    expect(usePuzzleStore.getState().placementDirection).toBe('down')
  })
})
