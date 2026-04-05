import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

const GROQ_MODEL = 'openai/gpt-oss-120b'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

interface ExtractBody {
  text: string
  userId: string
}

const VALID_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low'])

function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, 8000) // hard cap to avoid token abuse
}

export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as ExtractBody
    if (!body.text?.trim() || !body.userId) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if (body.userId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Check plan from subscriptions table
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', body.userId)
      .eq('status', 'active')
      .maybeSingle()

    // Check monthly AI usage
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: monthUsage } = await supabase
      .from('usage_tracking')
      .select('ai_used_count')
      .eq('user_id', body.userId)
      .gte('date', monthStart)

    const totalMonthlyAI = monthUsage?.reduce((sum, row) => sum + (row.ai_used_count || 0), 0) ?? 0
    const monthlyLimit = subscription?.plan === 'premium' ? 1500 : 300

    if (totalMonthlyAI >= monthlyLimit) {
      return Response.json(
        { error: 'Monthly limit reached. Upgrade to Pro for unlimited extractions.' },
        { status: 429 }
      )
    }

    const cleanInput = sanitizeText(body.text)
    if (!cleanInput) {
      return Response.json({ error: 'No usable text provided' }, { status: 400 })
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

    const raw = completion.choices[0]?.message?.content ?? '[]'
    let tasks: unknown[]
    try {
      tasks = JSON.parse(raw.replace(/```json|```/g, '').trim()) as unknown[]
      if (!Array.isArray(tasks)) tasks = []
    } catch {
      tasks = []
    }

    await supabase.rpc('increment_ai_usage', {
      p_user_id: body.userId,
      p_date: today,
    })

    // Persist extracted tasks to the tasks table
    const taskRows = (tasks as { title?: string; priority?: string; estimate?: string; deadline?: string }[])
      .filter(t => t.title && t.title.trim().length > 2)
      .slice(0, 20) // enforce max
      .map(t => ({
        user_id: user.id,
        title: t.title!.trim().slice(0, 120),
        priority: VALID_PRIORITIES.has(t.priority ?? '') ? t.priority : 'medium',
        label: 'General',
        status: 'todo',
        estimate: t.estimate ?? null,
        due_date: t.deadline ?? null,
      }))

    if (taskRows.length > 0) {
      await supabase.from('tasks').insert(taskRows)
    }

    return Response.json({ tasks })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
