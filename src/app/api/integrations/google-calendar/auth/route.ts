import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GOOGLE_CLIENT_ID) {
    // Dev mode: simulate connection
    return NextResponse.json({ connected: true });
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: user.id,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.json({ url });
}
