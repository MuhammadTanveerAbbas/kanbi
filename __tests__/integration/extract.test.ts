import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/extract/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { usageService } from '@/lib/services/usage-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/usage-service')
vi.mock('@/lib/services/default-board', () => ({
  getOrCreateDefaultBoard: vi.fn().mockResolvedValue('board-123'),
}))
vi.mock('groq-sdk', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '[{"title":"Task 1","priority":"high"}]' } }],
        }),
      },
    },
    models: {
      list: vi.fn().mockResolvedValue({
        data: [{ id: 'llama-3.3-70b-versatile', active: true }],
      }),
    },
  })),
}))

const mockCreateClient = createClient as ReturnType<typeof vi.fn>

const createMockRequest = (body: Record<string, unknown>): NextRequest => {
  return {
    json: async () => body,
    headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
    nextUrl: { pathname: '/api/extract' },
  } as unknown as NextRequest
}

describe('POST /api/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    })

    const response = await POST(createMockRequest({ text: 'Buy groceries' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 when text is empty', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
      from: vi.fn(),
    })

    const response = await POST(createMockRequest({ text: '   ' }))
    expect(response.status).toBe(400)
  })

  it('returns 429 when usage limit is exceeded', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
      from: vi.fn(),
    })

    vi.mocked(usageService.canUseAI).mockResolvedValue(false)

    const response = await POST(createMockRequest({ text: 'Fix authentication bug' }))
    expect(response.status).toBe(429)
  })

  it('returns extracted tasks on success', async () => {
    const insert = vi.fn().mockResolvedValue({ data: null, error: null })
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({ insert }),
    })

    vi.mocked(usageService.canUseAI).mockResolvedValue(true)
    vi.mocked(usageService.incrementAIUsage).mockResolvedValue(undefined)

    const response = await POST(createMockRequest({ text: 'Review client proposal' }))
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.tasks).toHaveLength(1)
    expect(json.tasks[0].title).toBe('Task 1')
  })
})
