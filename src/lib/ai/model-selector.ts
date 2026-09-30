/**
 * Groq model selection.
 *
 * The catalog returned by `models.list()` is the only source of truth about
 * which models exist and what they can do. This module turns that catalog plus
 * the requirements of a concrete request into a model choice, so the application
 * never asserts that one model is permanently the best one.
 *
 * Selection is a pure function and is unit tested directly, including the cases
 * where the catalog is empty, incomplete, or contains nothing usable.
 */

/** What a specific request needs from a model. */
export interface ModelRequirement {
  /** Minimum number of output tokens the request must be able to produce. */
  maxOutputTokens?: number
  /** Minimum context window, used when the caller sends a large prompt. */
  contextWindow?: number
  /** Model ids that must not be chosen, used when retrying after a rejection. */
  exclude?: string[]
}

export interface GroqModelInfo {
  id: string
  contextWindow?: number
  maxCompletionTokens?: number
}

/**
 * Task preference order. This expresses what quality Kanbi wants, not which model
 * happens to be available: an entry is only ever used if it is present in the
 * live catalog and satisfies the request.
 *
 * 1. llama-3.3-70b-versatile  current general purpose production model
 * 2. openai/gpt-oss-120b      strong structured output and reasoning
 * 3. openai/gpt-oss-20b       fast and inexpensive
 * 4. llama-3.1-8b-instant     last resort, very fast
 */
const PREFERENCE_ORDER = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
] as const

const DEFAULT_FALLBACK = PREFERENCE_ORDER[0]

/**
 * Models that are known to have been shut down by the provider. Groq's
 * `models.list()` normally omits these, but a cached or edge-cached catalog can
 * still contain one, and a stale id would otherwise be selected and fail.
 * Verified against https://console.groq.com/docs/deprecations
 */
const KNOWN_RETIRED = new Set([
  'gemma2-9b-it',
  'gemma-7b-it',
  'mixtral-8x7b-32768',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'llama-3.1-70b-versatile',
  'mistral-saba-24b',
  'qwen-qwq-32b',
  'llama-guard-3-8b',
  'llama-3.2-1b-preview',
])

/** Audio and moderation models are real but cannot serve a chat completion. */
function isChatCapable(id: string): boolean {
  return !/whisper|orpheus|guard|safeguard|playai/i.test(id)
}

function isUsable(model: GroqModelInfo, requirement: ModelRequirement): boolean {
  if (KNOWN_RETIRED.has(model.id)) return false
  if (!isChatCapable(model.id)) return false
  if (requirement.exclude?.includes(model.id)) return false

  // Only enforce a limit when the catalog actually reports it. An unknown limit
  // is treated as unknown, not as zero, so a sparse catalog does not make every
  // model look unusable.
  const { maxOutputTokens, contextWindow } = requirement
  if (
    typeof maxOutputTokens === 'number' &&
    typeof model.maxCompletionTokens === 'number' &&
    model.maxCompletionTokens < maxOutputTokens
  ) {
    return false
  }
  if (
    typeof contextWindow === 'number' &&
    typeof model.contextWindow === 'number' &&
    model.contextWindow < contextWindow
  ) {
    return false
  }
  return true
}

/** Position in the preference order, or Infinity for anything unlisted. */
function preferenceRank(id: string): number {
  const index = PREFERENCE_ORDER.indexOf(id as (typeof PREFERENCE_ORDER)[number])
  return index === -1 ? Number.POSITIVE_INFINITY : index
}

/**
 * Chooses the best usable model for a request.
 *
 * @param catalog    models reported by the provider
 * @param requirement what the request needs
 * @param fallback    returned when nothing in the catalog is usable. When null
 *                    is passed the function returns null instead, which is what
 *                    the retry path uses to detect that no alternative exists.
 */
export function selectModelFromCatalog(
  catalog: GroqModelInfo[],
  requirement: ModelRequirement,
  fallback: string | null
): string | null {
  const usable = catalog.filter((model) => isUsable(model, requirement))

  // A null fallback means the caller wants to know whether any alternative
  // exists, so "nothing usable" must stay null instead of becoming a guess.
  if (usable.length === 0) return fallback

  // Preferred models first, in declared order. An unlisted model has infinite
  // rank, so any listed candidate wins regardless of its reported limits.
  const ranked = [...usable].sort((a, b) => {
    const rankA = preferenceRank(a.id)
    const rankB = preferenceRank(b.id)
    const aRanked = Number.isFinite(rankA)
    const bRanked = Number.isFinite(rankB)
    if (aRanked !== bRanked) return aRanked ? -1 : 1
    if (aRanked && bRanked && rankA !== rankB) return rankA - rankB

    // Among equally preferred models, prefer the one with the most headroom for
    // this request. Larger is better because it leaves room for longer output.
    const aRoom = a.maxCompletionTokens ?? 0
    const bRoom = b.maxCompletionTokens ?? 0
    if (aRoom !== bRoom) return bRoom - aRoom

    // Final tiebreak is stable and alphabetical so selection is deterministic.
    return a.id.localeCompare(b.id)
  })

  return ranked[0]!.id
}

/** Exposed for tests and diagnostics. */
export const __testing = {
  PREFERENCE_ORDER,
  KNOWN_RETIRED,
  isUsable,
  preferenceRank,
}
