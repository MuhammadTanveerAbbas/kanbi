import Groq from 'groq-sdk'
import { GROQ_API_KEY, GROQ_MODEL } from '@/lib/constants'
import { cacheManager } from '@/lib/cache/cache-manager'
import { logger } from '@/lib/logging/logger'

const MODEL_CACHE_KEY = 'groq:models'
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const REQUEST_TIMEOUT_MS = 60_000
const MAX_RATE_LIMIT_RETRIES = 3
const MAX_TRANSIENT_RETRIES = 2
const BASE_BACKOFF_MS = 400
const MAX_BACKOFF_MS = 10_000
const MAX_RETRY_AFTER_MS = 15_000

/** Preferred chat models in deterministic order. The first available one wins. */
const MODEL_PREFERENCES = [
  GROQ_MODEL,
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

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

/** Fetches the available model list from Groq, cached server-side with a TTL. */
async function fetchAvailableModels(forceRefresh: boolean): Promise<string[]> {
  if (!forceRefresh) {
    const cached = cacheManager.get<string[]>(MODEL_CACHE_KEY)
    if (cached) return cached
  }

  const list = await getGroq().models.list()
  const ids = (list.data ?? [])
    // runtime tolerance for deprecated models the SDK type does not expose
    .filter((model) => (model as { active?: boolean }).active !== false)
    .map((model) => model.id)
    .filter((id): id is string => Boolean(id))

  if (ids.length > 0) {
    cacheManager.set(MODEL_CACHE_KEY, ids, MODEL_CACHE_TTL_MS)
  }
  return ids
}

/**
 * Selects a model deterministically: the preferred model first, then known
 * compatible candidates, then the first available model. When discovery fails,
 * degrades to the preferred model so requests can still be attempted.
 */
export async function selectModel(forceRefresh = false): Promise<string> {
  let available: string[] = []
  try {
    available = await fetchAvailableModels(forceRefresh)
  } catch (error) {
    logger.warn('Failed to fetch Groq model list, using preferred model', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  for (const candidate of MODEL_PREFERENCES) {
    if (available.includes(candidate)) return candidate
  }
  if (available.length > 0) return available[0] ?? GROQ_MODEL
  return GROQ_MODEL
}

/** Picks the next deterministic candidate, excluding the failed model. */
function pickFallbackModel(failedModel: string, available: string[]): string | null {
  const candidates =
    available.length > 0
      ? MODEL_PREFERENCES.filter((m) => available.includes(m))
      : MODEL_PREFERENCES
  return candidates.find((m) => m !== failedModel) ?? null
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
 * - model discovery (cached) with deterministic selection
 * - automatic model fallback (refresh list, pick next compatible, retry once)
 * - bounded retries for rate limits (Retry-After / backoff + jitter) and transient errors
 * - controlled failure when no recovery is possible
 */
export async function createChatCompletion(params: ChatCompletionParams) {
  const client = getGroq()
  let model = params.model ?? (await selectModel())

  // At most 2 model attempts: preferred model, then the next suitable one.
  for (let modelAttempt = 0; modelAttempt <= 1; modelAttempt++) {
    try {
      return await withRetries(() =>
        client.chat.completions.create({ ...params, model, stream: false })
      )
    } catch (error) {
      if (!isModelUnavailableError(error) || modelAttempt === 1) throw error

      let available: string[] = []
      try {
        available = await fetchAvailableModels(true)
      } catch (refreshError) {
        logger.warn('Failed to refresh Groq model list', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        })
      }

      const fallback = pickFallbackModel(model, available)
      if (!fallback) throw error
      logger.warn('Groq model unavailable, switching model', { from: model, to: fallback })
      model = fallback
    }
  }

  throw new Error('Groq request failed')
}