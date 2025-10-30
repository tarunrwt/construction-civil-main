-- Complete System Setup - Fixes Everything
-- Run this ONE script in Supabase SQL Editor to fix all issues

-- 1. DROP ALL EXISTING POLICIES TO AVOID CONFLICTS
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop all storage policies
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
    
    -- Drop all user_roles policies
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_roles', policy_name);
    END LOOP;
    
    -- Drop all user_project_assignments policies
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'user_project_assignments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_project_assignments', policy_name);
    END LOOP;
    
    -- Drop all dpr_photos policies
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'dpr_photos' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON dpr_photos', policy_name);
    END LOOP;
    
    -- Drop all notifications policies
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', policy_name);
    END LOOP;
END $$;

-- 2. CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dpr-photos', 'dpr-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. CREATE SIMPLE STORAGE POLICIES
CREATE POLICY "Allow all authenticated users to dpr-photos" ON storage.objects
FOR ALL USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

-- 4. CREATE/FIX USER_ROLES TABLE
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE/FIX USER_PROJECT_ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS user_project_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- 6. CREATE/FIX DPR_PHOTOS TABLE
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

-- 7. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ENABLE RLS ON ALL TABLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpr_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 9. CREATE SIMPLE RLS POLICIES (NO RECURSION)
CREATE POLICY "Allow authenticated users to manage roles" ON user_roles
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage assignments" ON user_project_assignments
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage photos" ON dpr_photos
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage notifications" ON notifications
FOR ALL USING (auth.role() = 'authenticated');

-- 10. INSERT DEFAULT ROLES
INSERT INTO user_roles (name, description, permissions) VALUES
('Admin', 'Full system access', '["read_reports", "create_reports", "edit_reports", "delete_reports", "view_photos", "upload_photos", "manage_users", "view_analytics", "manage_projects"]'),
('Project Manager', 'Project oversight and reporting', '["read_reports", "create_reports", "edit_reports", "view_photos", "upload_photos", "view_analytics", "manage_projects"]'),
('Site Engineer', 'Daily reporting and progress tracking', '["read_reports", "create_reports", "edit_reports", "view_photos", "upload_photos"]'),
('Foreman', 'Team management and basic reporting', '["read_reports", "create_reports", "view_photos"]'),
('Worker', 'Basic access to assigned tasks', '["read_reports", "view_photos"]')
ON CONFLICT (name) DO NOTHING;

-- 11. CREATE HELPER FUNCTIONS FOR PHOTOS
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

-- 12. CREATE NOTIFICATION HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR,
    p_message TEXT,
    p_type VARCHAR DEFAULT 'info',
    p_action_url VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (p_user_id, p_title, p_message, p_type, p_action_url)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_dpr_photos_daily_report_id ON dpr_photos(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_dpr_photos_user_id ON dpr_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_dpr_photos_created_at ON dpr_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user_id ON user_project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_project_id ON user_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 14. INSERT SAMPLE NOTIFICATIONS FOR TESTING
INSERT INTO notifications (user_id, title, message, type, action_url) 
SELECT 
    auth.uid(),
    'Welcome to Construction Management System',
    'Your account has been set up successfully. You can now start managing your construction projects.',
    'success',
    '/admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- 15. INSERT ADDITIONAL SAMPLE NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, action_url) 
SELECT 
    auth.uid(),
    'System Update Available',
    'A new version of the construction management system is available with improved features.',
    'info',
    '/admin'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
