-- ================================================
-- KANBI - Complete Unified Database Schema
-- ================================================
-- AI-Powered Task Management SaaS Platform
-- Run this ONCE in Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CORE TABLES
-- ================================================

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  has_seen_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;

-- Subscription management
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Usage tracking and limits
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  generations_count INTEGER NOT NULL DEFAULT 0,
  boards_used_count INTEGER NOT NULL DEFAULT 0,
  ai_used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS boards_used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS ai_used_count INTEGER NOT NULL DEFAULT 0;

-- Saved boards
CREATE TABLE IF NOT EXISTS saved_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category VARCHAR(50) DEFAULT 'other',
  icon VARCHAR(50) DEFAULT 'file',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_generations ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE saved_generations ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';
ALTER TABLE saved_generations ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'file';
ALTER TABLE saved_generations ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Board tags
CREATE TABLE IF NOT EXISTS board_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES saved_generations(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task statistics
CREATE TABLE IF NOT EXISTS task_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Webhook events (Stripe idempotency)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INTEGRATIONS TABLE
-- ================================================

-- Integrations table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ================================================
-- AI WORKLOAD MANAGEMENT TABLES
-- ================================================

-- Task completion tracking for AI learning
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_priority TEXT CHECK (task_priority IN ('Low', 'Medium', 'High', 'Urgent')),
  time_spent_minutes INTEGER DEFAULT 60,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('workload', 'pattern', 'suggestion', 'warning')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily workload snapshots
CREATE TABLE IF NOT EXISTS workload_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- AI chat assistant messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  task_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- AI AUTOPILOT TABLES
-- ================================================

-- Morning briefings
CREATE TABLE IF NOT EXISTS morning_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  priorities JSONB NOT NULL,
  schedule JSONB NOT NULL,
  warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Auto-scheduled tasks
CREATE TABLE IF NOT EXISTS auto_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Autopilot adjustments log
CREATE TABLE IF NOT EXISTS autopilot_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('reschedule', 'reprioritize', 'delegate', 'defer')),
  task_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autopilot user settings
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

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_saved_generations_user_id ON saved_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_generations_created_at ON saved_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_generations_favorite ON saved_generations(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_generations_category ON saved_generations(user_id, category);
CREATE INDEX IF NOT EXISTS idx_board_tags_board_id ON board_tags(board_id);
CREATE INDEX IF NOT EXISTS idx_task_stats_user_date ON task_stats(user_id, date);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON task_completions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON ai_insights(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_workload_snapshots_user_date ON workload_snapshots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date ON chat_messages(user_id, created_at);

-- Autopilot indexes
CREATE INDEX IF NOT EXISTS idx_morning_briefings_user_date ON morning_briefings(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_auto_schedule_user_date ON auto_schedule(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_autopilot_adjustments_user ON autopilot_adjustments(user_id, created_at DESC);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Increment generation count
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

-- Increment board usage
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

-- Increment AI usage
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

-- Calculate average completion time by priority
CREATE OR REPLACE FUNCTION get_avg_completion_time(p_user_id UUID, p_priority TEXT)
RETURNS INTEGER AS $$
DECLARE
  avg_time INTEGER;
BEGIN
  SELECT COALESCE(AVG(time_spent_minutes)::INTEGER, 
    CASE p_priority
      WHEN 'Urgent' THEN 120
      WHEN 'High' THEN 90
      WHEN 'Medium' THEN 60
      WHEN 'Low' THEN 30
      ELSE 60
    END
  ) INTO avg_time
  FROM task_completions
  WHERE user_id = p_user_id 
    AND task_priority = p_priority
    AND completed_at > NOW() - INTERVAL '30 days';
  
  RETURN avg_time;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Get daily task completion average
CREATE OR REPLACE FUNCTION get_daily_task_average(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_tasks DECIMAL;
BEGIN
  SELECT COALESCE(AVG(daily_count), 0) INTO avg_tasks
  FROM (
    SELECT DATE(completed_at) as completion_date, COUNT(*) as daily_count
    FROM task_completions
    WHERE user_id = p_user_id
      AND completed_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(completed_at)
  ) daily_stats;
  
  RETURN avg_tasks;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_ai_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM task_completions WHERE completed_at < NOW() - INTERVAL '90 days';
  DELETE FROM ai_insights WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days';
  DELETE FROM workload_snapshots WHERE date < CURRENT_DATE - INTERVAL '60 days';
  DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM usage_tracking WHERE date < CURRENT_DATE - INTERVAL '90 days';
  DELETE FROM autopilot_adjustments WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

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

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Usage Tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
CREATE POLICY "Users can insert own usage" ON usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;
CREATE POLICY "Users can update own usage" ON usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- Saved Boards
ALTER TABLE saved_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saved boards" ON saved_generations;
CREATE POLICY "Users can view own saved boards" ON saved_generations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own saved boards" ON saved_generations;
CREATE POLICY "Users can insert own saved boards" ON saved_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own saved boards" ON saved_generations;
CREATE POLICY "Users can update own saved boards" ON saved_generations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own saved boards" ON saved_generations;
CREATE POLICY "Users can delete own saved boards" ON saved_generations FOR DELETE USING (auth.uid() = user_id);

-- Board Tags
ALTER TABLE board_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view tags for own boards" ON board_tags;
CREATE POLICY "Users can view tags for own boards" ON board_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM saved_generations WHERE saved_generations.id = board_tags.board_id AND saved_generations.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert tags for own boards" ON board_tags;
CREATE POLICY "Users can insert tags for own boards" ON board_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM saved_generations WHERE saved_generations.id = board_tags.board_id AND saved_generations.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete tags for own boards" ON board_tags;
CREATE POLICY "Users can delete tags for own boards" ON board_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM saved_generations WHERE saved_generations.id = board_tags.board_id AND saved_generations.user_id = auth.uid()));

-- Task Statistics
ALTER TABLE task_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own task stats" ON task_stats;
CREATE POLICY "Users can view own task stats" ON task_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own task stats" ON task_stats;
CREATE POLICY "Users can insert own task stats" ON task_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own task stats" ON task_stats;
CREATE POLICY "Users can update own task stats" ON task_stats FOR UPDATE USING (auth.uid() = user_id);

-- Integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own integrations" ON integrations;
CREATE POLICY "Users can view their own integrations" ON integrations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
CREATE POLICY "Users can insert their own integrations" ON integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
CREATE POLICY "Users can update their own integrations" ON integrations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;
CREATE POLICY "Users can delete their own integrations" ON integrations FOR DELETE USING (auth.uid() = user_id);

-- Task Completions
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own completions" ON task_completions;
CREATE POLICY "Users can view own completions" ON task_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own completions" ON task_completions;
CREATE POLICY "Users can insert own completions" ON task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Insights
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
CREATE POLICY "Users can view own insights" ON ai_insights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own insights" ON ai_insights;
CREATE POLICY "Users can insert own insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own insights" ON ai_insights;
CREATE POLICY "Users can update own insights" ON ai_insights FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own insights" ON ai_insights;
CREATE POLICY "Users can delete own insights" ON ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Workload Snapshots
ALTER TABLE workload_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own snapshots" ON workload_snapshots;
CREATE POLICY "Users can view own snapshots" ON workload_snapshots FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own snapshots" ON workload_snapshots;
CREATE POLICY "Users can insert own snapshots" ON workload_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own snapshots" ON workload_snapshots;
CREATE POLICY "Users can update own snapshots" ON workload_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Morning Briefings
ALTER TABLE morning_briefings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own briefings" ON morning_briefings;
CREATE POLICY "Users can view own briefings" ON morning_briefings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own briefings" ON morning_briefings;
CREATE POLICY "Users can insert own briefings" ON morning_briefings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own briefings" ON morning_briefings;
CREATE POLICY "Users can update own briefings" ON morning_briefings FOR UPDATE USING (auth.uid() = user_id);

-- Auto Schedule
ALTER TABLE auto_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own schedule" ON auto_schedule;
CREATE POLICY "Users can view own schedule" ON auto_schedule FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own schedule" ON auto_schedule;
CREATE POLICY "Users can insert own schedule" ON auto_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own schedule" ON auto_schedule;
CREATE POLICY "Users can update own schedule" ON auto_schedule FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own schedule" ON auto_schedule;
CREATE POLICY "Users can delete own schedule" ON auto_schedule FOR DELETE USING (auth.uid() = user_id);

-- Autopilot Adjustments
ALTER TABLE autopilot_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own adjustments" ON autopilot_adjustments;
CREATE POLICY "Users can view own adjustments" ON autopilot_adjustments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own adjustments" ON autopilot_adjustments;
CREATE POLICY "Users can insert own adjustments" ON autopilot_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Autopilot Settings
ALTER TABLE autopilot_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own settings" ON autopilot_settings;
CREATE POLICY "Users can view own settings" ON autopilot_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own settings" ON autopilot_settings;
CREATE POLICY "Users can insert own settings" ON autopilot_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON autopilot_settings;
CREATE POLICY "Users can update own settings" ON autopilot_settings FOR UPDATE USING (auth.uid() = user_id);

-- Webhook Events
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STORAGE
-- ================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ KANBI Database Schema Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Core Tables: profiles, subscriptions, usage_tracking, saved_generations, board_tags, task_stats';
  RAISE NOTICE '🔗 Integration Tables: integrations';
  RAISE NOTICE '🤖 AI Tables: task_completions, ai_insights, workload_snapshots, chat_messages';
  RAISE NOTICE '🚀 Autopilot Tables: morning_briefings, auto_schedule, autopilot_adjustments, autopilot_settings';
  RAISE NOTICE '🔒 Row Level Security: Enabled on all tables';
  RAISE NOTICE '⚡ Functions: Usage tracking, AI learning, cleanup utilities';
  RAISE NOTICE '📁 Storage: File bucket configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your KANBI database is ready to use!';
END $$;
