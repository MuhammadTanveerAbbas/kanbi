/**
 * OpenAI-compatible chat adapter.
 *
 * ## Why this shape
 *
 * Every serious open-weight runtime speaks the OpenAI chat completions wire
 * format. llama.cpp's `llama-server`, vLLM, Ollama, LM Studio, TGI, and the
 * hosted open-model gateways all expose `POST /v1/chat/completions` and
 * `GET /v1/models`. Implementing against that one format means Kanbi can run
 * against a self-hosted model today and a different one next month by editing
 * three environment variables, with no code change and no new dependency.
 *
 * Written against `fetch` rather than an SDK on purpose. A vendor SDK pins a
 * model list and a request shape at install time, which is exactly the coupling
 * this layer exists to avoid, and it would leave one provider named in a
 * dependency the application otherwise does not need.
 *
 * ## Streaming
 *
 * `stream` is supported at the transport level and the delta shape is decoded
 * here, so a caller that wants tokens as they arrive can ask for them without
 * this file changing. The chat route uses the buffered path today because
 * replies are short and need to be persisted whole; `streamCompletion` is
 * exported for the streaming route and is covered by the same adapter.
 */

import {
  AiProviderError,
  MAX_RETRY_AFTER_MS,
  asProviderError,
  type AiProvider,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResult,
  type ModelInfo,
} from './provider'

export interface OpenAiCompatibleConfig {
  /** Base URL without a trailing slash, e.g. `https://host/v1`. */
  baseUrl: string
  apiKey?: string
  /** Sent as `Authorization: Bearer` when present. Local runtimes ignore it. */
  headers?: Record<string, string>
  requestTimeoutMs: number
  listTimeoutMs: number
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly id: string

  constructor(
    private readonly config: OpenAiCompatibleConfig,
    id = 'openai-compatible',
  ) {
    this.id = id
  }

  isConfigured(): boolean {
    return this.config.baseUrl.trim().length > 0
  }

  async listModels(): Promise<ModelInfo[]> {
    const body = await this.request('/models', { method: 'GET' }, this.config.listTimeoutMs)
    const raw = body as { data?: unknown; models?: unknown }

    // Two shapes are recognised: the OpenAI `{ data: [...] }` and the
    // `{ models: [...] }` some gateways use. A bare top-level array is
    // deliberately NOT treated as a list of names, because it is ambiguous: an
    // error payload and a model list look the same at that level, and guessing
    // wrong means selecting a model that was never offered. An unrecognised
    // shape returns empty, which the registry treats as a discovery failure and
    // answers with the configured default instead. That is a truthful outcome.
    const list: unknown[] = Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.models)
        ? raw.models
        : []

    const models: ModelInfo[] = []
    for (const entry of list) {
      // Inside a recognised envelope, a bare string is unambiguously a model
      // name. llama.cpp and LM Studio both list this way.
      if (typeof entry === 'string') {
        if (entry.length > 0) models.push({ id: entry })
        continue
      }
      if (!entry || typeof entry !== 'object') continue

      const asRecord = entry as {
        id?: unknown
        name?: unknown
        context_window?: unknown
        context_length?: unknown
        max_completion_tokens?: unknown
        owned_by?: unknown
      }
      const id =
        typeof asRecord.id === 'string'
          ? asRecord.id
          : typeof asRecord.name === 'string'
            ? asRecord.name
            : undefined
      if (!id || id.length === 0) continue

      models.push({
        id,
        contextWindow: firstNumber(asRecord.context_window, asRecord.context_length),
        maxOutputTokens: firstNumber(asRecord.max_completion_tokens),
        tags: typeof asRecord.owned_by === 'string' ? [asRecord.owned_by] : undefined,
      })
    }
    return models
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (!request.model) {
      throw new AiProviderError('No model supplied to the provider', 'model_not_found')
    }

