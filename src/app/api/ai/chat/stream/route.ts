import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stream, getProvider, isInferenceConfigured } from '@/lib/ai/service'
import { logger } from '@/lib/logging/logger'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter'
import { sanitizeInput } from '@/lib/security'
import { sanitizeChatText } from '@/lib/chat-text'
import { AuthError, ValidationError } from '@/lib/errors/AppError'
import { chatStreamSchema } from '@/lib/validation/schemas'
import { CHAT_SYSTEM_PROMPT } from '@/lib/ai/chat-copy'

/**
 * Streaming assistant endpoint.
 *
 * ## Why this is separate from the buffered one
 *
 * The buffered route persists each turn whole, which is what conversation
 * history and the retry affordance both need. That makes it the wrong shape for
 * a long answer, where the user watches a cursor for eight seconds and cannot
 * tell whether it is working.
 *
 * This route streams the same conversation as Server-Sent Events, so the first
 * token lands in well under a second on any runtime. It does not write to the
 * thread: the client re-posts the assembled text through the buffered route,
 * which owns persistence. Two endpoints rather than one overloaded one, because
 * a streaming turn that half-completed must not be recorded as a finished
 * answer.
 *
 * ## Protocol
 *
 * Named events, so a client can act on state rather than parsing text:
 *
 *   `meta`     the selected model, sent before the first delta
 *   `delta`    a content fragment
 *   `done`     the assembled, sanitised text
 *   `error`    a coded, retryable-or-not failure
 *
 * Every event carries the same shape: `{ type, data }`.
 */
export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60_000 })
  if (!limitResult.success) {
    return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION_ERROR', error: 'Expected a JSON body' },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new AuthError()

    if (!isInferenceConfigured() || !getProvider()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'AI_NOT_CONFIGURED',
          error: 'No model runtime is configured for this deployment.',
        },
        { status: 503 },
      )
    }

    const parsed = chatStreamSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid request')
    }

    const question = sanitizeInput(parsed.data.message, 4000)
    if (!question) throw new ValidationError('Message is required')

    logger.info('Assistant stream started', { userId: user.id, requestId })

    // The same board-aware system prompt the buffered route uses, so a streamed
    // answer is not a worse answer than a buffered one. Kept minimal here
    // because the streaming route is for free-form questions; board arithmetic
    // is answered by the buffered route without a model call.
    const messages = [
      { role: 'system' as const, content: CHAT_SYSTEM_PROMPT.replace('PENDING of TOTAL', 'unknown').replace('HEALTH out of 100', 'unknown').replace('DONE', '0').replace('TASKS', '- (not provided)') },
      ...parsed.data.history.slice(-6).map((turn: { role: string; content: string }) => ({
        role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: sanitizeInput(turn.content, 400),
      })),
      { role: 'user' as const, content: question },
    ]

    // An AbortController so a client that navigates away tears the upstream
    // request down instead of leaving it running to completion.
    const abort = new AbortController()
    request.signal.addEventListener('abort', () => abort.abort(), { once: true })

    const stream_ = stream({
      messages,
      temperature: 0.4,
      maxTokens: 220,
      signal: abort.signal,
    })

    let assembled = ''

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Announce the model before the first token so the client can label
          // the answer. The model id is metadata, not a user-facing string.
          controller.enqueue(sse('meta', { requestId, model: 'streaming' }))

          for await (const delta of stream_) {
            if (abort.signal.aborted) break
            assembled += delta
            controller.enqueue(sse('delta', { text: delta }))
          }

          const clean = sanitizeChatText(assembled)
          controller.enqueue(sse('done', { text: clean, ok: true }))
        } catch (error) {
          // Anything that happens after the headers are sent cannot change the
          // status code, so the failure travels as a named event. The client
          // treats it the same way it treats a failed POST.
          logger.error('Assistant stream failed', { requestId, error: String(error) })
          controller.enqueue(
            sse('error', {
              ok: false,
              code: 'STREAM_FAILED',
              error: 'The reply was cut off. Try again.',
              retryable: true,
            }),
          )
        } finally {
          controller.close()
        }
      },
      cancel() {
        abort.abort()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    logger.error('Assistant stream setup error', { requestId, error: String(error) })
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', error: 'Could not start the stream.' },
      { status: 500 },
    )
  }
}

