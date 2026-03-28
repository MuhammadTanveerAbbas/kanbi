import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false });

  const { data } = await supabase
    .from("user_integrations")
    .select("connected_at")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .single();

  return NextResponse.json({ connected: !!data });
}
