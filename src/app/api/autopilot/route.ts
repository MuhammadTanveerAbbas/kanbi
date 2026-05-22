import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logging/logger'
import { GROQ_MODEL, GROQ_API_KEY } from '@/lib/constants'

function getGroq() {
  return new Groq({ apiKey: GROQ_API_KEY })
}

interface AutoTask {
  status: 'todo' | 'wip' | 'done'
}

interface AutopilotBody {
  tasks: AutoTask[]
}

export async function POST(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as AutopilotBody
    if (!Array.isArray(body.tasks)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    logger.info('Autopilot request', { userId: user.id, requestId })

    const pending = body.tasks.filter((task) => task.status !== 'done')
    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
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

    return Response.json(briefing)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    logger.error('Autopilot error:', { error: message })
    return Response.json({ error: message }, { status: 500 })
  }
}
