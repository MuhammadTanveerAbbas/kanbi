/**
 * AI configuration.
 *
 * ## The contract
 *
 * The application never names a vendor. It names an endpoint. Anything that
 * speaks the OpenAI chat completions format and publishes `GET /v1/models` can
 * serve Kanbi: llama.cpp's `llama-server`, vLLM, Ollama, LM Studio, TGI, or a
 * hosted open-weight gateway.
 *
 * Switching runtime, or moving to a new open-weight model, is a change to these
 * three values and nothing else:
 *
 *   AI_BASE_URL   where the runtime is
 *   AI_API_KEY    optional, ignored by local runtimes
 *   AI_MODEL      optional pin, overrides preference entirely
 *
 * ## Why there is no default base URL
 *
 * A sensible-looking default would be a hosted vendor's URL, which is exactly
 * the coupling being removed. With nothing configured, `provider()` returns
 * null, every AI route reports that inference is not configured, and the
 * deterministic parts of the product still work. That is a truthful state.
 */

export interface AiSettings {
  /** Base URL of an OpenAI-compatible runtime, without a trailing slash. */
  baseUrl: string
  apiKey: string
  /** Operator pin for a specific model id. Empty means "choose automatically". */
  defaultModel: string
  requestTimeoutMs: number
  listTimeoutMs: number
}

const DEFAULTS = {
  baseUrl: '',
  apiKey: '',
  defaultModel: '',
  requestTimeoutMs: 60_000,
  listTimeoutMs: 10_000,
} as const

/**
 * A last-resort model id.
 *
 * Only reached when the catalog cannot be fetched. It is a preference, not a
 * claim: if the runtime does not serve it, the request fails cleanly rather
 * than looping. The name is a family rather than a pinned build so a compatible
 * runtime with a differently tagged quantisation still matches it.
 */
export const DEFAULT_AI_MODEL = 'llama-3.3-70b'

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function aiSettings(): AiSettings {
  return {
    baseUrl: (process.env.AI_BASE_URL ?? DEFAULTS.baseUrl).trim(),
    apiKey: (process.env.AI_API_KEY ?? DEFAULTS.apiKey).trim(),
    // `AI_DEFAULT_MODEL` is the explicit name. `AI_MODEL` is accepted as a
    // shorter alias because it reads naturally in a `.env` and because it is
    // already how several runtimes name their own pin.
    defaultModel: (
      process.env.AI_DEFAULT_MODEL ?? process.env.AI_MODEL ?? DEFAULTS.defaultModel
    ).trim(),
    requestTimeoutMs: readNumber('AI_REQUEST_TIMEOUT_MS', DEFAULTS.requestTimeoutMs),
    listTimeoutMs: readNumber('AI_LIST_TIMEOUT_MS', DEFAULTS.listTimeoutMs),
  }
}
