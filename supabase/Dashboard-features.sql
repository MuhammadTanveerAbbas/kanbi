-- Migration: Add new dashboard features tables
-- Run this AFTER the main schema.sql

-- Add is_favorite column if not exists (safe to run multiple times)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_generations' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE saved_generations ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Board tags table for task categorization
CREATE TABLE IF NOT EXISTS board_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES saved_generations(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task statistics table for analytics
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

-- New indexes
CREATE INDEX IF NOT EXISTS idx_saved_generations_favorite ON saved_generations(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_board_tags_board_id ON board_tags(board_id);
CREATE INDEX IF NOT EXISTS idx_task_stats_user_date ON task_stats(user_id, date);

-- RLS Policies for board_tags
ALTER TABLE board_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tags for own boards" ON board_tags;
CREATE POLICY "Users can view tags for own boards"
  ON board_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM saved_generations
    WHERE saved_generations.id = board_tags.board_id
    AND saved_generations.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert tags for own boards" ON board_tags;
CREATE POLICY "Users can insert tags for own boards"
  ON board_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM saved_generations
    WHERE saved_generations.id = board_tags.board_id
    AND saved_generations.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete tags for own boards" ON board_tags;
CREATE POLICY "Users can delete tags for own boards"
  ON board_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM saved_generations
    WHERE saved_generations.id = board_tags.board_id
    AND saved_generations.user_id = auth.uid()
  ));

-- RLS Policies for task_stats
ALTER TABLE task_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task stats" ON task_stats;
CREATE POLICY "Users can view own task stats"
  ON task_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task stats" ON task_stats;
CREATE POLICY "Users can insert own task stats"
  ON task_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task stats" ON task_stats;
CREATE POLICY "Users can update own task stats"
  ON task_stats FOR UPDATE
  USING (auth.uid() = user_id);
