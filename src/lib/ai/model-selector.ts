/**
 * Model selection.
 *
 * ## The rule
 *
 * Selection is a pure function of two inputs: the catalog the provider currently
 * reports, and what the concrete request needs. Nothing here knows a model id
 * by heart, and nothing here decides what exists.
 *
 * That is the difference between this and a switch statement with four hardcoded
 * ids in it. When the runtime publishes a new open-weight model, it appears in
 * the catalog and becomes selectable on the next cache refresh, with no change
 * to this file and no change to any caller.
 *
 * Ranking, in order:
 *
 * 1. The `AI_MODEL` pin, if set and usable. An operator override always wins.
 * 2. `MODEL_PROFILES` priority. A ranking hint, not an inventory.
 * 3. Reported capability, preferring the model with the most headroom for the
 *    request's output so longer answers are not cut off.
 * 4. Model id, alphabetically, so the choice is stable and reproducible.
 *
 * Because steps 2 to 4 all fall through for an unprofiled model, an entirely new
 * family still gets selected when it is the only candidate, and gets selected
 * ahead of a worse family when it is profiled.
 *
 * Unit tested directly, including the empty, incomplete, and nothing-usable
 * catalog cases.
 */

import {
  MODEL_PROFILES,
  NON_CHAT_PATTERNS,
  RETIRED_MODEL_PATTERNS,
} from './model-profiles'
import type { ModelInfo } from './provider'

/** What a specific request needs from a model. */
export interface ModelRequirement {
  /** Minimum number of output tokens the request must be able to produce. */
  maxOutputTokens?: number
  /** Minimum context window, used when the caller sends a large prompt. */
  contextWindow?: number
  /** Model ids that must not be chosen, used when retrying after a rejection. */
  exclude?: string[]
}

/**
 * Effective limits for a model, filling gaps from the profile.
 *
 * The catalog and the profile are complementary. A runtime that reports
 * `context_window` is authoritative; one that does not gets the profile's
 * assumption, which is why a sparse catalog does not make every model look
 * unusable.
 */
export interface ResolvedModel extends ModelInfo {
  contextWindow?: number
  maxOutputTokens?: number
  /** Position in `MODEL_PROFILES`, or Infinity when unprofiled. */
  priority: number
  label: string
}

function profileFor(id: string) {
  const lower = id.toLowerCase()
  for (const profile of MODEL_PROFILES) {
    if (profile.match.some((needle) => lower.includes(needle.toLowerCase()))) {
      return profile
    }
  }
  return undefined
}

function matchesAny(id: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(id))
}

/**
 * Turns a raw catalog entry into a ranked candidate.
 *
 * A reported limit wins over the profile's assumption, because a runtime that
 * tells you its context window is telling you the truth about the weights it
 * actually has loaded.
 */
export function resolveModel(model: ModelInfo): ResolvedModel {
  const profile = profileFor(model.id)
  return {
    ...model,
    contextWindow: model.contextWindow ?? profile?.contextWindow,
    maxOutputTokens: model.maxOutputTokens ?? profile?.maxOutputTokens,
    priority: profile?.priority ?? Number.POSITIVE_INFINITY,
    label: profile?.label ?? 'Unrecognised open-weight model',
  }
}

/**
 * Whether a model can serve this request at all.
 *
 * Unreported limits are treated as unknown rather than as zero. The alternative
 * is a runtime that omits `max_completion_tokens` making every model unusable,
 * which would silently collapse the whole catalogue down to the pinned default.
 */
export function isUsable(model: ModelInfo, requirement: ModelRequirement): boolean {
  if (matchesAny(model.id, RETIRED_MODEL_PATTERNS)) return false
  if (matchesAny(model.id, NON_CHAT_PATTERNS)) return false
  if (requirement.exclude?.includes(model.id)) return false

  const resolved = resolveModel(model)
  const { maxOutputTokens, contextWindow } = requirement

  if (
    typeof maxOutputTokens === 'number' &&
    typeof resolved.maxOutputTokens === 'number' &&
    resolved.maxOutputTokens < maxOutputTokens
  ) {
    return false
  }
  if (
    typeof contextWindow === 'number' &&
    typeof resolved.contextWindow === 'number' &&
    resolved.contextWindow < contextWindow
  ) {
    return false
  }
  return true
}

/**
 * Chooses the best usable model for a request.
 *
 * @param catalog    models the provider currently reports
 * @param requirement what the request needs
 * @param pinned     an operator override, from `AI_MODEL`. Returned whenever it
 *                   appears in the catalog and satisfies the request.
 * @returns the chosen id, or `null` when nothing in the catalog is usable. A
 *          null result is meaningful: it tells the caller there is no
 *          alternative, so the retry path should surface a real error rather
 *          than loop.
 */
export function selectModelFromCatalog(
  catalog: ModelInfo[],
  requirement: ModelRequirement,
  pinned?: string | null,
): string | null {
  const usable = catalog.filter((model) => isUsable(model, requirement))
  if (usable.length === 0) return null

  // An explicit operator pin outranks preference, but only if it is actually
  // offered. A pin naming a model the runtime does not serve is a
  // configuration error, and falling through to a working model is better than
  // failing every request.
  if (pinned) {
    const match = usable.find((model) => model.id === pinned)
    if (match) return match.id
  }

  const ranked = [...usable].sort(compare)

  // Prefer a profiled model over an unprofiled one, then apply the rest of the
  // ordering. The primary sort already handles this, since an unprofiled model
  // has an infinite priority, so the fallback id is only ever reached between
  // two models of identical standing.
  return ranked[0]!.id
}

function compare(a: ModelInfo, b: ModelInfo): number {
  const ra = resolveModel(a)
  const rb = resolveModel(b)

  const aKnown = Number.isFinite(ra.priority)
  const bKnown = Number.isFinite(rb.priority)
  if (aKnown !== bKnown) return aKnown ? -1 : 1
  if (aKnown && bKnown && ra.priority !== rb.priority) return ra.priority - rb.priority

  // Among equally preferred models, prefer the most headroom for this request.
  // Larger is better because it leaves room for a longer answer.
  const aRoom = ra.maxOutputTokens ?? 0
  const bRoom = rb.maxOutputTokens ?? 0
  if (aRoom !== bRoom) return bRoom - aRoom

  // Stable and alphabetical, so the same catalog always yields the same choice.
  return a.id.localeCompare(b.id)
}

/** Exposed for tests and diagnostics. */
export const __testing = {
  MODEL_PROFILES,
  NON_CHAT_PATTERNS,
  RETIRED_MODEL_PATTERNS,
  isUsable,
  profileFor,
  resolveModel,
  compare,
}
