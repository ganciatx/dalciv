import type { AiThemeSuggestion, ThemeCandidate } from '@/types'
import { searchThemeCandidates } from '@/lib/themeAssist'
import { loadAssistSettings } from '@/lib/assistSettings'

export interface ThemeAssistResult {
  source: 'local' | 'ai'
  candidates: ThemeCandidate[]
  aiSuggestion?: AiThemeSuggestion
  error?: string
}

export async function generateThemeSuggestions(
  concept: string,
  gridSize: 15 | 21,
): Promise<ThemeAssistResult> {
  const settings = loadAssistSettings()

  if (settings.provider === 'ai' && settings.apiKey.trim()) {
    try {
      const aiSuggestion = await fetchAiThemeSuggestions(concept, gridSize, settings)
      const candidates: ThemeCandidate[] = aiSuggestion.entries.map((word) => ({
        word: word.toUpperCase(),
        score: 80,
        matchReason: 'AI suggestion',
        length: word.length,
      }))
      return { source: 'ai', candidates, aiSuggestion }
    } catch (err) {
      const local = await searchThemeCandidates(concept, gridSize)
      return {
        source: 'local',
        candidates: local,
        error: err instanceof Error ? err.message : 'AI request failed — showing local results',
      }
    }
  }

  const candidates = await searchThemeCandidates(concept, gridSize)
  return { source: 'local', candidates }
}

async function fetchAiThemeSuggestions(
  concept: string,
  gridSize: 15 | 21,
  settings: { apiKey: string; model: string },
): Promise<AiThemeSuggestion> {
  const minLen = gridSize === 15 ? 9 : 11
  const prompt = `You are a crossword puzzle constructor assistant. Given the theme concept "${concept}" for a ${gridSize}×${gridSize} crossword, suggest 8-12 theme entry candidates (single words or short phrases without spaces, uppercase letters only, length ${minLen}-${gridSize}). Return JSON only: {"entries":["WORD1","WORD2",...],"rationale":"one sentence explaining the theme link"}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty AI response')

  const parsed = JSON.parse(content) as AiThemeSuggestion
  if (!Array.isArray(parsed.entries)) throw new Error('Invalid AI response format')

  parsed.entries = parsed.entries
    .map((e) => String(e).replace(/[^A-Za-z]/g, '').toUpperCase())
    .filter((e) => e.length >= minLen && e.length <= gridSize)

  return parsed
}
