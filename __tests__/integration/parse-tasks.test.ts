import { POST } from '@/app/api/parse-tasks/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai-service')
jest.mock('@/lib/services/usage-service')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const createMockRequest = (body: any): NextRequest => {
  return {
    json: async () => body,
    headers: new Headers({
      'x-forwarded-for': '127.0.0.1',
    }),
    nextUrl: { pathname: '/api/parse-tasks' },
  } as unknown as NextRequest
}

describe('POST /api/parse-tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful requests', () => {
    it('should return 200 with valid input', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { AIService } = require('@/lib/ai-service')
      AIService.parseTasks = jest.fn().mockResolvedValue({
        tasks: [
          { id: '1', title: 'Task 1', status: 'To Do', priority: 'High' },
        ],
        duplicates: [],
        qualityScore: 0.95,
      })

      const { usageService } = require('@/lib/services/usage-service')
      usageService.canUseAI = jest.fn().mockResolvedValue(true)
      usageService.incrementAIUsage = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest({
        notes: 'Buy groceries, Fix authentication bug',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.tasks).toBeDefined()
      expect(json.tasks.length).toBe(1)
    })

    it('should parse multiple tasks', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { AIService } = require('@/lib/ai-service')
      AIService.parseTasks = jest.fn().mockResolvedValue({
        tasks: [
          { id: '1', title: 'Task 1', status: 'To Do', priority: 'High' },
          { id: '2', title: 'Task 2', status: 'To Do', priority: 'Medium' },
          { id: '3', title: 'Task 3', status: 'To Do', priority: 'Low' },
        ],
        duplicates: [],
        qualityScore: 0.92,
      })

      const { usageService } = require('@/lib/services/usage-service')
      usageService.canUseAI = jest.fn().mockResolvedValue(true)
      usageService.incrementAIUsage = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest({
        notes: 'Task 1\nTask 2\nTask 3',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.tasks.length).toBe(3)
    })
  })

  describe('validation errors', () => {
    it('should return 400 with empty notes', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = createMockRequest({ notes: '' })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 with notes exceeding max length', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = createMockRequest({
        notes: 'a'.repeat(10001),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 with missing notes field', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = createMockRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('authentication errors', () => {
    it('should return 401 when user not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = createMockRequest({
        notes: 'Test notes',
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.code).toBe('AUTH_ERROR')
    })

    it('should return 401 with auth error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Auth failed'),
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const request = createMockRequest({
        notes: 'Test notes',
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('rate limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { usageService } = require('@/lib/services/usage-service')
      usageService.canUseAI = jest.fn().mockResolvedValue(false)

      const request = createMockRequest({
        notes: 'Test notes',
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const json = await response.json()
      expect(json.code).toBe('RATE_LIMIT_ERROR')
    })
  })

  describe('external service errors', () => {
    it('should return 502 when AI service unavailable', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { AIService } = require('@/lib/ai-service')
      AIService.parseTasks = jest.fn().mockRejectedValue(
        new Error('API key not configured')
      )

      const { usageService } = require('@/lib/services/usage-service')
      usageService.canUseAI = jest.fn().mockResolvedValue(true)

      const request = createMockRequest({
        notes: 'Test notes',
      })

      const response = await POST(request)

      expect(response.status).toBe(502)
      const json = await response.json()
      expect(json.code).toBe('EXTERNAL_SERVICE_ERROR')
    })
  })

  describe('response headers', () => {
    it('should include rate limit headers', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { AIService } = require('@/lib/ai-service')
      AIService.parseTasks = jest.fn().mockResolvedValue({
        tasks: [],
        duplicates: [],
        qualityScore: 1,
      })

      const { usageService } = require('@/lib/services/usage-service')
      usageService.canUseAI = jest.fn().mockResolvedValue(true)
      usageService.incrementAIUsage = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest({
        notes: 'Test',
      })

      const response = await POST(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })
  })
})
