import Groq from 'groq-sdk'

import { createClient } from '@/lib/supabase/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface ExtractBody {
  text: string
  userId: string
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

    const cleanInput = body.text.replace(/<[^>]*>/g, '').trim()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `Extract every action item / task from the user's text.
Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
Each item must have these exact fields:
- "title": string (clear, actionable task name)
- "priority": one of "urgent" | "high" | "medium" | "low"
- "estimate": string like "30m", "1h", "2h" (your best guess, or omit if unclear)
- "deadline": ISO date string if mentioned, otherwise omit

Example output:
[{"title":"Review client proposal","priority":"high","estimate":"1h"},{"title":"Send follow-up email","priority":"medium","estimate":"15m"}]`,
        },
        { role: 'user', content: cleanInput },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'
    const tasks = JSON.parse(raw.replace(/```json|```/g, '').trim()) as unknown[]

    await supabase.rpc('increment_ai_usage', {
      p_user_id: body.userId,
      p_date: today,
    })

    // Persist extracted tasks to the tasks table
    const taskRows = (tasks as { title?: string; priority?: string; estimate?: string; deadline?: string }[])
      .filter(t => t.title && t.title.trim().length > 2)
      .map(t => ({
        user_id: user.id,
        title: t.title!.trim(),
        priority: ['urgent','high','medium','low'].includes(t.priority ?? '') ? t.priority : 'medium',
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
