-- Complete Photo Management System
-- This script creates the database structure for storing and managing DPR photos

-- Create dpr_photos table to store photo references
CREATE TABLE IF NOT EXISTS dpr_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    description TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dpr_photos_daily_report_id ON dpr_photos(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_dpr_photos_user_id ON dpr_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_dpr_photos_created_at ON dpr_photos(created_at);

-- Enable Row Level Security
ALTER TABLE dpr_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON dpr_photos;

-- Create RLS policies for dpr_photos
CREATE POLICY "Users can view their own photos" ON dpr_photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos" ON dpr_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" ON dpr_photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" ON dpr_photos
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to get photos for a specific report
CREATE OR REPLACE FUNCTION get_report_photos(report_id UUID)
RETURNS TABLE(
    id UUID,
    file_name VARCHAR,
    public_url VARCHAR,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id,
        dp.file_name,
        dp.public_url,
        dp.description,
        dp.created_at
    FROM dpr_photos dp
    WHERE dp.daily_report_id = report_id
    AND dp.user_id = auth.uid()
    ORDER BY dp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all photos for a user
CREATE OR REPLACE FUNCTION get_user_photos()
RETURNS TABLE(
    id UUID,
    daily_report_id UUID,
    file_name VARCHAR,
    public_url VARCHAR,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    report_date DATE,
    project_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id,
        dp.daily_report_id,
        dp.file_name,
        dp.public_url,
        dp.description,
        dp.created_at,
        dr.report_date,
        p.name as project_name
    FROM dpr_photos dp
    JOIN daily_reports dr ON dp.daily_report_id = dr.id
    JOIN projects p ON dr.project_id = p.id
    WHERE dp.user_id = auth.uid()
    ORDER BY dp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
