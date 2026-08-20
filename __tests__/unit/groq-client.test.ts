import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createChatCompletion, selectModel } from '@/lib/ai/groq-client'
import { cacheManager } from '@/lib/cache/cache-manager'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
}))

vi.mock('groq-sdk', () => ({
  default: vi.fn(() => ({
    chat: { completions: { create: mocks.create } },
    models: { list: mocks.list },
  })),
}))

const PREFERRED = 'llama-3.3-70b-versatile'
const FALLBACK = 'llama-3.1-8b-instant'

const successfulCompletion = () => ({
  choices: [{ message: { content: '[{"title":"A"}]' } }],
  model: PREFERRED,
})

const groqError = (status: number, message: string, headers?: Record<string, string>) =>
  Object.assign(new Error(message), {
    status,
    headers: {
      get: (name: string) => headers?.[name] ?? null,
    },
  })

describe('groq-client', () => {
  beforeEach(() => {
    cacheManager.clear()
    mocks.create.mockReset()
    mocks.list.mockReset()
    mocks.create.mockResolvedValue(successfulCompletion())
    mocks.list.mockResolvedValue({ data: [{ id: PREFERRED, active: true }] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a successful completion using the preferred model', async () => {
    const result = await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    expect(result.choices[0].message.content).toBe('[{"title":"A"}]')
    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: PREFERRED, stream: false })
    )
  })

  it('discovers models, caches them, and refreshes after the TTL expires', async () => {
    vi.useFakeTimers()
    mocks.list.mockResolvedValue({ data: [{ id: PREFERRED, active: true }] })

    await selectModel()
    expect(mocks.list).toHaveBeenCalledTimes(1)

    await selectModel()
    expect(mocks.list).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60 * 60 * 1000 + 1000)

    await selectModel()
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })

  it('does not select deprecated/inactive models', async () => {
    mocks.list.mockResolvedValue({
      data: [
        { id: 'retired-model', active: false },
        { id: FALLBACK, active: true },
      ],
    })

    await expect(selectModel()).resolves.toBe(FALLBACK)
  })

  it('falls back to the next compatible model when the preferred model is unavailable', async () => {
    mocks.create
      .mockRejectedValueOnce(groqError(400, "Model 'llama-3.3-70b-versatile' does not exist"))
      .mockResolvedValueOnce({ ...successfulCompletion(), model: FALLBACK })

    mocks.list
      .mockResolvedValueOnce({ data: [{ id: PREFERRED, active: true }] })
      .mockResolvedValueOnce({ data: [{ id: FALLBACK, active: true }] })

    const result = await createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    expect(result.model).toBe(FALLBACK)
    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(mocks.create.mock.calls[0]![0].model).toBe(PREFERRED)
    expect(mocks.create.mock.calls[1]![0].model).toBe(FALLBACK)
    // the model list was force-refreshed on the failure
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })

  it('throws a controlled failure when no fallback model is available', async () => {
    const unavailable = groqError(400, "Model 'llama-3.3-70b-versatile' does not exist")
    mocks.create.mockRejectedValueOnce(unavailable)
    mocks.list.mockResolvedValue({ data: [{ id: PREFERRED, active: true }] })

    await expect(
      createChatCompletion({ messages: [{ role: 'user', content: 'hello' }] })
    ).rejects.toBe(unavailable)

    expect(mocks.create).toHaveBeenCalledTimes(1)
  })

  it('does not retry non-transient errors', async () => {
    const authError = groqError(401, 'Invalid API key')
    mocks.create.mockRejectedValueOnce(authError)

    await expect(
      createChatCompletion({ messages: [{ role: 'user', content: 'hello' }] })
    ).rejects.toBe(authError)

    expect(mocks.create).toHaveBeenCalledTimes(1)
  })

  it('respects Retry-After when the provider rate limits the request', async () => {
    vi.useFakeTimers()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    mocks.create
      .mockRejectedValueOnce(groqError(429, 'Rate limit', { 'retry-after': '1' }))
      .mockRejectedValueOnce(groqError(429, 'Rate limit', { 'retry-after': '1' }))
      .mockRejectedValueOnce(groqError(429, 'Rate limit', { 'retry-after': '1' }))
      .mockResolvedValueOnce(successfulCompletion())

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    await vi.advanceTimersByTimeAsync(20_000)
    await expect(promise).resolves.toEqual(expect.objectContaining({ model: PREFERRED }))

    const delays = setTimeoutSpy.mock.calls
      .map((call) => call[1])
      .filter((delay): delay is number => typeof delay === 'number' && delay >= 100)
    expect(delays).toEqual([1000, 1000, 1000])
    expect(mocks.create).toHaveBeenCalledTimes(4)
  })

  it('uses bounded exponential backoff with jitter for rate limits without Retry-After', async () => {
    vi.useFakeTimers()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    mocks.create
      .mockRejectedValueOnce(groqError(429, 'Rate limit'))
      .mockRejectedValueOnce(groqError(429, 'Rate limit'))
      .mockRejectedValueOnce(groqError(429, 'Rate limit'))
      .mockResolvedValueOnce(successfulCompletion())

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    await vi.advanceTimersByTimeAsync(30_000)
    await expect(promise).resolves.toEqual(expect.objectContaining({ model: PREFERRED }))

    const delays = setTimeoutSpy.mock.calls
      .map((call) => call[1])
      .filter((delay): delay is number => typeof delay === 'number' && delay >= 100)

    expect(delays).toHaveLength(3)
    expect(delays[0]).toBeGreaterThanOrEqual(400)
    expect(delays[0]).toBeLessThan(600)
    expect(delays[1]).toBeGreaterThanOrEqual(800)
    expect(delays[1]).toBeLessThan(1200)
    expect(delays[2]).toBeGreaterThanOrEqual(1600)
    expect(delays[2]).toBeLessThan(2400)
  })

  it('stops retrying after the rate limit maximum and fails gracefully', async () => {
    vi.useFakeTimers()
    const rateLimitError = groqError(429, 'Rate limit')
    mocks.create.mockRejectedValue(rateLimitError)

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })
    const rejection = promise.then(
      () => null,
      (error) => error
    )

    await vi.advanceTimersByTimeAsync(60_000)
    await expect(rejection).resolves.toBe(rateLimitError)

    expect(mocks.create).toHaveBeenCalledTimes(4)
  })

  it('retries transient 5xx errors and recovers', async () => {
    vi.useFakeTimers()
    mocks.create
      .mockRejectedValueOnce(groqError(500, 'Internal server error'))
      .mockRejectedValueOnce(groqError(503, 'Service unavailable'))
      .mockResolvedValueOnce(successfulCompletion())

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    await vi.advanceTimersByTimeAsync(30_000)
    await expect(promise).resolves.toEqual(expect.objectContaining({ model: PREFERRED }))
    expect(mocks.create).toHaveBeenCalledTimes(3)
  })

  it('retries timeout errors', async () => {
    vi.useFakeTimers()
    const timeout = Object.assign(new Error('Request timed out'), { name: 'APIConnectionTimeoutError' })
    mocks.create.mockRejectedValueOnce(timeout).mockResolvedValueOnce(successfulCompletion())

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    await vi.advanceTimersByTimeAsync(30_000)
    await expect(promise).resolves.toEqual(expect.objectContaining({ model: PREFERRED }))
    expect(mocks.create).toHaveBeenCalledTimes(2)
  })

  it('retries network errors', async () => {
    vi.useFakeTimers()
    const network = Object.assign(new Error('fetch failed'), { name: 'APIConnectionError' })
    mocks.create.mockRejectedValueOnce(network).mockResolvedValueOnce(successfulCompletion())

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })

    await vi.advanceTimersByTimeAsync(30_000)
    await expect(promise).resolves.toEqual(expect.objectContaining({ model: PREFERRED }))
    expect(mocks.create).toHaveBeenCalledTimes(2)
  })

  it('fails gracefully once transient retries are exhausted', async () => {
    vi.useFakeTimers()
    const serverError = groqError(500, 'Internal server error')
    mocks.create.mockRejectedValue(serverError)

    const promise = createChatCompletion({
      messages: [{ role: 'user', content: 'hello' }],
    })
    const rejection = promise.then(
      () => null,
      (error) => error
    )

    await vi.advanceTimersByTimeAsync(60_000)
    await expect(rejection).resolves.toBe(serverError)

    expect(mocks.create).toHaveBeenCalledTimes(3)
  })

  it('never sends the API key in request bodies', async () => {
    await createChatCompletion({ messages: [{ role: 'user', content: 'hello' }] })

    const callArg = mocks.create.mock.calls[0]![0]
    expect(callArg).not.toHaveProperty('apiKey')
    expect(JSON.stringify(callArg)).not.toContain('test-groq-key')
  })
})