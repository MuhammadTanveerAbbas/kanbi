import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * The webhook route gets its Stripe client from a factory rather than building
 * one at module scope, so this mocks the factory. Mocking the `stripe` package
 * itself and then reaching into `Stripe.mock.results[0]` used to work only
 * because the route happened to call the constructor during import. The factory
 * is the seam now, and mocking the real dependency would mean the test never
 * fails when the route asks for the wrong client.
 */
vi.mock('@/lib/supabase/admin')
vi.mock('@/lib/billing/stripe', () => ({
  getStripe: vi.fn(),
  requireEnv: vi.fn((name: string) => `test-${name}`),
}))

const { getStripe } = await import('@/lib/billing/stripe')
const { POST } = await import('@/app/api/webhooks/stripe/route')

const constructEvent = vi.fn()
const retrieve = vi.fn()

vi.mocked(getStripe).mockReturnValue({
  webhooks: { constructEvent },
  subscriptions: { retrieve },
} as unknown as ReturnType<typeof getStripe>)

const mockCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

const createMockRequest = (body: string, signature: string | null) => {
  const headers = new Headers()
  if (signature) headers.set('stripe-signature', signature)
  return { text: async () => body, headers } as Parameters<typeof POST>[0]
}

function mockSupabase(existingEvent: boolean) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      existingEvent ? { data: { id: 'evt_123' } } : { data: null, error: null }
    ),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getStripe).mockReturnValue({
      webhooks: { constructEvent },
      subscriptions: { retrieve },
    } as unknown as ReturnType<typeof getStripe>)
  })

  it('returns 400 when signature header is missing', async () => {
    const response = await POST(createMockRequest('{}', null))
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('No signature')
  })

  it('returns 400 when signature is invalid', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(createMockRequest('{}', 'bad-signature'))
    expect(response.status).toBe(400)
  })

  it('returns 200 for duplicate events', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_123',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_1' } },
    } as never)
    mockCreateAdminClient.mockReturnValue(mockSupabase(true) as never)

    const response = await POST(createMockRequest('{}', 'sig'))
    expect(response.status).toBe(200)
  })

  it('ignores event types it has no handling for', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_456',
      type: 'invoice.payment_succeeded',
      data: { object: { id: 'in_1' } },
    } as never)
    mockCreateAdminClient.mockReturnValue(mockSupabase(false) as never)

    const response = await POST(createMockRequest('{}', 'sig'))
    expect(response.status).toBe(200)
  })
})