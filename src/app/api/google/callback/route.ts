import { google } from 'googleapis'

import { createClient } from '@/lib/supabase/server'

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
)

export async function GET(req: Request): Promise<Response> {
  try {
    const code = new URL(req.url).searchParams.get('code')
    if (!code) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gcal=error`)

    const { tokens } = await oauth2.getToken(code)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in`)

    await supabase
      .from('integrations')
      .upsert(
        {
          user_id: user.id,
          provider: 'google_calendar',
          access_token: tokens.access_token ?? '',
          refresh_token: tokens.refresh_token ?? null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        },
        { onConflict: 'user_id,provider' }
      )

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gcal=connected`)
  } catch {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gcal=error`)
  }
}
