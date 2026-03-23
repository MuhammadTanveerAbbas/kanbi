import { google } from 'googleapis'

import { createClient } from '@/lib/supabase/server'

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
)

interface CreateEventBody {
  taskIds: string[]
  taskTitle: string
  date: string
  time: string
  duration?: string
  note?: string
  userId: string
}

function parseDuration(estimate?: string): number {
  if (!estimate) return 60
  const h = estimate.match(/(\d+)\s*h/i)
  const m = estimate.match(/(\d+)\s*m/i)
  return (h ? Number.parseInt(h[1], 10) * 60 : 0) + (m ? Number.parseInt(m[1], 10) : 0) || 60
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as CreateEventBody
    if (!body.userId || !body.date || !body.time || body.taskIds.length === 0) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== body.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: integration } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', body.userId)
      .eq('provider', 'google_calendar')
      .single()

    if (!integration?.access_token) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 401 })
    }

    // Refresh token if expired
    oauth2.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token ?? undefined,
    })

    if (integration.expires_at && new Date(integration.expires_at) <= new Date()) {
      const { credentials } = await oauth2.refreshAccessToken()
      oauth2.setCredentials(credentials)
      // Update stored token
      await supabase
        .from('integrations')
        .update({
          access_token: credentials.access_token ?? integration.access_token,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', body.userId)
        .eq('provider', 'google_calendar')
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2 })
    const startDT = new Date(`${body.date}T${body.time}:00`)
    const endDT = new Date(startDT.getTime() + parseDuration(body.duration) * 60000)

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: body.taskTitle,
        description: body.note ?? '',
        start: { dateTime: startDT.toISOString() },
        end: { dateTime: endDT.toISOString() },
      },
    })

    await supabase
      .from('tasks')
      .update({ gcal_set: true, gcal_event_id: event.data.id })
      .in('id', body.taskIds)

    return Response.json({ success: true, eventId: event.data.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
