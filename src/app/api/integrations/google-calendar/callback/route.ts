import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging/logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const REDIRECT_URI = `${origin}/api/integrations/google-calendar/callback`;

  if (error) {
    return NextResponse.redirect(`${origin}/dashboard?cal_error=${encodeURIComponent(error)}&page=settings`);
  }

  if (!code || !userId) {
    return NextResponse.redirect(`${origin}/dashboard?cal_error=missing_params&page=settings`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      logger.error("Token exchange failed:", { error: tokens });
      throw new Error(tokens.error_description ?? "No access token returned");
    }

    const supabase = await createClient();
    const { error: dbError } = await supabase.from("integrations").upsert({
      user_id: userId,
      provider: "google_calendar",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });

    if (dbError) throw new Error(dbError.message);

    return NextResponse.redirect(`${origin}/dashboard?cal_connected=1&page=settings`);
  } catch (err: any) {
    logger.error("Google Calendar OAuth error:", { error: err.message });
    return NextResponse.redirect(
      `${origin}/dashboard?cal_error=${encodeURIComponent(err.message ?? "oauth_failed")}&page=settings`
    );
  }
}
