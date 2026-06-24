/// <reference types="vite/client" />

declare module '@confuzzle/puz-crossword' {
  export class PuzCrossword {
    constructor(options: Record<string, unknown>)
    static from(data: Uint8Array): PuzCrossword
    width: number
    height: number
    title: string
    solution: string
    grid: string
    clues?: { across: string[]; down: string[] }
    toBytes(): Uint8Array
  }
}
