import type { Workspace } from '@/types'

/** One-sentence descriptions for interactive controls (used as native `title` tooltips). */
export const help = {
  nav: {
    home: 'Return to the home screen and your saved puzzle library.',
    tabGrid: 'Design the grid, place black squares, and fill answers.',
    tabWords: 'Search the word list and manage custom vocabulary.',
    tabClues: 'Write and edit clues for completed grid entries.',
    title: 'Puzzle title shown in exports; required and distinct for WSJ submissions.',
    target: 'Publication target — switches compliance rules and available export formats.',
    complianceBadge: 'Live compliance summary — click Guidance (?) for details on each issue.',
    guidance: 'Open the Guidance panel with tips, shortcuts, and a full interface reference (F1).',
    export: 'Export the puzzle to .puz, plain text, PDF, or JSON (Ctrl+E).',
    newPuzzle: 'Start a blank puzzle with the current grid size and publication target.',
    openFile: 'Open a saved .json or .puz puzzle file from disk.',
    saveFile: 'Download the current puzzle as a .json backup file (Ctrl+S).',
  },
  home: {
    restoreSession: 'Resume the autosaved puzzle from your last editing session.',
    new15Nyt: 'Create a new 15×15 puzzle validated against NYT rules.',
    new21Nyt: 'Create a new 21×21 puzzle validated against NYT Sunday rules.',
    new15Wsj: 'Create a new 15×15 puzzle validated against WSJ rules.',
    new21Wsj: 'Create a new 21×21 puzzle validated against WSJ Saturday rules.',
    openPuzzle: 'Open this saved puzzle in the editor.',
    renamePuzzle: 'Change the title of this saved puzzle.',
    deletePuzzle: 'Permanently remove this puzzle from your local library.',
    saveRename: 'Apply the new title to this saved puzzle.',
    cancelRename: 'Discard the title edit and keep the original name.',
  },
  grid: {
    toolbar: {
      size: 'Switch between 15×15 and 21×21 — clears the entire grid.',
      symmetry: 'When on, placing a black square also places its 180° symmetric partner.',
      rebus: 'When on, typed letters stack into multi-letter rebus cells instead of single letters.',
      clearLetters: 'Remove all letters from white cells while keeping black squares.',
      resetGrid: 'Clear the entire grid including black squares and all clues.',
      assist: 'Show or hide the Assist panel for theme and filler suggestions (Ctrl+Shift+A).',
      zoom: 'Change the display size of grid cells without affecting the puzzle data.',
    },
    blackSquare: 'Drag onto the grid to paint black squares (auto-symmetric when symmetry is on).',
    canvas: 'Click a white cell to select it; click again to toggle across/down. Right-click or Space toggles black.',
    answers: {
      across: 'Place dragged answers horizontally, starting at the drop cell.',
      down: 'Place dragged answers vertically, starting at the drop cell.',
      addInput: 'Type a word or phrase to add to your answer bank (spaces are stripped).',
      addButton: 'Add the typed word to the answer bank for drag-and-drop placement.',
      dragWord: 'Drag onto the grid — the drop cell becomes the first letter of the word.',
      removeWord: 'Remove this word from the answer bank.',
    },
    assist: {
      settings: 'Configure Assist provider and optional AI settings for theme ideation.',
      tabTheme: 'Browse theme entry suggestions based on your concept or title.',
      tabFiller: 'Browse crossing-aware filler suggestions for the selected slot.',
      themeConcept: 'Seed phrase for theme suggestions — e.g. ocean, music, spring.',
      markTheme: 'Flag the selected numbered slot as a theme entry for highlighting.',
      jumpPair: 'Move selection to the 180° symmetric partner of the current theme slot.',
      applyTheme: 'Fill the selected slot with this theme word and mark it as theme.',
      addToBank: 'Add this suggestion to the left-side answer bank for drag placement.',
      applyFiller: 'Fill the selected slot with this crossing-aware filler word.',
      provider: 'Local word list (offline) or OpenAI for AI-generated theme ideas only.',
      apiKey: 'Your OpenAI API key — stored locally in the browser, never sent to our servers.',
      model: 'OpenAI model name used for theme ideation requests.',
    },
    wordEntry: {
      minScore: 'Minimum word-list quality score for fill suggestions shown below.',
      applySuggestion: 'Fill the currently selected slot with this word from the word list.',
      dictionaryLookup: 'Look up the filled slot word online and add it to your local dictionary.',
    },
    compliance: {
      issue: 'Jump to this cell or slot on the grid to fix the compliance issue.',
    },
    stats: {
      words: 'Number of complete words vs. the maximum allowed for this grid size and target.',
      blackSquares: 'Black square count and percentage of total cells (highlights when above 17%).',
      avgLength: 'Average length of complete words currently in the grid.',
      threeLetter: 'Count of completed 3-letter answers — keep near 20% of total words for NYT.',
      fill: 'Percentage of white cells that contain a letter or rebus value.',
    },
  },
  words: {
    pattern: 'Search pattern — use ? for any letter; leave empty to browse top-scored words.',
    minScore: 'Only show words at or above this quality score from the word list.',
    maxLength: 'Hide words longer than this many letters.',
    excludeProper: 'Filter out words tagged as proper nouns.',
    excludeAbbr: 'Filter out abbreviated forms.',
    excludeCrosswordese: 'Filter out common crossword filler (ERA, ORE, etc.).',
    uploadList: 'Import a custom word list from a CSV or plain-text file into local storage.',
    dictionaryLookup: 'Look up an exact English word online (not a pattern — use ? only in pattern search above).',
    dictionarySearch: 'Search FreeDictionaryAPI.com and dictionaryapi.dev for this word.',
    dictionaryImport: 'Add this word to your local IndexedDB dictionary with an auto-assigned quality score.',
  },
  clues: {
    wsjTitle: 'WSJ requires a title that does not duplicate any theme answer (max 60 chars).',
    clueInput: 'Enter the clue text; Tab moves between clues, Ctrl+G jumps to the grid cell.',
    pastClues: 'Expand to see example clues for this answer from the built-in clue library.',
    copyClue: 'Copy this example clue into the clue field for editing.',
  },
  export: {
    ackWarnings: 'Confirm you accept remaining compliance warnings before exporting.',
    format: 'Choose the file format — options depend on your publication target.',
    cancel: 'Close the export dialog without downloading.',
    download: 'Download the puzzle in the selected format.',
  },
  guidance: {
    close: 'Close the Guidance panel.',
  },
} as const

