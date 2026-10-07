/**
 * Model preference metadata.
 *
 * ## What this is for
 *
 * Selection is driven by the provider's live catalog (see `model-selector.ts`),
 * not by a list of model ids hardcoded into the request path. So this file is
 * deliberately *not* the source of truth about what exists. It is a ranking
 * hint: "when several models in the catalog can do this job, prefer the one
 * that looks like this."
 *
 * The practical consequence is that adding a new open-weight model, or losing
 * one, requires no change here at all. It only needs to be published by the
 * runtime, and it will be discovered. This file exists so that when two models
 * are both acceptable, the product consistently picks the one it prefers rather
 * than picking alphabetically.
 *
 * Entries are matched as substrings against the model id, so `qwen3` matches
 * `qwen/qwen3-32b`, which is how these gateways namespace their weights.
 *
 * ## How to change the default
 *
 * `AI_MODEL` in the environment overrides everything. It is the escape hatch
 * for pinning a specific model during an incident or a regression test.
 */

export interface ModelProfile {
  /**
   * Lower is better. Only relative order matters.
   *
   * The gaps are deliberate: a model at 10 is genuinely preferred over one at
   * 20, and the selector falls back to capability and then alphabetical order
   * for anything unlisted, so adding a model nobody profiled does not push it
   * ahead of one that was.
   */
  priority: number
  /**
   * Substrings that identify this family. Matched case-insensitively against
   * the model id. An empty list means "matches nothing" and is used for the
   * catch-all entry.
   */
  match: string[]
  /** Human readable, for logs and the health endpoint. */
  label: string
  /**
   * Assumed context window, used only when the catalog does not report one.
   * A server that omits the field should not make every model look unusable.
   */
  contextWindow?: number
  /** Assumed output cap, used only when the catalog does not report one. */
  maxOutputTokens?: number
}

/**
 * Order matters: the first profile whose `match` list hits a given model id wins.
 * Later entries act as progressively weaker fallbacks for the same family.
 */
export const MODEL_PROFILES: readonly ModelProfile[] = [
  {
    priority: 10,
    match: ['gpt-oss-120b', 'gpt-oss-20b'],
    label: 'OpenAI gpt-oss',
    contextWindow: 131072,
    maxOutputTokens: 32768,
  },
  {
    priority: 20,
    match: ['qwen3', 'qwen-3'],
    label: 'Qwen 3',
    contextWindow: 131072,
    maxOutputTokens: 32768,
  },
  {
    priority: 30,
    match: ['llama-4', 'llama4'],
    label: 'Llama 4',
    contextWindow: 131072,
    maxOutputTokens: 16384,
  },
  {
    priority: 40,
    match: ['llama-3.3-70b', 'llama-3.3-8b', 'llama-3.1-70b', 'llama-3.1-8b'],
    label: 'Llama 3.x',
    contextWindow: 131072,
    maxOutputTokens: 8192,
  },
  {
    priority: 50,
    match: ['deepseek-v3', 'deepseek-r1', 'deepseek'],
    label: 'DeepSeek',
    contextWindow: 65536,
    maxOutputTokens: 8192,
  },
  {
    priority: 60,
    match: ['mistral-nemo', 'mixtral', 'ministral'],
    label: 'Mistral',
    contextWindow: 32768,
    maxOutputTokens: 8192,
  },
  {
    priority: 70,
    match: ['gemma-3', 'gemma3', 'gemma-2', 'gemma2'],
    label: 'Gemma',
    contextWindow: 8192,
    maxOutputTokens: 4096,
  },
  {
    priority: 80,
    match: ['phi-4', 'phi-3', 'phi4', 'phi3'],
    label: 'Phi',
    contextWindow: 16384,
    maxOutputTokens: 4096,
  },
  {
    priority: 90,
    match: ['llama', 'nemotron', 'olmo', 'smol', 'granite', 'exaone', 'internlm'],
    label: 'General open weight',
    contextWindow: 8192,
    maxOutputTokens: 4096,
  },
] as const

/**
 * Models that cannot serve a chat completion, whatever the catalog says.
 *
 * Matched as substrings, so a family prefix covers its sizes. Embedding, audio,
 * reranking, and moderation endpoints are all real models on these runtimes and
 * none of them can answer a prompt.
 */
export const NON_CHAT_PATTERNS: readonly RegExp[] = [
  /whisper|whisper-large/i,
  /tts|orpheus|parler|playai|speech/i,
  /embed|embedding|bge-|e5-|gte-|retriev/i,
  /guard|safeguard|moderation|classifier/i,
  /rerank|reranker/i,
] as const

/**
 * Ids that were withdrawn from their runtime.
 *
 * A cached catalog can outlive a withdrawal, and a stale id would be selected
 * and then fail the request. Listing them here turns that into a selection-time
 * skip instead of a runtime error. This is a denylist of the past, not a
 * prediction about the future, which is the difference between this and
 * `MODEL_PROFILES`.
 */
export const RETIRED_MODEL_PATTERNS: readonly RegExp[] = [
  /gemma2-9b-it$/i,
  /gemma-7b-it$/i,
  /mixtral-8x7b-32768$/i,
  /llama3-(70b|8b)-8192$/i,
  /llama-3\.1-70b-versatile$/i,
  /llama-3\.2-1b-preview$/i,
  /mistral-saba-24b$/i,
  /qwen-qwq-32b$/i,
  /llama-guard-3-8b$/i,
] as const
