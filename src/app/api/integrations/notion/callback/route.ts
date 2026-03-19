import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect('/login?error=unauthorized');
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`/dashboard/settings?error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/settings?error=no_code');
    }

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect('/dashboard/settings?error=config_missing');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Notion token error:', errorData);
      return NextResponse.redirect('/dashboard/settings?error=token_failed');
    }

    const tokenData = await tokenResponse.json();

    await supabase.from('integrations').upsert({
      user_id: user.id,
      provider: 'notion',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: null,
      metadata: {
        workspace_id: tokenData.workspace_id,
        workspace_name: tokenData.workspace_name,
        bot_id: tokenData.bot_id,
      },
    });

    return NextResponse.redirect('/dashboard/settings?success=notion_connected');
  } catch (error: any) {
    console.error('Notion callback error:', error);
    return NextResponse.redirect('/dashboard/settings?error=callback_failed');
  }
}
