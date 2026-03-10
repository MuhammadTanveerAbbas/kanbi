import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth code exchange error:', error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    // Redirect to dashboard after successful OAuth
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Auth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
