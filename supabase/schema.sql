-- ================================================
-- KANBI - Complete Database Schema
-- ================================================
-- Run this ONCE in Supabase SQL Editor
-- Works for both new and existing databases
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLES
-- ================================================

-- Profiles table
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

-- Subscriptions table
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

-- Usage tracking table
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

-- Saved boards table
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

-- Board tags table
CREATE TABLE IF NOT EXISTS board_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES saved_generations(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task statistics table
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

-- Webhook events table (Stripe idempotency)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-- Reset daily usage (cleanup old records)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS VOID AS $$
BEGIN
  DELETE FROM usage_tracking WHERE date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

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
