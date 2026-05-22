-- ================================================
-- KANBI  Complete Database Schema
-- Run once in Supabase Dashboard → SQL Editor
-- ================================================

-- ================================================
-- TABLES
-- ================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  has_seen_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'General',
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'wip', 'done')),
  label TEXT DEFAULT '',
  due_date DATE,
  estimate TEXT,
  gcal_set BOOLEAN DEFAULT FALSE,
  gcal_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  generations_count INTEGER NOT NULL DEFAULT 0,
  boards_used_count INTEGER NOT NULL DEFAULT 0,
  ai_used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS saved_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category VARCHAR(50) DEFAULT 'other',
  icon VARCHAR(50) DEFAULT 'file',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES saved_generations(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  urgent_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_priority TEXT CHECK (task_priority IN ('Low', 'Medium', 'High', 'Urgent')),
  time_spent_minutes INTEGER DEFAULT 60,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('workload', 'pattern', 'suggestion', 'warning')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workload_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_tasks INTEGER DEFAULT 0,
  urgent_tasks INTEGER DEFAULT 0,
  high_tasks INTEGER DEFAULT 0,
  medium_tasks INTEGER DEFAULT 0,
  low_tasks INTEGER DEFAULT 0,
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  task_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS morning_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  priorities JSONB NOT NULL,
  schedule JSONB NOT NULL,
  warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS auto_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  time_block TEXT NOT NULL,
  priority TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL,
  auto_adjusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autopilot_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('reschedule', 'reprioritize', 'delegate', 'defer', 'break_down', 'add_break')),
  task_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autopilot_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '17:00',
  break_duration INTEGER DEFAULT 15,
  max_daily_tasks INTEGER DEFAULT 8,
  auto_reschedule BOOLEAN DEFAULT TRUE,
  auto_prioritize BOOLEAN DEFAULT TRUE,
  briefing_time TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

