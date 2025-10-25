-- Final Storage Fix - Handles All Existing Policies
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dpr-photos', 'dpr-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop ALL existing storage policies to avoid conflicts
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- 3. Create simple, working RLS policies
CREATE POLICY "Allow all authenticated users to dpr-photos" ON storage.objects
FOR ALL USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

-- 4. Create dpr_photos table if it doesn't exist
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

-- 5. Enable RLS on dpr_photos
ALTER TABLE dpr_photos ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing dpr_photos policies
DROP POLICY IF EXISTS "Users can view their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON dpr_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON dpr_photos;

-- 7. Create dpr_photos RLS policies
CREATE POLICY "Users can manage their own photos" ON dpr_photos
FOR ALL USING (auth.uid() = user_id);

-- 8. Create helper functions
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
