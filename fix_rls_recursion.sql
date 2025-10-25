-- Fix RLS Infinite Recursion in User Management
-- This script fixes the circular RLS policy references

-- 1. Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own assignments" ON user_project_assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON user_project_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON user_project_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON user_project_assignments;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON user_roles;

-- 2. Create simple, non-recursive RLS policies for user_roles
CREATE POLICY "Allow authenticated users to view roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert roles" ON user_roles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update roles" ON user_roles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete roles" ON user_roles
FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create simple, non-recursive RLS policies for user_project_assignments
CREATE POLICY "Allow authenticated users to view assignments" ON user_project_assignments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert assignments" ON user_project_assignments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update assignments" ON user_project_assignments
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete assignments" ON user_project_assignments
FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_project_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- 5. Enable RLS on both tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Insert default roles if they don't exist
INSERT INTO user_roles (name, description, permissions) VALUES
('Admin', 'Full system access', '["read_reports", "create_reports", "edit_reports", "delete_reports", "view_photos", "upload_photos", "manage_users", "view_analytics", "manage_projects"]'),
('Project Manager', 'Project oversight and reporting', '["read_reports", "create_reports", "edit_reports", "view_photos", "upload_photos", "view_analytics", "manage_projects"]'),
('Site Engineer', 'Daily reporting and progress tracking', '["read_reports", "create_reports", "edit_reports", "view_photos", "upload_photos"]'),
('Foreman', 'Team management and basic reporting', '["read_reports", "create_reports", "view_photos"]'),
('Worker', 'Basic access to assigned tasks', '["read_reports", "view_photos"]')
ON CONFLICT (name) DO NOTHING;
