import { describe, it, expect } from 'vitest'
import {
  selectModelFromCatalog,
  type GroqModelInfo,
} from '@/lib/ai/model-selector'

const m = (
  id: string,
  maxCompletionTokens?: number,
  contextWindow?: number
): GroqModelInfo => ({ id, maxCompletionTokens, contextWindow })

describe('selectModelFromCatalog', () => {
  it('picks the highest preference model that is present', () => {
    const catalog = [m('llama-3.1-8b-instant'), m('llama-3.3-70b-versatile')]
    expect(selectModelFromCatalog(catalog, {}, 'fallback')).toBe('llama-3.3-70b-versatile')
  })

  it('never selects a model the provider has retired', () => {
    // These three were shut down by Groq. A stale cached catalog can still list
    // them, so selection must reject them on its own.
    const catalog = [
      m('gemma2-9b-it', 8192),
      m('mixtral-8x7b-32768', 32768),
      m('llama-3.3-70b-versatile', 32768),
    ]
    expect(selectModelFromCatalog(catalog, {}, 'fallback')).toBe('llama-3.3-70b-versatile')
  })

  it('does not select audio or moderation models for chat', () => {
    const catalog = [
      m('whisper-large-v3'),
      m('openai/gpt-oss-safeguard-20b', 65536),
      m('llama-3.3-70b-versatile', 32768),
    ]
    expect(selectModelFromCatalog(catalog, {}, 'fallback')).toBe('llama-3.3-70b-versatile')
  })

  it('rejects a model that cannot produce the requested output length', () => {
    const catalog = [m('small-model', 4096), m('llama-3.3-70b-versatile', 32768)]
    const chosen = selectModelFromCatalog(catalog, { maxOutputTokens: 2048 }, 'fallback')
    expect(chosen).not.toBe('small-model')
  })

  it('rejects every model when none can satisfy the requirement, using the fallback', () => {
    const catalog = [m('tiny-model', 512)]
    expect(selectModelFromCatalog(catalog, { maxOutputTokens: 32768 }, 'fallback')).toBe('fallback')
  })

  it('rejects a model whose context window is too small', () => {
    const catalog = [m('narrow', 32768, 8192), m('wide', 32768, 131072)]
    const chosen = selectModelFromCatalog(catalog, { contextWindow: 100000 }, 'fallback')
    expect(chosen).toBe('wide')
  })

  it('honors the exclude list when retrying after a rejection', () => {
    const catalog = [m('llama-3.3-70b-versatile', 32768), m('llama-3.1-8b-instant', 131072)]
    const chosen = selectModelFromCatalog(catalog, { exclude: ['llama-3.3-70b-versatile'] }, null)
    expect(chosen).toBe('llama-3.1-8b-instant')
  })

  it('returns null when the catalog is empty and no fallback is supplied', () => {
    expect(selectModelFromCatalog([], {}, null)).toBeNull()
  })

  it('returns null when the only candidates are excluded', () => {
    const catalog = [m('llama-3.3-70b-versatile')]
    expect(selectModelFromCatalog(catalog, { exclude: ['llama-3.3-70b-versatile'] }, null)).toBeNull()
  })

  it('degrades to the fallback when the catalog could not be loaded', () => {
    expect(selectModelFromCatalog([], {}, 'configured-model')).toBe('configured-model')
  })

  it('treats an unknown limit as unknown rather than zero', () => {
    // The catalog omits max_completion_tokens. The model must still be eligible
    // rather than being rejected for a limit that was never reported.
    const catalog = [{ id: 'unknown-limits' }]
    expect(selectModelFromCatalog(catalog, { maxOutputTokens: 2048 }, 'fallback')).toBe(
      'unknown-limits'
    )
  })

  it('is deterministic for equally ranked models', () => {
    const catalog = [m('zzz-unlisted', 32768), m('aaa-unlisted', 32768)]
    const first = selectModelFromCatalog(catalog, {}, 'fallback')
    const second = selectModelFromCatalog([...catalog].reverse(), {}, 'fallback')
    expect(first).toBe(second)
  })

  it('prefers more headroom when two models are equally preferred', () => {
    // Both unlisted, so preference rank ties. The one with more output room wins.
    const catalog = [m('small-unlisted', 8192), m('large-unlisted', 65536)]
    expect(selectModelFromCatalog(catalog, {}, 'fallback')).toBe('large-unlisted')
  })

  it('prefers a preferred model over an unlisted one even with less headroom', () => {
    const catalog = [m('unlisted-huge', 131072), m('llama-3.3-70b-versatile', 32768)]
    expect(selectModelFromCatalog(catalog, {}, 'fallback')).toBe('llama-3.3-70b-versatile')
  })
})
