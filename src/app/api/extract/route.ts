import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logging/logger'
import { GROQ_MODEL, GROQ_API_KEY } from '@/lib/constants'
import { extractJsonArray } from '@/lib/ai-service'
import { usageService } from '@/lib/services/usage-service'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter'
import { AuthError, RateLimitError, ExternalServiceError } from '@/lib/errors/AppError'
import { sanitizeInput } from '@/lib/security'
import { getOrCreateDefaultBoard } from '@/lib/services/default-board'
import DOMPurify from 'isomorphic-dompurify'
import { NextRequest, NextResponse } from 'next/server'

function getGroq() {
  return new Groq({ apiKey: GROQ_API_KEY })
}

const VALID_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low'])

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = crypto.randomUUID()
  const limitResult = await rateLimit(request, { maxRequests: 20, windowMs: 60000 })
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = new AuthError()
      return NextResponse.json(err.toJSON(), { status: 401 })
    }

    const body = await request.json()
    if (!body.text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    logger.info('Extract request', { userId: user.id, requestId })

    const canUse = await usageService.canUseAI(user.id)
    if (!canUse) {
      const err = new RateLimitError('Monthly AI usage limit reached. Upgrade to Pro for more.')
      return NextResponse.json(err.toJSON(), { status: 429 })
    }

    const cleanInput = sanitizeInput(body.text, 8000)
    if (!cleanInput) {
      return NextResponse.json({ error: 'No usable text provided' }, { status: 400 })
    }

    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Extract every action item / task from the user's text.
Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
Each item must have these exact fields:
- "title": string (clear, actionable task name, max 120 chars)
- "priority": one of "urgent" | "high" | "medium" | "low"
- "estimate": string like "30m", "1h", "2h" (your best guess, or omit if unclear)
- "deadline": ISO date string if mentioned, otherwise omit

Rules:
- Only extract real action items, not observations or facts
- Merge duplicate tasks
- Max 20 tasks per extraction

Example output:
[{"title":"Review client proposal","priority":"high","estimate":"1h"},{"title":"Send follow-up email","priority":"medium","estimate":"15m"}]`,
        },
        { role: 'user', content: cleanInput },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    let tasks: unknown[] = extractJsonArray(raw)
    if (tasks.length === 0) {
      const obj = raw.match(/\{[\s\S]*\}/)
      if (obj) {
        try {
          const parsed = JSON.parse(obj[0])
          if (Array.isArray(parsed.tasks)) tasks = parsed.tasks
        } catch {
          tasks = []
        }
      }
    }

    await usageService.incrementAIUsage(user.id).catch((error) => {
      logger.error('Failed to track AI usage', { userId: user.id, requestId, error: error.message })
    })

    const typedTasks = (tasks as { title?: string; priority?: string; estimate?: string; deadline?: string }[])
      .filter(t => t.title && t.title.trim().length > 2)
      .slice(0, 20)
      .map(t => ({
        ...t,
        title: DOMPurify.sanitize(t.title!.trim().slice(0, 120), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
      }))

    const boardId = await getOrCreateDefaultBoard(supabase, user.id)

    const taskRows = typedTasks.map(t => ({
      board_id: boardId,
      user_id: user.id,
      title: t.title,
      priority: VALID_PRIORITIES.has(t.priority ?? '') ? t.priority : 'medium',
      label: 'General',
      status: 'todo',
      estimate: t.estimate ?? null,
      due_date: t.deadline ?? null,
    }))

    if (taskRows.length > 0) {
      const { error: insertError } = await supabase.from('tasks').insert(taskRows)
      if (insertError) {
        logger.error('Failed to save extracted tasks', { userId: user.id, requestId, error: insertError.message })
        return NextResponse.json({ error: 'Failed to save extracted tasks' }, { status: 500 })
      }
    }

    logger.info('Extract success', { userId: user.id, requestId, tasksCount: tasks.length })

    return NextResponse.json({ tasks: typedTasks })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Extract error:', { error: message })
    const serviceError = new ExternalServiceError(message)
    return NextResponse.json(serviceError.toJSON(), { status: 502 })
  }
}