    const body = (await this.request(
      '/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: false,
          ...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
          ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
        }),
      },
      this.config.requestTimeoutMs,
      request.signal,
    )) as {
      model?: string
      choices?: Array<{ message?: { content?: string | null } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }

    const content = body.choices?.[0]?.message?.content?.trim() ?? ''
    if (!content) {
      // An empty completion is a provider or model fault, not an empty answer.
      // The caller needs to be able to tell those apart to decide on a retry.
      throw new AiProviderError(
        `Model ${request.model} returned an empty completion`,
        'transient',
      )
    }

    return {
      model: body.model ?? request.model,
      content,
      promptTokens: body.usage?.prompt_tokens,
      completionTokens: body.usage?.completion_tokens,
      totalTokens: body.usage?.total_tokens,
    }
  }

  /**
   * Yields content deltas as the model produces them.
   *
   * The wire format is Server-Sent Events, so this reads the response body as a
   * stream and splits on the blank line that terminates each event, pulling the
   * `data:` payload and discarding the `[DONE]` sentinel. A server that ignores
   * `stream: true` and returns one JSON object is also handled, which is what
   * some minimal runtimes do.
   */
  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string> {
    if (!request.model) {
      throw new AiProviderError('No model supplied to the provider', 'model_not_found')
    }

    // A stream can legitimately run for a while, so it is not held to the
    // request timeout. The connection is bounded by the caller's signal, which
    // the route aborts when the client disconnects.
    const { signal: linked, done: releaseSignal } = linkSignals(request.signal, this.config.requestTimeoutMs * 5)

    const response = await this.fetch('/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: true,
        ...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
      }),
      signal: linked,
    })
      .catch((error: unknown) => {
        releaseSignal()
        throw asProviderError(error)
      })

    if (!response.ok || !response.body) {
      releaseSignal()
      const text = await response.text().catch(() => '')
      throw new AiProviderError(
        text || `Streaming request failed with ${response.status}`,
        response.status === 429
          ? 'rate_limited'
          : response.status === 404
            ? 'model_not_found'
            : response.status >= 500
              ? 'transient'
              : 'unknown',
        response.status,
        retryAfterMs(response),
      )
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Events are separated by a blank line, which may arrive split across
        // chunks, so only complete events are consumed and the remainder stays
        // in the buffer.
        const parts = buffer.split(/\n\n/)
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const delta = parseSseDelta(part)
          if (delta === DONE) return
          if (delta) yield delta
        }
      }

      const tail = parseSseDelta(buffer)
      if (tail && tail !== DONE) yield tail
    } finally {
      // Releasing the lock lets an aborted request tear the connection down
      // rather than leaving the socket open.
      reader.releaseLock()
      releaseSignal()
    }
  }

  /** One place that knows how to talk HTTP, so error mapping is not repeated. */
  private async request(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { signal: linked, done } = linkSignals(signal, timeoutMs)
    try {
      const response = await this.fetch(path, { ...init, signal: linked }).catch(
        (error: unknown) => {
          throw asProviderError(error)
        },
      )

      const text = await response.text()

      if (!response.ok) {
        // The body carries the useful part, e.g. which model is unknown, so it
        // is folded into the message rather than discarded.
        //
        // `Retry-After` is read here rather than in `asProviderError`, because
        // that function classifies an error object and this is a real `Response`.
        // Without it the facade falls back to exponential backoff on every rate
        // limit, which ignores a server that told it exactly how long to wait.
        throw new AiProviderError(
          `${this.id}: ${response.status} ${text.slice(0, 400)}`.trim(),
          response.status === 401 || response.status === 403
            ? 'auth'
            : response.status === 429
              ? 'rate_limited'
              : response.status === 404
                ? 'model_not_found'
                : response.status >= 500
                  ? 'transient'
                  : 'unknown',
          response.status,
          retryAfterMs(response),
        )
      }

      try {
        return JSON.parse(text)
      } catch {
        throw new AiProviderError(`${this.id}: response was not JSON`, 'transient')
      }
    } finally {
      done()
    }
  }

  private fetch(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}${path}`
    return fetch(url, {
      ...init,
      headers: {
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        ...this.config.headers,
        ...(init.headers ?? {}),
      },
    })
  }
}

const DONE = Symbol('stream-done')

/**
 * A signal that aborts when either the caller's signal or a timer fires.
 *
 * `AbortSignal.timeout` is the obvious choice and it is wrong in two ways here.
 * It is not available on older runtimes, and more subtly it builds a signal
 * from the *global* `AbortSignal` constructor, which under a test environment
 * that polyfills globals is not the class the HTTP client validates against. The
 * result is a hard "Expected signal to be an instance of AbortSignal" rejection
 * before a single byte is sent, which reads like a transport fault and is not
 * one. The same availability argument rules out `AbortSignal.any`.
 *
 * `done` clears the timer and detaches the listener, so a long-lived caller
 * signal does not accumulate one handler per request.
 */
function linkSignals(
  caller: AbortSignal | undefined,
  ms: number,
): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController()

  const timer = setTimeout(() => controller.abort(), ms)
  // Node keeps the process alive for a pending timer. A request that has already
  // finished should not hold the event loop open for the rest of its timeout.
  if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
    ;(timer as unknown as { unref: () => void }).unref()
  }

  const onAbort = () => controller.abort()
  if (caller) {
    if (caller.aborted) controller.abort()
    else caller.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer)
      caller?.removeEventListener('abort', onAbort)
    },
  }
}

/**
 * Reads one SSE event and returns the text delta, the DONE sentinel, or null.
 *
 * Returns null for comments, keep-alive pings, and events with no choices, all
 * of which are legal in the stream and none of which should surface as text.
 */
function parseSseDelta(event: string): string | typeof DONE | null {
  const data = event
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('')

  if (!data) return null
  if (data === '[DONE]') return DONE

  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string | null } }>
    }
    return parsed.choices?.[0]?.delta?.content ?? null
  } catch {
    return null
  }
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

/**
 * Reads `Retry-After` from a real response, in either permitted form: seconds
 * or an HTTP date. Bounded by `MAX_RETRY_AFTER_MS`, because a server sending an
 * hour-long value would otherwise hold a request open past any reasonable
 * budget.
 */
function retryAfterMs(response: Response): number | undefined {
  // Defensive on `headers`. A hand-rolled `Response` substitute in a test, or a
  // runtime that returns a minimal object, will not carry them, and a missing
  // header is not an error worth throwing over.
  const raw = response.headers?.get?.('retry-after')
  if (!raw) return undefined

  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS)
  }

  const date = new Date(raw).getTime()
  if (Number.isFinite(date)) {
    return Math.min(Math.max(0, date - Date.now()), MAX_RETRY_AFTER_MS)
  }
  return undefined
}

/** Re-exported so callers do not need to reach into the provider module. */
export type { ChatMessage, CompletionRequest, CompletionResult, ModelInfo }
