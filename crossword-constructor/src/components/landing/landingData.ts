/** Static marketing copy from the approved landing page mockup. */

export const FAQ_ITEMS = [
  {
    q: 'Is this for solving crosswords?',
    a: "No. Crossword Constructor is for people who build crossword puzzles from scratch — hobbyists, aspiring submitters, and experienced constructors. If you're looking for a daily puzzle to solve, this isn't the right tool.",
  },
  {
    q: 'Do I need an account or subscription?',
    a: 'No. Open the app and start a puzzle. No sign-up, no email address, no payment required.',
  },
  {
    q: 'Where is my work stored?',
    a: "Everything stays in your browser — local storage and IndexedDB. Autosave is always on. You can export JSON backups at any time. Clearing your browser's site data for this page will remove saved puzzles.",
  },
  {
    q: 'Does it work offline?',
    a: 'Core features — the grid, word list, compliance checks, and export — work offline after first load. The optional AI theme assist requires internet access and your own OpenAI API key, which is stored in your browser and sent directly to OpenAI.',
  },
  {
    q: 'Can it submit my puzzle to the NYT or WSJ?',
    a: "No. Crossword Constructor helps you build and export files in the formats each publication requires. You submit through their normal processes. We're independent and not affiliated with either publication.",
  },
] as const

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose your target',
    body: 'Pick NYT or WSJ and a grid size — 15×15 or 21×21. Rules, word limits, and export formats adapt automatically.',
  },
  {
    step: '02',
    title: 'Build your grid',
    body: 'Place black squares with click or spacebar. Symmetry auto-pairs placements. Drag theme entries from the answer bank directly onto the grid.',
  },
  {
    step: '03',
    title: 'Fill and refine',
    body: 'Search 15,500+ scored words by pattern. Cells color-code fill quality as you go. Live compliance flags issues before you invest hours in clues.',
  },
  {
    step: '04',
    title: 'Export',
    body: 'Download .puz (Across Lite), NYT or WSJ plain text, PDF solve view, or JSON backup. A pre-export checklist blocks download if errors remain.',
  },
] as const

export const FEATURES = [
  {
    step: '01',
    title: 'Live compliance',
    body: 'Symmetry, all-over interlock, word count, fill quality, and more — updated as you edit, not after. Click any flagged issue to jump to the problem cell.',
    accent: true,
  },
  {
    step: '02',
    title: 'Smart fill help',
    body: 'Pattern search across 15,500+ scored words. Filter by quality, length, proper nouns, and crosswordese. Crossing-aware suggestions ranked for the selected slot.',
    accent: true,
  },
  {
    step: '03',
    title: 'Theme assist',
    body: 'Brainstorm theme entries from a concept phrase or puzzle title. Works offline from the built-in word list. Optional AI mode uses your own OpenAI key — nothing sent to us.',
    accent: true,
  },
  {
    step: '04',
    title: 'Clue workspace',
    body: 'Across/down editor with tab navigation. A built-in library of ~695 example clues to start from. Ctrl+G jumps from any clue field directly to its grid cell.',
    accent: false,
  },
  {
    step: '05',
    title: 'Export ready',
    body: 'Download .puz (Across Lite), NYT or WSJ plain text, PDF solve view, or JSON backup. A pre-export checklist blocks download if errors remain.',
    accent: false,
  },
  {
    step: '06',
    title: 'Private by default',
    body: 'No account, no cloud upload of your puzzles. Autosave to your browser on every edit. A local puzzle library to manage multiple works-in-progress.',
    accent: false,
  },
] as const

export const PUBLICATION_ROWS = [
  { label: 'Grid sizes', nyt: '15×15, 21×21', wsj: '15×15, 21×21', alt: false },
  { label: 'Max words', nyt: '78 / 140', wsj: '78 / 140', alt: true },
  { label: 'Symmetry', nyt: 'Required', wsj: 'Required', alt: false },
  { label: 'Puzzle title', nyt: 'Optional', wsj: 'Required ≤60 chars', alt: true, wsjHighlight: true },
  { label: 'Export', nyt: '.puz, NYT text, PDF', wsj: '.puz, WSJ text, PDF', alt: false },
] as const
