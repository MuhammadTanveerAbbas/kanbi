import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkSupabaseHealth } from '@/lib/supabase/health'

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }))

const mockClient = (query: () => Promise<unknown>) => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      limit: query,
    })),
  })),
})

describe('checkSupabaseHealth', () => {
  beforeEach(() => {
    createAdminClient.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports ok on a successful read-only query', async () => {
    createAdminClient.mockReturnValue(
      mockClient(() => Promise.resolve({ data: [{ id: '1' }], error: null }))
    )

    const result = await checkSupabaseHealth()

    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
    expect(createAdminClient).toHaveBeenCalledTimes(1)
  })

  it('reports unavailable when Supabase returns an error', async () => {
    createAdminClient.mockReturnValue(
      mockClient(() => Promise.resolve({ data: null, error: { message: 'connection refused' } }))
    )

    const result = await checkSupabaseHealth()

    expect(result.ok).toBe(false)
    expect(result.error).toBe('connection refused')
  })

  it('reports unavailable when the client cannot be created', async () => {
    createAdminClient.mockImplementation(() => {
      throw new Error('supabaseUrl is required')
    })

    const result = await checkSupabaseHealth()

    expect(result.ok).toBe(false)
    expect(result.error).toBe('supabaseUrl is required')
  })

  it('times out instead of hanging when Supabase is unresponsive', async () => {
    vi.useFakeTimers()
    createAdminClient.mockReturnValue(
      mockClient(() => new Promise(() => {})) // never resolves
    )

    const promise = checkSupabaseHealth()
    await vi.advanceTimersByTimeAsync(6000)
    const result = await promise

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Supabase health check timed out')
  })
})