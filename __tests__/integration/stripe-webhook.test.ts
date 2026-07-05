import { describe, it, expect, beforeEach, vi } from 'vitest'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

vi.mock('@/lib/supabase/admin')

const { POST } = await import('@/app/api/webhooks/stripe/route')

const MockStripe = vi.mocked(Stripe)
const stripeInstance = MockStripe.mock.results[0]?.value as {
  webhooks: { constructEvent: ReturnType<typeof vi.fn> }
  subscriptions: { retrieve: ReturnType<typeof vi.fn> }
}

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
  })

  it('returns 400 when signature header is missing', async () => {
    const response = await POST(createMockRequest('{}', null))
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('No signature')
  })

  it('returns 400 when signature is invalid', async () => {
    stripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(createMockRequest('{}', 'bad-signature'))
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('returns 200 for duplicate events', async () => {
    stripeInstance.webhooks.constructEvent.mockReturnValue({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1' } },
    })

    mockCreateAdminClient.mockReturnValue(mockSupabase(true))

    const response = await POST(createMockRequest('{}', 'valid-signature'))
    expect(response.status).toBe(200)
    expect((await response.json()).received).toBe(true)
  })

  it('returns 200 for checkout.session.completed', async () => {
    stripeInstance.webhooks.constructEvent.mockReturnValue({
      id: 'evt_new',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          metadata: { supabase_user_id: 'user-1' },
          subscription: 'sub_1',
        },
      },
    })
    stripeInstance.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_1',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    })

    mockCreateAdminClient.mockReturnValue(mockSupabase(false))

    const response = await POST(createMockRequest('{}', 'valid-signature'))
    expect(response.status).toBe(200)
    expect((await response.json()).received).toBe(true)
  })
})
