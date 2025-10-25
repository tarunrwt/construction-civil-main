-- Fix Data Isolation Between Admin Users
-- This script ensures each admin can only see their own data

-- First, let's check and fix the RLS policies to ensure proper data isolation

-- Drop existing policies to recreate them with proper isolation
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON daily_reports;

DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;

DROP POLICY IF EXISTS "Users can view their own material usage" ON material_usage;
DROP POLICY IF EXISTS "Users can insert their own material usage" ON material_usage;
DROP POLICY IF EXISTS "Users can update their own material usage" ON material_usage;
DROP POLICY IF EXISTS "Users can delete their own material usage" ON material_usage;

DROP POLICY IF EXISTS "Users can view their own material purchases" ON material_purchases;
DROP POLICY IF EXISTS "Users can insert their own material purchases" ON material_purchases;
DROP POLICY IF EXISTS "Users can update their own material purchases" ON material_purchases;
DROP POLICY IF EXISTS "Users can delete their own material purchases" ON material_purchases;

DROP POLICY IF EXISTS "Users can view their own assignments" ON user_project_assignments;
DROP POLICY IF EXISTS "Project managers can view assignments for their projects" ON user_project_assignments;
DROP POLICY IF EXISTS "Project managers can manage assignments" ON user_project_assignments;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Recreate RLS policies with STRICT user isolation

-- Projects policies - STRICT user isolation
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Daily reports policies - STRICT user isolation
CREATE POLICY "Users can view their own reports" ON daily_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON daily_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON daily_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Materials policies - STRICT user isolation
CREATE POLICY "Users can view their own materials" ON materials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" ON materials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials" ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- Material usage policies - STRICT user isolation
CREATE POLICY "Users can view their own material usage" ON material_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material usage" ON material_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material usage" ON material_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material usage" ON material_usage
    FOR DELETE USING (auth.uid() = user_id);

-- Material purchases policies - STRICT user isolation
CREATE POLICY "Users can view their own material purchases" ON material_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material purchases" ON material_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material purchases" ON material_purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material purchases" ON material_purchases
    FOR DELETE USING (auth.uid() = user_id);

-- User project assignments policies - STRICT user isolation
CREATE POLICY "Users can view their own assignments" ON user_project_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments" ON user_project_assignments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON user_project_assignments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON user_project_assignments
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies - STRICT user isolation
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies - Keep as is (global access for role management)
-- These should remain as they are since roles are shared across the system

-- Verify RLS is enabled on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a function to verify data isolation
CREATE OR REPLACE FUNCTION verify_user_data_isolation()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    user_records BIGINT,
    current_user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'projects'::TEXT,
        (SELECT COUNT(*) FROM projects),
        (SELECT COUNT(*) FROM projects WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'daily_reports'::TEXT,
        (SELECT COUNT(*) FROM daily_reports),
        (SELECT COUNT(*) FROM daily_reports WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'materials'::TEXT,
        (SELECT COUNT(*) FROM materials),
        (SELECT COUNT(*) FROM materials WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'material_usage'::TEXT,
        (SELECT COUNT(*) FROM material_usage),
        (SELECT COUNT(*) FROM material_usage WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'material_purchases'::TEXT,
        (SELECT COUNT(*) FROM material_purchases),
        (SELECT COUNT(*) FROM material_purchases WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'user_project_assignments'::TEXT,
        (SELECT COUNT(*) FROM user_project_assignments),
        (SELECT COUNT(*) FROM user_project_assignments WHERE user_id = auth.uid()),
        auth.uid()
    UNION ALL
    SELECT 
        'notifications'::TEXT,
        (SELECT COUNT(*) FROM notifications),
        (SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid()),
        auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the isolation by running this function
-- SELECT * FROM verify_user_data_isolation();
