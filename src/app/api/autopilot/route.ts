import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

const GROQ_MODEL = 'openai/gpt-oss-120b'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

interface AutoTask {
  status: 'todo' | 'wip' | 'done'
}

interface AutopilotBody {
  tasks: AutoTask[]
  userId: string
}

export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as AutopilotBody
    if (!body.userId || !Array.isArray(body.tasks)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if (body.userId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        user_id: body.userId,
        score: 40,
        message: briefing.healthNote ?? 'Potential burnout risk detected',
      })
    }

    return Response.json(briefing)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
