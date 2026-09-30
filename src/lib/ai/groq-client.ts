import Groq from 'groq-sdk'
import { GROQ_API_KEY, GROQ_MODEL } from '@/lib/constants'
import { cacheManager } from '@/lib/cache/cache-manager'
import { logger } from '@/lib/logging/logger'
import {
  selectModelFromCatalog,
  type ModelRequirement,
  type GroqModelInfo,
} from '@/lib/ai/model-selector'

const MODEL_CACHE_KEY = 'groq:models'
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const REQUEST_TIMEOUT_MS = 60_000
const MAX_RATE_LIMIT_RETRIES = 3
const MAX_TRANSIENT_RETRIES = 2
const BASE_BACKOFF_MS = 400
const MAX_BACKOFF_MS = 10_000
const MAX_RETRY_AFTER_MS = 15_000

let groqClient: Groq | null = null

/** Returns the shared server-side Groq client. */
export function getGroq(): Groq {
  if (!groqClient) {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured')
    }
    groqClient = new Groq({
      apiKey: GROQ_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0, // retries are handled here so Retry-After can be respected
    })
  }
  return groqClient
}

/**
 * Fetches the model catalog from Groq, cached server-side with a TTL.
 *
 * The catalog is the only source of truth about which models exist right now.
 * Nothing in this file hardcodes a belief that one model is permanently correct.
 */
export async function fetchModelCatalog(forceRefresh = false): Promise<GroqModelInfo[]> {
  if (!forceRefresh) {
    const cached = cacheManager.get<GroqModelInfo[]>(MODEL_CACHE_KEY)
    if (cached) return cached
  }

  const list = await getGroq().models.list()

  // The SDK's Model type is looser than the live response, which also carries
  // active, context_window, and max_completion_tokens. Reading through unknown
  // keeps this resilient to either shape without asserting a field exists.
  type RawModel = {
    id?: unknown
    active?: unknown
    context_window?: unknown
    max_completion_tokens?: unknown
  }

  const catalog: GroqModelInfo[] = []
  for (const entry of list.data ?? []) {
    const model = entry as RawModel
    if (model.active === false) continue
    if (typeof model.id !== 'string' || model.id.length === 0) continue

    catalog.push({
      id: model.id,
      contextWindow:
        typeof model.context_window === 'number' ? model.context_window : undefined,
      maxCompletionTokens:
        typeof model.max_completion_tokens === 'number'
          ? model.max_completion_tokens
          : undefined,
    })
  }

  if (catalog.length > 0) {
    cacheManager.set(MODEL_CACHE_KEY, catalog, MODEL_CACHE_TTL_MS)
  }
  return catalog
}

/**
 * Chooses a model for a request.
 *
 * Selection is driven by the live catalog plus the request's actual
 * requirements, not by a permanent winner. When the catalog cannot be reached
 * the configured GROQ_MODEL is used so the request can still be attempted, and
 * the createChatCompletion fallback path handles a rejection.
 */
export async function selectModelForRequest(
  requirement: ModelRequirement = {},
  forceRefresh = false
): Promise<string> {
  let catalog: GroqModelInfo[] = []
  try {
    catalog = await fetchModelCatalog(forceRefresh)
  } catch (error) {
    logger.warn('Failed to fetch Groq model list, using configured model', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  // GROQ_MODEL is the last resort when discovery failed or nothing in the
  // catalog is usable. If it is also rejected, createChatCompletion surfaces a
  // controlled error rather than looping.
  return selectModelFromCatalog(catalog, requirement, GROQ_MODEL) ?? GROQ_MODEL
}

/** Picks the next candidate after a failure, excluding the model that just failed. */
function pickFallbackModel(failedModel: string, catalog: GroqModelInfo[]): string | null {
  const preferred = selectModelFromCatalog(
    catalog,
    { exclude: [failedModel] },
    null
  )
  return preferred
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return undefined
}

function isRateLimitError(error: unknown): boolean {
  return getErrorStatus(error) === 429
}

function isModelUnavailableError(error: unknown): boolean {
  const status = getErrorStatus(error)
  const message = error instanceof Error ? error.message : ''
  return status === 404 || (status === 400 && /model/i.test(message))
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const status = getErrorStatus(error)
  if (status !== undefined) return status >= 500
  const name = error.name
  return (
    name === 'APIConnectionError' ||
    name === 'APIConnectionTimeoutError' ||
    name === 'InternalServerError' ||
    /fetch failed|network|timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(error.message)
  )
}

/** Respects Retry-After when provided, bounded so we never sleep indefinitely. */
function getRetryAfterMs(error: unknown): number | null {
  const headers = (error as { headers?: { get?: (name: string) => string | null } })?.headers
  const raw = headers?.get?.('retry-after')
  if (!raw) return null

  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
  }

  const date = new Date(raw).getTime()
  if (Number.isFinite(date)) {
    return Math.min(Math.max(0, date - Date.now()), MAX_RETRY_AFTER_MS)
  }
  return null
}

/** Exponential backoff with jitter, clamped to a maximum. */
function backoffDelay(attempt: number): number {
  const base = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
  const jitter = Math.random() * base * 0.5
  return base + jitter
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Bounded retries for rate limits and transient failures. Never retries forever. */
async function withRetries<T>(request: () => Promise<T>): Promise<T> {
  let rateLimitAttempts = 0
  let transientAttempts = 0

  for (;;) {
    try {
      return await request()
    } catch (error) {
      if (isRateLimitError(error)) {
        if (rateLimitAttempts >= MAX_RATE_LIMIT_RETRIES) throw error
        rateLimitAttempts++
        const delay = getRetryAfterMs(error) ?? backoffDelay(rateLimitAttempts)
        logger.warn('Groq rate limited, retrying', { attempt: rateLimitAttempts, delayMs: Math.round(delay) })
        await sleep(delay)
        continue
      }
      if (isTransientError(error)) {
        if (transientAttempts >= MAX_TRANSIENT_RETRIES) throw error
        transientAttempts++
        const delay = backoffDelay(transientAttempts)
        logger.warn('Groq transient error, retrying', { attempt: transientAttempts, delayMs: Math.round(delay) })
        await sleep(delay)
        continue
      }
      throw error
    }
  }
}

export interface ChatCompletionParams {
  model?: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  max_tokens?: number
}

/**
 * Centralized Groq chat completion with self-healing behavior:
 * - model selection from the live catalog against the request's requirements
 * - automatic model fallback (refresh catalog, pick next compatible, retry once)
 * - bounded retries for rate limits (Retry-After / backoff + jitter) and transient errors
 * - controlled failure when no recovery is possible
 */
export async function createChatCompletion(params: ChatCompletionParams) {
  const client = getGroq()
  const requirement: ModelRequirement = { maxOutputTokens: params.max_tokens }

  let model = params.model ?? (await selectModelForRequest(requirement))

  // At most 2 model attempts: the selected model, then the next suitable one.
  for (let modelAttempt = 0; modelAttempt < 2; modelAttempt++) {
    try {
      return await withRetries(() =>
        client.chat.completions.create({ ...params, model, stream: false })
      )
    } catch (error) {
      if (!isModelUnavailableError(error) || modelAttempt === 1) throw error

      let catalog: GroqModelInfo[] = []
      try {
        catalog = await fetchModelCatalog(true)
      } catch (refreshError) {
        logger.warn('Failed to refresh Groq model list', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        })
      }

      const fallback = pickFallbackModel(model, catalog)
      if (!fallback) throw error
      logger.warn('Groq model unavailable, switching model', { from: model, to: fallback })
      model = fallback
    }
  }

  throw new Error('Groq request failed')
}
