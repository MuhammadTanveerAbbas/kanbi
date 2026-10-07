/**
 * The model registry.
 *
 * This is the layer that turns "a list of open-weight models, discovered at
 * runtime" into "the model this request should use", and it is the only place
 * that caches, refreshes, or falls back.
 *
 * ## How the model set actually evolves
 *
 * The provider exposes `GET /v1/models`, which every OpenAI-compatible runtime
 * implements and which reflects what the runtime can currently serve. The
 * registry reads that endpoint, caches it for an hour, and re-reads it on demand
 * when a model turns out to be gone.
 *
 * That is the whole mechanism. There is no scheduled refresh job, no scraping
 * of a model index, and no assertion anywhere in this repository that a
 * particular model exists. When a new open-weight release lands on the runtime,
 * it is in the catalog within the hour and selection starts considering it. When
 * one is withdrawn, the cached id fails the request, the registry refreshes, and
 * the next candidate is chosen automatically.
 *
 * The alternative, a pinned id with a fallback chain, is what this replaces: it
 * needs an edit and a deploy every time the model changes.
 *
 * ## Failure behaviour
 *
 * Discovery failing is not fatal. The registry falls back to the configured
 * default so the request can still be attempted, and the completion path handles
 * a rejection by rotating to the next candidate. What it will not do is report a
 * specific model as working when the runtime has never heard of it.
 */

import { cacheManager } from '@/lib/cache/cache-manager'
import { logger } from '@/lib/logging/logger'
import { DEFAULT_AI_MODEL, aiSettings } from '@/lib/ai/config'
import { selectModelFromCatalog, type ModelRequirement } from '@/lib/ai/model-selector'
import type { AiProvider, ModelInfo } from '@/lib/ai/provider'

const MODEL_CACHE_KEY = 'ai:models'
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * In-flight discovery requests, so a burst of parallel requests triggers one
 * call to the runtime rather than one per request. The cached catalog is
 * process-wide, so this has to be as well.
 */
let inFlight: Promise<ModelInfo[]> | null = null

/**
 * The provider's current model list, cached.
 *
 * @param forceRefresh bypasses the cache. Used on the failure path, where the
 *   whole point is to notice a model that has just disappeared.
 */
export async function fetchModelCatalog(
  provider: AiProvider,
  forceRefresh = false,
): Promise<ModelInfo[]> {
  if (!forceRefresh) {
    const cached = cacheManager.get<ModelInfo[]>(MODEL_CACHE_KEY)
    if (cached) return cached
    if (inFlight) return inFlight
  }

  const request = provider
    .listModels()
    .then((models) => {
      // An empty catalog is treated as a failure rather than cached. Caching it
      // would pin the provider in a "no models" state for an hour, which is a
      // long time to serve an error that a single retry would have cleared.
      if (models.length > 0) {
        cacheManager.set(MODEL_CACHE_KEY, models, MODEL_CACHE_TTL_MS)
      }
      return models
    })
    .finally(() => {
      if (inFlight === request) inFlight = null
    })

  inFlight = request
  return request
}

/**
 * Drops the cached catalog.
 *
 * Uses `invalidate` rather than `clear` so the usage and analytics caches, which
 * are keyed on a user id and unrelated to inference, survive. Exposed for tests
 * and for a manual invalidation.
 */
export function clearModelCatalog(): void {
  cacheManager.invalidate(MODEL_CACHE_KEY)
  inFlight = null
}

/**
 * Chooses a model for a request.
 *
 * Never throws. If discovery fails, the configured default is returned so the
 * request can still be attempted, and the completion path turns a rejection into
 * a controlled error rather than a loop.
 */
export async function selectModelForRequest(
  provider: AiProvider,
  requirement: ModelRequirement = {},
  forceRefresh = false,
): Promise<string> {
  const { defaultModel } = aiSettings()

  let catalog: ModelInfo[] = []
  try {
    catalog = await fetchModelCatalog(provider, forceRefresh)
  } catch (error) {
    logger.warn('Model discovery failed, falling back to the configured model', {
      provider: provider.id,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // `defaultModel` is the last resort. If it is also rejected, the completion
  // path reports a real error instead of retrying forever.
  return selectModelFromCatalog(catalog, requirement, defaultModel) ?? defaultModel
}

/**
 * Picks the next candidate after a failure, excluding what just failed.
 *
 * Returns null when the catalog holds no alternative, which is the signal to
 * stop rotating and surface the original error.
 */
export async function pickFallbackModel(
  provider: AiProvider,
  failedModel: string,
): Promise<string | null> {
  let catalog: ModelInfo[] = []
  try {
    // Force a refresh: the most common reason to be here is that the catalog
    // has just gone stale, and the cached copy is what told us to pick a model
    // that no longer exists.
    catalog = await fetchModelCatalog(provider, true)
  } catch (refreshError) {
    logger.warn('Model catalog refresh failed', {
      provider: provider.id,
      error: refreshError instanceof Error ? refreshError.message : String(refreshError),
    })
  }
  // No operator pin here. The pin is what just failed, and offering it again as
  // a fallback would rotate straight back into the error.
  return selectModelFromCatalog(catalog, { exclude: [failedModel] }, null)
}

/**
 * A short description of the model's current state, for the health endpoint.
 *
 * Deliberately reports the catalog size and whether discovery works rather than
 * asserting a model name, so this cannot itself become a stale reference.
 */
export async function describeModelState(
  provider: AiProvider,
): Promise<{ provider: string; models: number; default: string; healthy: boolean }> {
  const { defaultModel } = aiSettings()
  if (!provider.isConfigured()) {
    return { provider: provider.id, models: 0, default: defaultModel, healthy: false }
  }
  try {
    const catalog = await fetchModelCatalog(provider)
    return {
      provider: provider.id,
      models: catalog.length,
      default: defaultModel || DEFAULT_AI_MODEL,
      healthy: catalog.length > 0,
    }
  } catch {
    return { provider: provider.id, models: 0, default: defaultModel, healthy: false }
  }
}
