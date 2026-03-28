import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getValidToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .single();

  if (!integration) return null;

  // Refresh if expired
  const isExpired = integration.expires_at
    ? new Date(integration.expires_at) < new Date(Date.now() + 60_000)
    : false;

  if (isExpired && integration.refresh_token) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: integration.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tokens = await res.json();
    if (tokens.access_token) {
      await supabase.from("user_integrations").update({
        access_token: tokens.access_token,
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      }).eq("user_id", userId).eq("provider", "google_calendar");
      return tokens.access_token as string;
    }
  }

  return integration.access_token as string;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidToken(supabase, user.id);
  if (!token) return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });

  // Fetch tasks with due dates from the most recent board
  const { data: boards } = await supabase
    .from("boards")
    .select("tasks")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  const tasks: Array<{ title: string; dueDate?: string; priority?: string }> =
    boards?.[0]?.tasks ?? [];

  const tasksWithDates = tasks.filter(t => t.dueDate);
  let synced = 0;

  for (const task of tasksWithDates) {
    try {
      const dueDate = new Date(task.dueDate!);
      const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // +1 hour

      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `[Kanbi] ${task.title}`,
          description: `Priority: ${task.priority ?? "medium"} — synced from Kanbi`,
          start: { dateTime: dueDate.toISOString() },
          end: { dateTime: endDate.toISOString() },
          reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 30 }],
          },
        }),
      });
      synced++;
    } catch {
      // Skip individual failures
    }
  }

  return NextResponse.json({ success: true, synced });
}
