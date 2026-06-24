import { describe, it, expect } from 'vitest'
import {
  allGuideItems,
  filterGuideByWorkspace,
  filterShortcutsByWorkspace,
  help,
  KEYBOARD_SHORTCUTS,
} from '@/lib/helpContent'

function collectHelpStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj]
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap(collectHelpStrings)
  }
  return []
}

describe('helpContent', () => {
  it('has non-empty descriptions for all help tip strings', () => {
    const strings = collectHelpStrings(help)
    expect(strings.length).toBeGreaterThan(30)
    for (const s of strings) {
      expect(s.trim().length).toBeGreaterThan(10)
    }
  })

  it('has non-empty descriptions for all guide items', () => {
    for (const item of allGuideItems()) {
      expect(item.label.trim().length).toBeGreaterThan(0)
      expect(item.description.trim().length).toBeGreaterThan(10)
    }
  })

  it('has non-empty keyboard shortcut descriptions', () => {
    expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(5)
    for (const s of KEYBOARD_SHORTCUTS) {
      expect(s.keys.trim().length).toBeGreaterThan(0)
      expect(s.description.trim().length).toBeGreaterThan(5)
    }
  })

  it('filters guide sections by workspace', () => {
    const gridSections = filterGuideByWorkspace('grid')
    expect(gridSections.some((s) => s.id === 'grid-toolbar')).toBe(true)
    expect(gridSections.some((s) => s.id === 'home')).toBe(false)

    const homeSections = filterGuideByWorkspace('home')
    expect(homeSections.some((s) => s.id === 'home')).toBe(true)
    expect(homeSections.some((s) => s.id === 'global')).toBe(true)
  })

  it('filters shortcuts by workspace', () => {
    const gridShortcuts = filterShortcutsByWorkspace('grid')
    expect(gridShortcuts.some((s) => s.keys === 'Arrow keys')).toBe(true)
    expect(gridShortcuts.some((s) => s.keys === 'Ctrl+F')).toBe(false)
  })
})