export interface HelpGuideItem {
  id: string
  label: string
  description: string
}

export interface HelpGuideSection {
  id: string
  title: string
  /** Which workspace this section primarily belongs to; `all` shows everywhere. */
  workspace: Workspace | 'all' | 'home'
  items: HelpGuideItem[]
}

/** Full interface reference shown in the Guidance sidebar. */
export const HELP_GUIDE_SECTIONS: HelpGuideSection[] = [
  {
    id: 'global',
    title: 'Navigation & files',
    workspace: 'all',
    items: [
      { id: 'nav-home', label: 'Crossword Constructor', description: help.nav.home },
      { id: 'nav-grid', label: 'Grid tab', description: help.nav.tabGrid },
      { id: 'nav-words', label: 'Words tab', description: help.nav.tabWords },
      { id: 'nav-clues', label: 'Clues tab', description: help.nav.tabClues },
      { id: 'nav-title', label: 'Puzzle title', description: help.nav.title },
      { id: 'nav-target', label: 'NYT / WSJ target', description: help.nav.target },
      { id: 'nav-compliance', label: 'Compliance badge', description: help.nav.complianceBadge },
      { id: 'nav-guidance', label: 'Guidance (?)', description: help.nav.guidance },
      { id: 'nav-export', label: 'Export', description: help.nav.export },
      { id: 'nav-new', label: 'New', description: help.nav.newPuzzle },
      { id: 'nav-open', label: 'Open', description: help.nav.openFile },
      { id: 'nav-save', label: 'Save', description: help.nav.saveFile },
    ],
  },
  {
    id: 'home',
    title: 'Home screen',
    workspace: 'home',
    items: [
      { id: 'home-restore', label: 'Restore Session', description: help.home.restoreSession },
      { id: 'home-new', label: 'New puzzle buttons', description: help.home.new15Nyt },
      { id: 'home-open', label: 'Saved puzzle row', description: help.home.openPuzzle },
      { id: 'home-rename', label: 'Rename', description: help.home.renamePuzzle },
      { id: 'home-delete', label: 'Delete', description: help.home.deletePuzzle },
    ],
  },
  {
    id: 'grid-toolbar',
    title: 'Grid toolbar',
    workspace: 'grid',
    items: [
      { id: 'gt-size', label: 'Size', description: help.grid.toolbar.size },
      { id: 'gt-symmetry', label: 'Symmetry', description: help.grid.toolbar.symmetry },
      { id: 'gt-rebus', label: 'Rebus', description: help.grid.toolbar.rebus },
      { id: 'gt-clear', label: 'Clear Letters', description: help.grid.toolbar.clearLetters },
      { id: 'gt-reset', label: 'Reset Grid', description: help.grid.toolbar.resetGrid },
      { id: 'gt-black', label: 'Black square token', description: help.grid.blackSquare },
      { id: 'gt-assist', label: 'Assist toggle', description: help.grid.toolbar.assist },
      { id: 'gt-zoom', label: 'Zoom', description: help.grid.toolbar.zoom },
    ],
  },
  {
    id: 'grid-canvas',
    title: 'Grid canvas',
    workspace: 'grid',
    items: [
      { id: 'gc-canvas', label: 'Grid cells', description: help.grid.canvas },
      { id: 'gc-answers', label: 'Answer bank (left)', description: help.grid.answers.dragWord },
      { id: 'gc-direction', label: 'Across / Down toggle', description: help.grid.answers.across },
      { id: 'gc-shift', label: 'Shift while dragging', description: 'Hold Shift while dragging an answer to temporarily flip between across and down placement.' },
    ],
  },
  {
    id: 'grid-assist',
    title: 'Assist panel',
    workspace: 'grid',
    items: [
      { id: 'ga-settings', label: 'Settings', description: help.grid.assist.settings },
      { id: 'ga-theme-tab', label: 'Theme tab', description: help.grid.assist.tabTheme },
      { id: 'ga-filler-tab', label: 'Filler tab', description: help.grid.assist.tabFiller },
      { id: 'ga-concept', label: 'Theme concept', description: help.grid.assist.themeConcept },
      { id: 'ga-mark', label: 'Mark as theme', description: help.grid.assist.markTheme },
      { id: 'ga-pair', label: 'Jump to pair', description: help.grid.assist.jumpPair },
      { id: 'ga-apply-theme', label: 'Theme suggestion', description: help.grid.assist.applyTheme },
      { id: 'ga-bank', label: '+ (add to bank)', description: help.grid.assist.addToBank },
      { id: 'ga-filler', label: 'Filler suggestion', description: help.grid.assist.applyFiller },
    ],
  },
  {
    id: 'grid-panels',
    title: 'Grid side panels',
    workspace: 'grid',
    items: [
      { id: 'gp-word-entry', label: 'Word suggestions', description: help.grid.wordEntry.applySuggestion },
      { id: 'gp-min-score', label: 'Min score slider', description: help.grid.wordEntry.minScore },
      { id: 'gp-compliance', label: 'Compliance issues', description: help.grid.compliance.issue },
      { id: 'gp-stats', label: 'Live stats bar', description: help.grid.stats.fill },
    ],
  },
  {
    id: 'words',
    title: 'Words workspace',
    workspace: 'words',
    items: [
      { id: 'w-pattern', label: 'Pattern search', description: help.words.pattern },
      { id: 'w-min', label: 'Min score', description: help.words.minScore },
      { id: 'w-maxlen', label: 'Max length', description: help.words.maxLength },
      { id: 'w-proper', label: 'Exclude proper nouns', description: help.words.excludeProper },
      { id: 'w-abbr', label: 'Exclude abbreviations', description: help.words.excludeAbbr },
      { id: 'w-cross', label: 'Exclude crosswordese', description: help.words.excludeCrosswordese },
      { id: 'w-upload', label: 'Upload word list', description: help.words.uploadList },
      { id: 'w-dict-lookup', label: 'Online dictionary lookup', description: help.words.dictionaryLookup },
      { id: 'w-dict-import', label: 'Add to dictionary', description: help.words.dictionaryImport },
    ],
  },
  {
    id: 'clues',
    title: 'Clues workspace',
    workspace: 'clues',
    items: [
      { id: 'c-title', label: 'WSJ title field', description: help.clues.wsjTitle },
      { id: 'c-input', label: 'Clue fields', description: help.clues.clueInput },
      { id: 'c-past', label: 'Past clues', description: help.clues.pastClues },
      { id: 'c-copy', label: 'Example clue', description: help.clues.copyClue },
    ],
  },
  {
    id: 'export',
    title: 'Export dialog',
    workspace: 'all',
    items: [
      { id: 'ex-warn', label: 'Acknowledge warnings', description: help.export.ackWarnings },
      { id: 'ex-format', label: 'Format', description: help.export.format },
      { id: 'ex-download', label: 'Download', description: help.export.download },
    ],
  },
]

