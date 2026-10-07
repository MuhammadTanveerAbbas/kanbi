/**
 * The AI service facade.
 *
 * This is the single entry point for inference. It owns the provider, the
 * selection, the retry policy, and the model rotation. Callers pass messages and
 * get text back; they do not know a model id, a base URL, or a vendor exists.
 *
 * ## Layering
 *
 * ```
 * route / service        calls complete()
 *      ↓
 * this facade            retries, model rotation, timeout policy
 *      ↓
 * model registry         discovery, cache, fallback candidate
 *      ↓
 * provider adapter       HTTP, wire format, error classification
 *      ↓
 * open-weight runtime    whatever is actually serving
 * ```
 *
 * Each layer only knows the one beneath it. That is what lets the runtime, and
 * therefore the available models, change without touching a caller.
 *
 * ## Self-healing
 *
 * A request is attempted against the selected model. If the runtime says that
 * model no longer exists, the catalog is refreshed and the next compatible
 * candidate is tried once. Rate limits are retried with `Retry-After` honoured,
 * transient failures with bounded exponential backoff and jitter. Everything
 * else fails immediately, because retrying a 401 or a validation error just
 * spends the user's time.
 *
 * Rotation is capped at two models on purpose. If two candidates both fail, the
 * problem is the provider, not the model, and continuing would turn one failure
 * into several.
 */

import { logger } from '@/lib/logging/logger'
import { aiSettings } from '@/lib/ai/config'
import { OpenAiCompatibleProvider } from '@/lib/ai/openai-compatible-provider'
import { pickFallbackModel, selectModelForRequest } from '@/lib/ai/model-registry'
import {
  AiProviderError,
  MAX_RETRY_AFTER_MS,
  asProviderError,
  type AiProvider,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResult,
} from '@/lib/ai/provider'

const MAX_RATE_LIMIT_RETRIES = 3
const MAX_TRANSIENT_RETRIES = 2
const BASE_BACKOFF_MS = 400
const MAX_BACKOFF_MS = 10_000

let providerInstance: AiProvider | null = null

/**
 * The shared provider.
 *
 * Returns null when no runtime is configured, which is a supported state: the
 * deterministic parts of the product work without inference, and the routes
 * report it rather than crashing.
 */
export function getProvider(): AiProvider | null {
  if (providerInstance) return providerInstance

  const { baseUrl, apiKey, requestTimeoutMs, listTimeoutMs } = aiSettings()
  if (!baseUrl) return null

  providerInstance = new OpenAiCompatibleProvider(
    { baseUrl, apiKey, requestTimeoutMs, listTimeoutMs },
    'openai-compatible',
  )
  return providerInstance
}

/** True when inference is configured and a runtime is reachable in principle. */
export function isInferenceConfigured(): boolean {
  return getProvider() !== null
}

/** Test seam. Replaces the memoized provider. */
export function setProvider(provider: AiProvider | null): void {
  providerInstance = provider
}

export interface CompleteOptions {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  /** Overrides model selection entirely. */
  model?: string
  signal?: AbortSignal
}

/**
 * Runs a chat completion, selecting and rotating models as needed.
 *
 * @throws {AiProviderError} when inference is unconfigured or every attempt
 *   fails. Callers decide how to present that; nothing here silently returns an
 *   empty string, because an empty answer and a failed answer are different
 *   things to a user.
 */
export async function complete(options: CompleteOptions): Promise<CompletionResult> {
  const provider = getProvider()
  if (!provider) {
    throw new AiProviderError(
      'No AI runtime is configured. Set AI_BASE_URL to an OpenAI-compatible endpoint.',
      'unavailable',
    )
  }

  const request: CompletionRequest = {
    messages: options.messages,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    model: options.model,
    signal: options.signal,
  }

  // A caller-supplied model still gets the rotation treatment, because a pinned
  // id is exactly the thing most likely to have been withdrawn.
  let model = options.model ?? (await selectModelForRequest(provider, { maxOutputTokens: options.maxTokens }))

  // At most 2 model attempts: the selected one, then the next compatible.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withRetries(() => provider.complete({ ...request, model }))
    } catch (error) {
      const failure = asProviderError(error)

      // An abort is the caller cancelling, not a model problem. Never rotate.
      if (failure.kind === 'aborted') throw failure
      if (!failure.isModelProblem || attempt === 1) throw failure

      const fallback = await pickFallbackModel(provider, model)
      if (!fallback) throw failure

      logger.warn('Model unavailable, rotating', { from: model, to: fallback })
      model = fallback
    }
  }

  throw new AiProviderError('Every candidate model failed', 'unavailable')
}

/**
 * Streaming completion against the selected model.
 *
 * Yields content deltas. Selection happens once, before the first token, so the
 * caller can put the model in a response header and log which one answered.
 */
export async function* stream(options: CompleteOptions): AsyncGenerator<string> {
  const provider = getProvider()
  if (!provider) {
    throw new AiProviderError(
      'No AI runtime is configured. Set AI_BASE_URL to an OpenAI-compatible endpoint.',
      'unavailable',
    )
  }
  if (!(provider instanceof OpenAiCompatibleProvider)) {
    throw new AiProviderError(
      `Provider ${provider.id} does not support streaming`,
      'unavailable',
    )
  }

  const model =
    options.model ??
    (await selectModelForRequest(provider, { maxOutputTokens: options.maxTokens }))

  yield* provider.streamCompletion({ ...options, model })
}

/** Bounded retries for rate limits and transient failures. Never retries forever. */
async function withRetries<T>(request: () => Promise<T>): Promise<T> {
  let rateLimitAttempts = 0
  let transientAttempts = 0

  for (;;) {
    try {
      return await request()
    } catch (error) {
      const failure = asProviderError(error)

      if (failure.kind === 'rate_limited') {
        if (rateLimitAttempts >= MAX_RATE_LIMIT_RETRIES) throw failure
        rateLimitAttempts++
        const delay = failure.retryAfterMs ?? backoffDelay(rateLimitAttempts)
        logger.warn('Provider rate limited, retrying', {
          attempt: rateLimitAttempts,
          delayMs: Math.round(delay),
        })
        await sleep(delay)
        continue
      }

      if (failure.kind === 'transient') {
        if (transientAttempts >= MAX_TRANSIENT_RETRIES) throw failure
        transientAttempts++
        const delay = backoffDelay(transientAttempts)
        logger.warn('Provider transient error, retrying', {
          attempt: transientAttempts,
          delayMs: Math.round(delay),
        })
        await sleep(delay)
        continue
      }

      throw failure
    }
  }
}

/** Exponential backoff with jitter, clamped to a maximum. */
function backoffDelay(attempt: number): number {
  const base = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
  return base + Math.random() * base * 0.5
}

/** Bounded so a hostile or misconfigured `Retry-After` cannot stall a request. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.min(ms, MAX_RETRY_AFTER_MS)))
}
