import { describe, it, expect } from 'vitest'
import { extractJsonArray } from '@/lib/ai-service'

describe('extractJsonArray', () => {
  it('parses a clean JSON array', () => {
    expect(extractJsonArray('[{"title":"A"}]')).toEqual([{ title: 'A' }])
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n[{"title":"A"},{"title":"B"}]\n```'
    expect(extractJsonArray(raw)).toEqual([{ title: 'A' }, { title: 'B' }])
  })

  it('strips reasoning <think> tags that some models emit', () => {
    const raw = '<think>Let me analyze this...</think>\n[{"title":"A"}]'
    expect(extractJsonArray(raw)).toEqual([{ title: 'A' }])
  })

  it('strips a leading "thinking:" block', () => {
    const raw = 'thinking:\n1. parse tasks\n2. extract\n[{"title":"A"}]'
    expect(extractJsonArray(raw)).toEqual([{ title: 'A' }])
  })

  it('returns empty array for prose without an array', () => {
    expect(extractJsonArray('Here is a summary of the tasks.')).toEqual([])
  })

  it('handles arrays containing escaped quotes and strings', () => {
    const raw = '[{"title":"he said \\"hi\\"","note":"a, b, c"}]'
    expect(extractJsonArray(raw)).toEqual([{ title: 'he said "hi"', note: 'a, b, c' }])
  })

  it('returns empty for empty input', () => {
    expect(extractJsonArray('')).toEqual([])
  })
})
