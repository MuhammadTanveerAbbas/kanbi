import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getValidToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .single();

  if (!integration) return null;

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
      await supabase.from("integrations").update({
        access_token: tokens.access_token,
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId).eq("provider", "google_calendar");
      return tokens.access_token as string;
    }
    return null; // refresh failed
  }

  return integration.access_token as string;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidToken(supabase, user.id);
  if (!token) return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });

  // Fetch tasks with due dates from the tasks table (not boards.tasks column)
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, gcal_set, gcal_event_id")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .eq("gcal_set", false) // only sync tasks not yet pushed
    .order("due_date", { ascending: true })
    .limit(50);

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 });
  if (!tasks?.length) return NextResponse.json({ success: true, synced: 0, message: "No tasks with due dates to sync" });

  let synced = 0;
  const syncedIds: string[] = [];

  for (const task of tasks) {
    try {
      const dueDate = new Date(task.due_date);
      const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // +1 hour

      const eventRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
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

      if (eventRes.ok) {
        const event = await eventRes.json();
        syncedIds.push(task.id);
        // Mark task as synced with the calendar event ID
        await supabase.from("tasks").update({
          gcal_set: true,
          gcal_event_id: event.id,
        }).eq("id", task.id);
        synced++;
      }
    } catch {
      // Skip individual failures, continue with rest
    }
  }

  return NextResponse.json({ success: true, synced });
}