export interface KeyboardShortcut {
  keys: string
  description: string
  workspace?: Workspace | 'all'
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'F1 / Ctrl+?', description: 'Open or close Guidance', workspace: 'all' },
  { keys: 'Ctrl+Z', description: 'Undo last grid or clue change', workspace: 'grid' },
  { keys: 'Ctrl+Shift+Z / Ctrl+Y', description: 'Redo the last undone change', workspace: 'grid' },
  { keys: 'Ctrl+S', description: 'Save puzzle as .json file', workspace: 'all' },
  { keys: 'Ctrl+E', description: 'Open export dialog', workspace: 'all' },
  { keys: 'Ctrl+Shift+A', description: 'Toggle Assist panel', workspace: 'grid' },
  { keys: 'Arrow keys', description: 'Move selection on the grid', workspace: 'grid' },
  { keys: 'Tab / Shift+Tab', description: 'Move to next or previous slot in current direction', workspace: 'grid' },
  { keys: 'A–Z', description: 'Type a letter into the selected cell', workspace: 'grid' },
  { keys: 'Backspace', description: 'Clear letter and move back one cell', workspace: 'grid' },
  { keys: 'Delete', description: 'Clear letter in place', workspace: 'grid' },
  { keys: 'Space', description: 'Toggle black square at selected cell', workspace: 'grid' },
  { keys: 'Shift (while dragging)', description: 'Flip answer placement between across and down', workspace: 'grid' },
  { keys: 'Ctrl+F', description: 'Focus word pattern search', workspace: 'words' },
  { keys: 'Tab', description: 'Move between clue fields in a column', workspace: 'clues' },
  { keys: 'Ctrl+G', description: 'Jump from clue field to grid cell', workspace: 'clues' },
]

/** Sections relevant to the current workspace (always includes `all`). */
export function filterGuideByWorkspace(workspace: Workspace): HelpGuideSection[] {
  if (workspace === 'home') {
    return HELP_GUIDE_SECTIONS.filter((s) => s.workspace === 'home' || s.workspace === 'all')
  }
  return HELP_GUIDE_SECTIONS.filter((s) => s.workspace === workspace || s.workspace === 'all')
}

export function filterShortcutsByWorkspace(workspace: Workspace): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter((s) => !s.workspace || s.workspace === 'all' || s.workspace === workspace)
}

/** Flat list of every guide item (for tests). */
export function allGuideItems(): HelpGuideItem[] {
  return HELP_GUIDE_SECTIONS.flatMap((s) => s.items)
}
