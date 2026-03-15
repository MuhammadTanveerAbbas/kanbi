import { POST } from '@/app/api/ai/analyze-workload/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai/workload-analyzer')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const createMockRequest = (body: any): NextRequest => {
  return {
    json: async () => body,
    headers: new Headers(),
    nextUrl: { pathname: '/api/ai/analyze-workload' },
  } as unknown as NextRequest
}

const validTask = {
  id: '1',
  title: 'Task 1',
  status: 'To Do' as const,
  priority: 'High' as const,
  createdAt: new Date().toISOString(),
}

describe('POST /api/ai/analyze-workload', () => {
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
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: 5, error: null }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { WorkloadAnalyzer } = require('@/lib/ai/workload-analyzer')
      WorkloadAnalyzer.analyzeWorkload = jest.fn().mockReturnValue({
        totalTasks: 5,
        taskBreakdown: { urgent: 1, high: 2, medium: 1, low: 1 },
        estimatedHours: 8,
        healthScore: 75,
        status: 'healthy',
        burnoutRisk: { level: 'low', score: 20 },
        suggestions: ['Focus on high priority tasks'],
      })

      WorkloadAnalyzer.parseUserPattern = jest.fn().mockReturnValue({
        avgTasksPerDay: 5,
        avgCompletionTimes: { High: 30, Medium: 20, Low: 10 },
      })

      const request = createMockRequest({
        tasks: [validTask],
        userCapacity: 8,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.healthScore).toBe(75)
      expect(json.status).toBe('healthy')
    })

    it('should calculate health score correctly', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: 3, error: null }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { WorkloadAnalyzer } = require('@/lib/ai/workload-analyzer')
      WorkloadAnalyzer.analyzeWorkload = jest.fn().mockReturnValue({
        totalTasks: 10,
        taskBreakdown: { urgent: 5, high: 3, medium: 2, low: 0 },
        estimatedHours: 12,
        healthScore: 45,
        status: 'overloaded',
        burnoutRisk: { level: 'high', score: 75 },
        suggestions: ['Reduce workload', 'Delegate tasks'],
      })

      WorkloadAnalyzer.parseUserPattern = jest.fn().mockReturnValue(undefined)

      const request = createMockRequest({
        tasks: Array(10).fill(validTask),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.healthScore).toBe(45)
      expect(json.status).toBe('overloaded')
      expect(json.burnoutRisk.level).toBe('high')
    })

    it('should include burnout risk assessment', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: 0, error: null }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { WorkloadAnalyzer } = require('@/lib/ai/workload-analyzer')
      WorkloadAnalyzer.analyzeWorkload = jest.fn().mockReturnValue({
        totalTasks: 2,
        taskBreakdown: { urgent: 0, high: 1, medium: 1, low: 0 },
        estimatedHours: 3,
        healthScore: 90,
        status: 'healthy',
        burnoutRisk: { level: 'low', score: 10 },
        suggestions: [],
      })

      WorkloadAnalyzer.parseUserPattern = jest.fn().mockReturnValue(undefined)

      const request = createMockRequest({
        tasks: [validTask, validTask],
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.burnoutRisk).toBeDefined()
      expect(json.burnoutRisk.level).toBe('low')
    })
  })

  describe('validation errors', () => {
    it('should return 400 with invalid task status', async () => {
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
        tasks: [{ ...validTask, status: 'Invalid' }],
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 with invalid priority', async () => {
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
        tasks: [{ ...validTask, priority: 'Critical' }],
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 with invalid userCapacity', async () => {
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
        tasks: [validTask],
        userCapacity: 25,
      })

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
        tasks: [validTask],
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
        tasks: [validTask],
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('empty tasks', () => {
    it('should handle empty tasks array', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: 0, error: null }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { WorkloadAnalyzer } = require('@/lib/ai/workload-analyzer')
      WorkloadAnalyzer.analyzeWorkload = jest.fn().mockReturnValue({
        totalTasks: 0,
        taskBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 },
        estimatedHours: 0,
        healthScore: 100,
        status: 'healthy',
        burnoutRisk: { level: 'none', score: 0 },
        suggestions: [],
      })

      WorkloadAnalyzer.parseUserPattern = jest.fn().mockReturnValue(undefined)

      const request = createMockRequest({
        tasks: [],
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.totalTasks).toBe(0)
      expect(json.healthScore).toBe(100)
    })
  })

  describe('database operations', () => {
    it('should save workload snapshot', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: 0, error: null }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const { WorkloadAnalyzer } = require('@/lib/ai/workload-analyzer')
      WorkloadAnalyzer.analyzeWorkload = jest.fn().mockReturnValue({
        totalTasks: 1,
        taskBreakdown: { urgent: 0, high: 1, medium: 0, low: 0 },
        estimatedHours: 2,
        healthScore: 85,
        status: 'healthy',
        burnoutRisk: { level: 'low', score: 15 },
        suggestions: [],
      })

      WorkloadAnalyzer.parseUserPattern = jest.fn().mockReturnValue(undefined)

      const request = createMockRequest({
        tasks: [validTask],
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('workload_snapshots')
    })
  })
})
