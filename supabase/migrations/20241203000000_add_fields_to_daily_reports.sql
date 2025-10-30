-- Add new fields to daily_reports table and rename existing ones to match application code

-- Rename existing columns to match the application code
ALTER TABLE daily_reports RENAME COLUMN material_used TO materials_used;
ALTER TABLE daily_reports RENAME COLUMN machinery TO machinery_used;

-- Add new fields if they don't exist
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS safety_incidents TEXT;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS remarks TEXT;
