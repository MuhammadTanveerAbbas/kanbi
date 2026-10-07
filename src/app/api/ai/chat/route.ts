import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ChatAssistant, ChatMessage, ChatContext } from '@/lib/ai/chat-assistant'
import { chatSchema } from '@/lib/validation/schemas'
import { ValidationError, AuthError } from '@/lib/errors/AppError'
import { logger } from '@/lib/logging/logger'
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter'
import { sanitizeChatText } from '@/lib/chat-text'
import { sanitizeInput } from '@/lib/security'
import { getProvider, isInferenceConfigured } from '@/lib/ai/service'
import DOMPurify from 'isomorphic-dompurify'

/**
 * The assistant conversation endpoint.
 *
 * ## Shape
 *
 * POST sends a turn and receives one reply. GET returns the thread. DELETE
 * clears it. Three verbs, one resource, which is why they share a file.
 *
 * ## Failure reporting
 *
 * The client needs to tell three cases apart, because they need different
 * things from the user: the request limit was hit, the network dropped, and the
 * model was unavailable. Those map to distinct `code` values, and the client
 * shows a different line for each. A single generic 500 made the "try again"
 * button appear for problems retrying cannot fix.
 *
 * `ok: false` accompanies every error body, so a client can branch on one field
 * without inspecting the status code.
 *
 * ## Security
 *
 * Unchanged in substance: authenticated, rate limited, usage limited, and every
 * string is sanitised on the way in and again on the way out. The reply is
 * stored after sanitisation, so what is persisted is what is displayed.
 */

interface ChatFailure {
  error: string
  code: string
  statusCode: number
  ok: false
  retryable: boolean
  requestId: string
  timestamp: string
}

