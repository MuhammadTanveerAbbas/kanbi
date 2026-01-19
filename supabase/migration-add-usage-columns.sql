-- Migration: Add boards_used_count and ai_used_count columns to usage_tracking table
-- Run this in Supabase SQL Editor if you're getting "column does not exist" errors

-- Add boards_used_count column if missing
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS boards_used_count INTEGER NOT NULL DEFAULT 0;

-- Add ai_used_count column if missing
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS ai_used_count INTEGER NOT NULL DEFAULT 0;

-- Verify the columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'usage_tracking'
AND column_name IN ('boards_used_count', 'ai_used_count');
