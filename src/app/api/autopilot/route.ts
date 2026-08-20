import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logging/logger'
import { createChatCompletion } from '@/lib/ai/groq-client'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter'
import { AuthError } from '@/lib/errors/AppError'
import { sanitizeInput } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

interface AutoTask {
  status: 'todo' | 'wip' | 'done'
}

interface AutopilotBody {
  tasks: AutoTask[]
}

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = crypto.randomUUID()
  const limitResult = await rateLimit(request, { maxRequests: 10, windowMs: 60000 })
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = new AuthError()
      return NextResponse.json(err.toJSON(), { status: 401 })
    }

    const body = (await request.json()) as AutopilotBody
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: 'Tasks array required' }, { status: 400 })
    }

    logger.info('Autopilot request', { userId: user.id, requestId })

    const pending = body.tasks.filter((task) => task.status !== 'done')
    const completion = await createChatCompletion({
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            "You are a productivity AI. Generate a morning briefing based on the user's pending tasks. Return ONLY valid JSON. No markdown. No explanation.",
        },
        { role: 'user', content: `My pending tasks: ${JSON.stringify(pending)}` },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.replace(/```json|```/g, '').trim() ?? '{}'
    const briefing = JSON.parse(raw) as { burnoutRisk?: boolean; healthNote?: string }

    if (briefing.burnoutRisk) {
      await supabase.from('burnout_alerts').insert({
        user_id: user.id,
        score: 40,
        message: briefing.healthNote ?? 'Potential burnout risk detected',
      })
    }

    return NextResponse.json(briefing)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Autopilot error:', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
