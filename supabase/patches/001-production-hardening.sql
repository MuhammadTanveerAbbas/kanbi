-- Production hardening patch for existing Kanbi databases.
-- Safe to run multiple times (uses IF EXISTS / conditional logic where possible).
-- Run in Supabase SQL Editor after deploying the updated app.

-- 1. Remove Google Calendar columns from tasks (if present)
ALTER TABLE public.tasks DROP COLUMN IF EXISTS gcal_set;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS gcal_event_id;

-- 2. Drop integrations table (removed in v1)
DROP TABLE IF EXISTS public.integrations CASCADE;

-- 3. Prevent users from updating their own subscription plan (Stripe webhooks only)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- 4. Restrict processed_webhook_events to service role (no open user policy)
DROP POLICY IF EXISTS "Allow all for processed_webhook_events" ON public.processed_webhook_events;

-- 5. Ensure every user has a default board
INSERT INTO public.boards (user_id, name, description)
SELECT p.id, 'My Board', 'Default board'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.boards b WHERE b.user_id = p.id
);

-- 6. Backfill orphan tasks missing board_id (assign to user's first board)
UPDATE public.tasks t
SET board_id = (
  SELECT b.id FROM public.boards b
  WHERE b.user_id = t.user_id
  ORDER BY b.created_at ASC
  LIMIT 1
)
WHERE t.board_id IS NULL
  AND EXISTS (SELECT 1 FROM public.boards b WHERE b.user_id = t.user_id);

-- 7. Delete tasks that still have no board (orphaned, no board to attach)
DELETE FROM public.tasks WHERE board_id IS NULL;
