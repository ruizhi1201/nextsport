-- Migration: Add new analysis fields to swing_analyses table
-- Run this in the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/kpahmlhkvmasyobwrewy/sql/new

ALTER TABLE swing_analyses ADD COLUMN IF NOT EXISTS scores JSONB;
ALTER TABLE swing_analyses ADD COLUMN IF NOT EXISTS comments_and_annotations JSONB;
ALTER TABLE swing_analyses ADD COLUMN IF NOT EXISTS swing_result TEXT;
ALTER TABLE swing_analyses ADD COLUMN IF NOT EXISTS training_priorities TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'swing_analyses' 
ORDER BY ordinal_position;
