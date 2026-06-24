import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Puzzle, WordEntry } from '@/types'

export interface AppDB extends DBSchema {
  words: {
    key: string
    value: WordEntry
    indexes: { 'by-score': number }
  }
  puzzles: {
    key: string
    value: Puzzle
    indexes: { 'by-updated': string }
  }
}

const DB_NAME = 'crossword-constructor'
export const DB_VERSION = 2
export const WORDS_STORE = 'words'
export const PUZZLES_STORE = 'puzzles'

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

/** Shared IndexedDB for word list and saved puzzles. */
export function getAppDb(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const words = db.createObjectStore(WORDS_STORE, { keyPath: 'word' })
          words.createIndex('by-score', 'score')
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(PUZZLES_STORE)) {
          const puzzles = db.createObjectStore(PUZZLES_STORE, { keyPath: 'id' })
          puzzles.createIndex('by-updated', 'updatedAt')
        }
      },
    })
  }
  return dbPromise
}
