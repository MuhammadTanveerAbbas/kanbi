import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const oauth2 = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
)

export async function GET(): Promise<Response> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
    }

    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
    })
    
    return Response.redirect(url, 302)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
