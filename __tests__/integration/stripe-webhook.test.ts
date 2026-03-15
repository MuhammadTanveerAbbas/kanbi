import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

jest.mock('stripe')
jest.mock('@/lib/supabase')

const mockStripe = Stripe as jest.MockedClass<typeof Stripe>

const createMockRequest = (body: string, signature: string | null): NextRequest => {
  const headers = new Headers()
  if (signature) {
    headers.set('stripe-signature', signature)
  }

  return {
    text: async () => body,
    headers,
  } as unknown as NextRequest
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('valid signatures', () => {
    it('should return 200 with valid checkout.session.completed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              supabase_user_id: 'user-123',
            },
            subscription: 'sub_123',
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
        subscriptions: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'sub_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          }),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    it('should return 200 with customer.subscription.deleted event', async () => {
      const event: Stripe.Event = {
        id: 'evt_124',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'user-123' },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    it('should return 200 with invoice.payment_failed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_125',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
            subscription: 'sub_123',
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
        subscriptions: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'sub_123',
            status: 'past_due',
          }),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'user-123' },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    it('should return 200 with customer.subscription.updated event', async () => {
      const event: Stripe.Event = {
        id: 'evt_126',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'user-123' },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    it('should handle duplicate events gracefully', async () => {
      const event: Stripe.Event = {
        id: 'evt_127',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            metadata: { supabase_user_id: 'user-123' },
            subscription: 'sub_123',
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'evt_127' },
            error: null,
          }),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })
  })

  describe('invalid signatures', () => {
    it('should return 400 with missing signature', async () => {
      const request = createMockRequest('{}', null)
      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('No signature')
    })

    it('should return 400 with invalid signature', async () => {
      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Invalid signature')
          }),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const request = createMockRequest('{}', 'invalid-signature')
      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid signature')
    })

    it('should return 400 with tampered body', async () => {
      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Signature verification failed')
          }),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const request = createMockRequest('tampered body', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      const event: Stripe.Event = {
        id: 'evt_128',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            metadata: { supabase_user_id: 'user-123' },
            subscription: 'sub_123',
          } as any,
        },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
        subscriptions: {
          retrieve: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Webhook processing failed')
    })

    it('should handle unhandled event types', async () => {
      const event: Stripe.Event = {
        id: 'evt_129',
        type: 'charge.succeeded',
        data: { object: {} as any },
      } as Stripe.Event

      const mockStripeInstance = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(event),
        },
      }

      mockStripe.mockImplementation(() => mockStripeInstance as any)

      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }

      createServerClient.mockReturnValue(mockSupabase)

      const request = createMockRequest('{}', 'valid-signature')
      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })
  })
})
