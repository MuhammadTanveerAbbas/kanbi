/**
 * The provider contract.
 *
 * Everything above this file talks to `AiProvider` and nothing above it knows
 * what a model is or who serves it. That is the whole point: the model layer can
 * be repointed, a new adapter added, or the available models change on the
 * provider's side, and no application code moves.
 *
 * Deliberately not a full chat SDK. Four methods is what the product actually
 * uses, and every extra abstraction here would be a thing to keep in sync with
 * a vendor's API for no benefit.
 */

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface CompletionRequest {
  messages: ChatMessage[]
  /** Hard cap on generated tokens. The model selector treats this as a requirement. */
  maxTokens?: number
  temperature?: number
  /** Overrides selection entirely. Used by tests and by the fallback path. */
  model?: string
  signal?: AbortSignal
}

export interface CompletionResult {
  model: string
  content: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface ModelInfo {
  id: string
  /** Context window in tokens, when the provider reports it. */
  contextWindow?: number
  /** Maximum generated tokens, when the provider reports it. */
  maxOutputTokens?: number
  /** Free-form tags from the provider, used for capability hints. */
  tags?: string[]
}

/**
 * Upper bound on an honoured `Retry-After`.
 *
 * Shared so the adapter, which reads the header off a `Response`, and the facade,
 * which bounds its own backoff, agree on the same ceiling. Two different limits
 * would mean the effective wait depends on which code path saw the header.
 */
export const MAX_RETRY_AFTER_MS = 15_000

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly kind:
      | 'unavailable'
      | 'rate_limited'
      | 'transient'
      | 'model_not_found'
      | 'auth'
      | 'aborted'
      | 'unknown',
    readonly status?: number,
    readonly retryAfterMs?: number,
  ) {
    super(message)
    this.name = 'AiProviderError'
  }

  /** True when a different model might still succeed. */
  get isModelProblem(): boolean {
    return this.kind === 'model_not_found'
  }

  /** True when retrying the same request could plausibly work. */
  get isRetryable(): boolean {
    return this.kind === 'rate_limited' || this.kind === 'transient'
  }
}

export interface AiProvider {
  /** Stable identifier, used in logs and in the `x-kanbi-model` response header. */
  readonly id: string

  /**
   * Every model this provider will currently serve.
   *
   * This is the real discovery mechanism, not a hardcoded list. A provider that
   * publishes an OpenAI-compatible `GET /v1/models` will reflect a new release
   * the day it ships, with no code change here.
   */
  listModels(): Promise<ModelInfo[]>

  complete(request: CompletionRequest): Promise<CompletionResult>

  /** False when no credentials or endpoint are configured. */
  isConfigured(): boolean
}

/** Anything that is not an `AiProviderError` is inspected with this. */
export function asProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error

  const status = readStatus(error)
  const message = error instanceof Error ? error.message : String(error)

  if (error instanceof Error && error.name === 'AbortError') {
    return new AiProviderError(message, 'aborted')
  }
  if (status === 401 || status === 403) {
    return new AiProviderError(message, 'auth', status)
  }
  if (status === 429) {
    return new AiProviderError(message, 'rate_limited', status, readRetryAfterMs(error))
  }
  if (status === 404 || (status === 400 && /\bmodel\b/i.test(message))) {
    return new AiProviderError(message, 'model_not_found', status)
  }
  if (status !== undefined && status >= 500) {
    return new AiProviderError(message, 'transient', status)
  }
  if (/fetch failed|network|timeout|econnreset|enotfound|eai_again|socket/i.test(message)) {
    return new AiProviderError(message, 'transient')
  }
  return new AiProviderError(message, 'unknown', status)
}

function readStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return undefined
}

function readRetryAfterMs(error: unknown): number | undefined {
  const headers = (error as { headers?: { get?: (name: string) => string | null } })?.headers
  const raw = headers?.get?.('retry-after')
  if (!raw) return undefined

  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000

  const date = new Date(raw).getTime()
  if (Number.isFinite(date)) return Math.max(0, date - Date.now())
  return undefined
}
