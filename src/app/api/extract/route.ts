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
          content:
            'Extract every action item from the text the user gives you. Return ONLY valid JSON. No markdown. No explanation.',
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

    return Response.json({ tasks })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
