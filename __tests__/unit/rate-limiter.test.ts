import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { rateLimit, rateLimitResponse, addRateLimitHeaders, clearRateLimitMap } from '@/lib/rate-limiter'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase to prevent auth calls
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Auth disabled in tests'))),
}))

// Mock NextRequest
const createMockRequest = (ip: string = '127.0.0.1', path: string = '/api/test'): NextRequest => {
  const headers = new Headers()
  headers.set('x-forwarded-for', ip)
  
  return {
    headers,
    nextUrl: { pathname: path },
  } as unknown as NextRequest
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearRateLimitMap()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rateLimit', () => {
    it('should allow requests under limit', async () => {
      const req = createMockRequest()
      const result = await rateLimit(req, { maxRequests: 5, windowMs: 60000 })

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('should track multiple requests', async () => {
      const req = createMockRequest('192.168.1.100')
      const options = { maxRequests: 3, windowMs: 60000 }

      const result1 = await rateLimit(req, options)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = await rateLimit(req, options)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = await rateLimit(req, options)
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests exceeding limit', async () => {
      const req = createMockRequest()
      const options = { maxRequests: 2, windowMs: 60000 }

      await rateLimit(req, options)
      await rateLimit(req, options)

      const result = await rateLimit(req, options)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const req = createMockRequest('192.168.1.101')
      const options = { maxRequests: 2, windowMs: 5000 }

      await rateLimit(req, options)
      await rateLimit(req, options)

      let result = await rateLimit(req, options)
      expect(result.success).toBe(false)

      vi.advanceTimersByTime(5001)

      result = await rateLimit(req, options)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should differentiate by IP address', async () => {
      const req1 = createMockRequest('192.168.1.1')
      const req2 = createMockRequest('192.168.1.2')
      const options = { maxRequests: 1, windowMs: 60000 }

      const result1 = await rateLimit(req1, options)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit(req2, options)
      expect(result2.success).toBe(true)
    })

    it('should differentiate by endpoint path', async () => {
      const req1 = createMockRequest('127.0.0.1', '/api/extract')
      const req2 = createMockRequest('127.0.0.1', '/api/ai/analyze-workload')
      const options = { maxRequests: 1, windowMs: 60000 }

      const result1 = await rateLimit(req1, options)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit(req2, options)
      expect(result2.success).toBe(true)
    })

    it('should use default options', async () => {
      const req = createMockRequest()
      const result = await rateLimit(req)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(20)
    })

    it('should handle x-real-ip header', async () => {
      const headers = new Headers()
      headers.set('x-real-ip', '10.0.0.1')

      const req = {
        headers,
        nextUrl: { pathname: '/api/test' },
      } as unknown as NextRequest

      const result = await rateLimit(req, { maxRequests: 1, windowMs: 60000 })
      expect(result.success).toBe(true)
    })

    it('should handle multiple IPs in x-forwarded-for', async () => {
      const headers = new Headers()
      headers.set('x-forwarded-for', '10.0.0.1, 10.0.0.2, 10.0.0.3')

      const req = {
        headers,
        nextUrl: { pathname: '/api/test' },
      } as unknown as NextRequest

      const result = await rateLimit(req, { maxRequests: 1, windowMs: 60000 })
      expect(result.success).toBe(true)
    })

    it('should return reset time', async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      
      const req = createMockRequest('192.168.1.102')
      const result = await rateLimit(req, { maxRequests: 5, windowMs: 60000 })
      expect(result.reset).toBe(now + 60000)
    })
  })

  describe('rateLimitResponse', () => {
    it('should return 429 status', () => {
      const response = rateLimitResponse()
      expect(response.status).toBe(429)
    })

    it('should include rate limit headers', () => {
      const response = rateLimitResponse(20, 5, Date.now() + 60000)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('20')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5')
      expect(response.headers.get('Retry-After')).toBe('60')
    })

    it('should include error message', async () => {
      const response = rateLimitResponse()
      const json = await response.json()
      expect(json.error).toContain('Too many requests')
    })
  })

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const response = new NextResponse('OK')
      const now = Date.now()

      const updated = addRateLimitHeaders(response, 20, 10, now + 60000)

      expect(updated.headers.get('X-RateLimit-Limit')).toBe('20')
      expect(updated.headers.get('X-RateLimit-Remaining')).toBe('10')
      expect(updated.headers.get('X-RateLimit-Reset')).toBe(
        Math.floor((now + 60000) / 1000).toString()
      )
    })

    it('should return the same response object', () => {
      const response = new NextResponse('OK')
      const updated = addRateLimitHeaders(response, 20, 10, Date.now() + 60000)

      expect(updated).toBe(response)
    })
  })

  describe('edge cases', () => {
    it('should handle zero remaining requests', async () => {
      const req = createMockRequest()
      const options = { maxRequests: 1, windowMs: 60000 }

      await rateLimit(req, options)
      const result = await rateLimit(req, options)

      expect(result.remaining).toBe(0)
      expect(result.success).toBe(false)
    })

    it('should handle very short window', async () => {
      const req = createMockRequest('192.168.1.103')
      const options = { maxRequests: 5, windowMs: 100 }

      const result1 = await rateLimit(req, options)
      expect(result1.success).toBe(true)

      vi.advanceTimersByTime(101)

      const result2 = await rateLimit(req, options)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(4)
    })

    it('should handle very high request limit', async () => {
      const req = createMockRequest()
      const options = { maxRequests: 10000, windowMs: 60000 }

      for (let i = 0; i < 100; i++) {
        const result = await rateLimit(req, options)
        expect(result.success).toBe(true)
      }
    })
  })
})