-- boards
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- saved_generations
CREATE INDEX IF NOT EXISTS idx_saved_generations_user_id ON saved_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_generations_created_at ON saved_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_generations_favorite ON saved_generations(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_generations_category ON saved_generations(user_id, category);

-- board_tags
CREATE INDEX IF NOT EXISTS idx_board_tags_board_id ON board_tags(board_id);

-- task_stats
CREATE INDEX IF NOT EXISTS idx_task_stats_user_id ON task_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_task_stats_user_date ON task_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_stats_date ON task_stats(date DESC);

-- integrations
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- task_completions
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON task_completions(user_id, completed_at);

-- ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON ai_insights(user_id, is_read);

-- workload_snapshots
CREATE INDEX IF NOT EXISTS idx_workload_snapshots_user_date ON workload_snapshots(user_id, date);

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date ON chat_messages(user_id, created_at);

-- autopilot
CREATE INDEX IF NOT EXISTS idx_autopilot_settings_user_id ON autopilot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_morning_briefings_user_date ON morning_briefings(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_auto_schedule_user_date ON auto_schedule(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_autopilot_adjustments_user ON autopilot_adjustments(user_id, created_at DESC);

-- ================================================
-- FUNCTIONS
-- ================================================

-- ================================================
-- updated_at TRIGGER
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to all tables with updated_at column
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t, t
    );
  END LOOP;
END;
$$;

-- ================================================
-- FUNCTIONS
-- ================================================

CREATE OR REPLACE FUNCTION increment_generation_count(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, date, generations_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    generations_count = usage_tracking.generations_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION increment_board_usage(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, date, boards_used_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    boards_used_count = usage_tracking.boards_used_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION increment_ai_usage(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, date, ai_used_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    ai_used_count = usage_tracking.ai_used_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_avg_completion_time(p_user_id UUID, p_priority TEXT)
RETURNS INTEGER AS $$
DECLARE avg_time INTEGER;
BEGIN
  SELECT COALESCE(AVG(time_spent_minutes)::INTEGER,
    CASE p_priority
      WHEN 'Urgent' THEN 120 WHEN 'High' THEN 90
      WHEN 'Medium' THEN 60  WHEN 'Low'  THEN 30 ELSE 60
    END
  ) INTO avg_time
  FROM task_completions
  WHERE user_id = p_user_id AND task_priority = p_priority
    AND completed_at > NOW() - INTERVAL '30 days';
  RETURN avg_time;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_daily_task_average(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE avg_tasks DECIMAL;
BEGIN
  SELECT COALESCE(AVG(daily_count), 0) INTO avg_tasks
  FROM (
    SELECT DATE(completed_at) as completion_date, COUNT(*) as daily_count
    FROM task_completions
    WHERE user_id = p_user_id AND completed_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(completed_at)
  ) daily_stats;
  RETURN avg_tasks;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION cleanup_old_ai_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM task_completions   WHERE completed_at < NOW() - INTERVAL '90 days';
  DELETE FROM ai_insights        WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days';
  DELETE FROM workload_snapshots WHERE date < CURRENT_DATE - INTERVAL '60 days';
  DELETE FROM chat_messages      WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM usage_tracking     WHERE date < CURRENT_DATE - INTERVAL '90 days';
  DELETE FROM autopilot_adjustments WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = NOW();

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

  INSERT INTO public.autopilot_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ================================================
-- TRIGGERS
-- ================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_generations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_stats              ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_briefings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_schedule           ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_adjustments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- boards
DROP POLICY IF EXISTS "Users can view own boards"   ON boards;
DROP POLICY IF EXISTS "Users can insert own boards" ON boards;
DROP POLICY IF EXISTS "Users can update own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete own boards" ON boards;
CREATE POLICY "Users can view own boards"   ON boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own boards" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boards" ON boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boards" ON boards FOR DELETE USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "Users can view own tasks"   ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can view own tasks"   ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Users can view own subscription"   ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"   ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- usage_tracking
DROP POLICY IF EXISTS "Users can view own usage"   ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage"   ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- saved_generations
DROP POLICY IF EXISTS "Users can view own saved boards"   ON saved_generations;
DROP POLICY IF EXISTS "Users can insert own saved boards" ON saved_generations;
DROP POLICY IF EXISTS "Users can update own saved boards" ON saved_generations;
DROP POLICY IF EXISTS "Users can delete own saved boards" ON saved_generations;
CREATE POLICY "Users can view own saved boards"   ON saved_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved boards" ON saved_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved boards" ON saved_generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved boards" ON saved_generations FOR DELETE USING (auth.uid() = user_id);

-- board_tags
DROP POLICY IF EXISTS "Users can view tags for own boards"   ON board_tags;
DROP POLICY IF EXISTS "Users can insert tags for own boards" ON board_tags;
DROP POLICY IF EXISTS "Users can delete tags for own boards" ON board_tags;
CREATE POLICY "Users can view tags for own boards"   ON board_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM saved_generations WHERE id = board_tags.board_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert tags for own boards" ON board_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM saved_generations WHERE id = board_tags.board_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete tags for own boards" ON board_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM saved_generations WHERE id = board_tags.board_id AND user_id = auth.uid()));

-- task_stats
DROP POLICY IF EXISTS "Users can view own task stats"   ON task_stats;
DROP POLICY IF EXISTS "Users can insert own task stats" ON task_stats;
DROP POLICY IF EXISTS "Users can update own task stats" ON task_stats;
CREATE POLICY "Users can view own task stats"   ON task_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task stats" ON task_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task stats" ON task_stats FOR UPDATE USING (auth.uid() = user_id);

-- integrations
DROP POLICY IF EXISTS "Users can view their own integrations"   ON integrations;
DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;
CREATE POLICY "Users can view their own integrations"   ON integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own integrations" ON integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations" ON integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own integrations" ON integrations FOR DELETE USING (auth.uid() = user_id);

-- task_completions
DROP POLICY IF EXISTS "Users can view own completions"   ON task_completions;
DROP POLICY IF EXISTS "Users can insert own completions" ON task_completions;
CREATE POLICY "Users can view own completions"   ON task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ai_insights
DROP POLICY IF EXISTS "Users can view own insights"   ON ai_insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON ai_insights;
CREATE POLICY "Users can view own insights"   ON ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON ai_insights FOR DELETE USING (auth.uid() = user_id);

-- workload_snapshots
DROP POLICY IF EXISTS "Users can view own snapshots"   ON workload_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON workload_snapshots;
DROP POLICY IF EXISTS "Users can update own snapshots" ON workload_snapshots;
CREATE POLICY "Users can view own snapshots"   ON workload_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON workload_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON workload_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- chat_messages
DROP POLICY IF EXISTS "Users can view own messages"   ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can view own messages"   ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- morning_briefings
DROP POLICY IF EXISTS "Users can view own briefings"   ON morning_briefings;
DROP POLICY IF EXISTS "Users can insert own briefings" ON morning_briefings;
DROP POLICY IF EXISTS "Users can update own briefings" ON morning_briefings;
CREATE POLICY "Users can view own briefings"   ON morning_briefings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own briefings" ON morning_briefings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own briefings" ON morning_briefings FOR UPDATE USING (auth.uid() = user_id);

-- auto_schedule
DROP POLICY IF EXISTS "Users can view own schedule"   ON auto_schedule;
DROP POLICY IF EXISTS "Users can insert own schedule" ON auto_schedule;
DROP POLICY IF EXISTS "Users can update own schedule" ON auto_schedule;
DROP POLICY IF EXISTS "Users can delete own schedule" ON auto_schedule;
CREATE POLICY "Users can view own schedule"   ON auto_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON auto_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON auto_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON auto_schedule FOR DELETE USING (auth.uid() = user_id);

-- autopilot_adjustments
DROP POLICY IF EXISTS "Users can view own adjustments"   ON autopilot_adjustments;
DROP POLICY IF EXISTS "Users can insert own adjustments" ON autopilot_adjustments;
CREATE POLICY "Users can view own adjustments"   ON autopilot_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own adjustments" ON autopilot_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- autopilot_settings
DROP POLICY IF EXISTS "Users can view own settings"   ON autopilot_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON autopilot_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON autopilot_settings;
CREATE POLICY "Users can view own settings"   ON autopilot_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON autopilot_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON autopilot_settings FOR UPDATE USING (auth.uid() = user_id);

-- processed_webhook_events (service-level access only)
DROP POLICY IF EXISTS "Allow all webhook events" ON processed_webhook_events;

-- ================================================
-- STORAGE
-- ================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own files"   ON storage.objects FOR SELECT
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- DONE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ KANBI schema applied successfully.';
END $$;