function failure(
  message: string,
  code: string,
  statusCode: number,
  retryable: boolean,
  requestId: string,
): ChatFailure {
  return {
    error: message,
    code,
    statusCode,
    ok: false,
    retryable,
    requestId,
    timestamp: new Date().toISOString(),
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60_000 })
  if (!limitResult.success) {
    return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset)
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new AuthError()

    logger.info('Assistant request', { userId: user.id, requestId })

    const body = await request.json()
    const { message, tasks, quickAction, workloadHealth, estimatedHours, completedToday } = body

    if (!message && !quickAction) {
      throw new ValidationError('Message or quick action required')
    }

    const sanitizedMessage = message ? sanitizeInput(message, 4000) : undefined
    const sanitizedQuickAction = quickAction ? sanitizeInput(quickAction, 100) : undefined

    if (sanitizedMessage) {
      chatSchema.parse({ message: sanitizedMessage, tasks })
    }

    const context: ChatContext = {
      tasks: tasks || [],
      workloadHealth,
      estimatedHours,
      completedToday,
    }

    const chatHistory = await getChatHistory(supabase, user.id)

    let aiResponse: string

    if (sanitizedQuickAction) {
      // A quick action is pure arithmetic over the board, so it answers without
      // inference. That means it keeps working when no runtime is configured,
      // which is deliberate.
      aiResponse = await ChatAssistant.handleQuickAction(
        sanitizedQuickAction as 'prioritize' | 'breakdown' | 'defer' | 'plan' | 'motivate',
        context,
      )
    } else if (sanitizedMessage) {
      aiResponse = await ChatAssistant.generateResponse(sanitizedMessage, context, chatHistory)
    } else {
      throw new ValidationError('Message or quick action required')
    }

    if (sanitizedMessage) {
      await saveMessage(supabase, user.id, 'user', sanitizedMessage, tasks)
    }

    const cleanResponse = sanitizeChatText(
      DOMPurify.sanitize(aiResponse, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
    )
    await saveMessage(supabase, user.id, 'assistant', cleanResponse, tasks)

    logger.info('Assistant success', { userId: user.id, requestId })

    const response = NextResponse.json({
      response: cleanResponse,
      ok: true,
      timestamp: new Date().toISOString(),
      // Lets the UI explain a board-aware answer rather than a generated one.
      ...(getProvider() ? { inference: true } : { inference: false }),
    })
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset)
  } catch (error: unknown) {
    return errorResponse(error, requestId)
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new AuthError()

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, role, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      logger.error('Error fetching assistant history', {
        userId: user.id,
        requestId,
        error: error.message,
      })
      // An empty thread is a recoverable state, not an error. The user sees the
      // empty state and can start a conversation.
      return NextResponse.json({ messages: [], ok: true })
    }

    return NextResponse.json({
      messages: messages.map((msg) => ({
        role: msg.role,
        message: msg.message,
        timestamp: msg.created_at,
      })),
      ok: true,
      inference: isInferenceConfigured(),
    })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    logger.error('Get assistant history error', { requestId, error: String(error) })
    return NextResponse.json({ messages: [], ok: true })
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new AuthError()

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      logger.error('Error clearing assistant history', {
        userId: user.id,
        requestId,
        error: error.message,
      })
      return NextResponse.json(
        failure('Failed to clear the conversation', 'DATABASE_ERROR', 500, true, requestId),
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, ok: true })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    logger.error('Clear assistant history error', { requestId, error: String(error) })
    return NextResponse.json(
      failure('Failed to clear the conversation', 'INTERNAL_ERROR', 500, true, requestId),
      { status: 500 },
    )
  }
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof Error && error.name === 'ZodError') {
    const zod = error as unknown as { errors?: Array<{ message?: string }> }
    const message = zod.errors?.[0]?.message || 'Invalid request data'
    logger.warn('Assistant validation error', { requestId })
    return NextResponse.json(failure(message, 'VALIDATION_ERROR', 400, false, requestId), {
      status: 400,
    })
  }

  if (error instanceof ValidationError) {
    logger.warn(error.message, { requestId, errorId: error.errorId })
    return NextResponse.json(
      failure(error.message, error.code, error.statusCode, false, requestId),
      { status: error.statusCode },
    )
  }

  if (error instanceof AuthError) {
    logger.warn(error.message, { requestId, errorId: error.errorId })
    return NextResponse.json(
      failure(error.message, error.code, error.statusCode, false, requestId),
      { status: error.statusCode },
    )
  }

  // The board-aware rules still answer when inference is off, so this is a
  // degraded state rather than a dead endpoint. `retryable` is false because
  // waiting will not make a deployment gain a runtime, and showing a retry
  // button that cannot work is worse than showing an explanation.
  if (!isInferenceConfigured()) {
    logger.warn('Assistant requested with no inference runtime configured', { requestId })
    return NextResponse.json(
      failure(
        'The assistant is running without a model runtime. Board answers still work.',
        'AI_NOT_CONFIGURED',
        503,
        false,
        requestId,
      ),
      { status: 503 },
    )
  }

  logger.error('Assistant error', { requestId, error: String(error) })
  return NextResponse.json(
    failure('Something went wrong on my side. Try again in a moment.', 'INTERNAL_ERROR', 500, true, requestId),
    { status: 500 },
  )
}

async function getChatHistory(supabase: unknown, userId: string): Promise<ChatMessage[]> {
  try {
    const client = supabase as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => { limit: (n: number) => Promise<{ data: unknown }> }
          }
        }
      }
    }
    const { data: messages } = await client
      .from('chat_messages')
      .select('role, message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    const rows = (messages ?? []) as Array<{ role: string; message: string; created_at: string }>
    if (rows.length === 0) return []

    return rows.reverse().map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      message: msg.message,
      timestamp: new Date(msg.created_at),
    }))
  } catch (error) {
    logger.error('Error reading assistant history', { userId, error: String(error) })
    return []
  }
}

async function saveMessage(
  supabase: unknown,
  userId: string,
  role: 'user' | 'assistant',
  message: string,
  tasks: unknown[],
) {
  try {
    const client = supabase as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
      }
    }
    await client.from('chat_messages').insert({
      user_id: userId,
      role,
      message,
      task_context: { task_count: Array.isArray(tasks) ? tasks.length : 0 },
    })
  } catch (error) {
    // A failed write must not fail the turn. The user has their answer, and the
    // next GET will simply return a slightly shorter thread.
    logger.error('Error saving assistant message', { userId, error: String(error) })
  }
}
