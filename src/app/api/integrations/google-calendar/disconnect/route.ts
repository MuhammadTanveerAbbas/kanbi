import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Revoke token with Google
  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .single();

  if (integration?.access_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.access_token}`, {
        method: "POST",
      });
    } catch { /* non-blocking */ }
  }

  await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "google_calendar");

  return NextResponse.json({ success: true });
}
