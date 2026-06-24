import type { AssistSettings } from '@/types'

const STORAGE_KEY = 'crosscreate-assist-settings'

const DEFAULTS: AssistSettings = {
  provider: 'local',
  apiKey: '',
  model: 'gpt-4o-mini',
}

export function loadAssistSettings(): AssistSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) as Partial<AssistSettings> }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveAssistSettings(settings: AssistSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
