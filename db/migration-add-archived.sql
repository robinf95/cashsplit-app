-- Migration script to add archived column to expenses table
-- Run this on existing databases that don't have the archived column

-- Add archived column with default value false
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Create index for better performance when filtering by archived status
CREATE INDEX IF NOT EXISTS idx_expenses_archived ON expenses(archived);
CREATE INDEX IF NOT EXISTS idx_expenses_group_archived ON expenses(group_id, archived);
