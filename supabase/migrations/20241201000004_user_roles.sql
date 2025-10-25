-- Create user_roles table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_project_assignments table for role-based project access
CREATE TABLE user_project_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Insert default roles
INSERT INTO user_roles (name, description, permissions) VALUES
('Project Manager', 'Full access to all project features', '["create_projects", "edit_projects", "delete_projects", "view_all_reports", "submit_dpr", "manage_materials", "view_financials", "manage_users"]'),
('Site Supervisor', 'Can submit DPRs and view assigned project reports', '["submit_dpr", "view_assigned_reports", "view_materials"]'),
('Site Engineer', 'Can submit DPRs and view project progress', '["submit_dpr", "view_assigned_reports"]'),
('Admin', 'System administrator with full access', '["*"]');

-- Create indexes for better performance
CREATE INDEX idx_user_roles_name ON user_roles(name);
CREATE INDEX idx_user_project_assignments_user_id ON user_project_assignments(user_id);
CREATE INDEX idx_user_project_assignments_project_id ON user_project_assignments(project_id);
CREATE INDEX idx_user_project_assignments_role_id ON user_project_assignments(role_id);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Anyone can view user roles" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_project_assignments upa
            JOIN user_roles ur ON upa.role_id = ur.id
            WHERE upa.user_id = auth.uid() 
            AND ur.permissions ? 'manage_users'
        )
    );

-- Create RLS policies for user_project_assignments
CREATE POLICY "Users can view their own assignments" ON user_project_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project managers can view assignments for their projects" ON user_project_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_project_assignments upa
            JOIN user_roles ur ON upa.role_id = ur.id
            WHERE upa.user_id = auth.uid() 
            AND upa.project_id = user_project_assignments.project_id
            AND ur.permissions ? 'manage_users'
        )
    );

CREATE POLICY "Project managers can manage assignments" ON user_project_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_project_assignments upa
            JOIN user_roles ur ON upa.role_id = ur.id
            WHERE upa.user_id = auth.uid() 
            AND upa.project_id = user_project_assignments.project_id
            AND ur.permissions ? 'manage_users'
        )
    );

-- Create function to get user role for a project
CREATE OR REPLACE FUNCTION get_user_project_role(user_uuid UUID, project_uuid UUID)
RETURNS TABLE(role_name TEXT, permissions JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.name, ur.permissions
    FROM user_project_assignments upa
    JOIN user_roles ur ON upa.role_id = ur.id
    WHERE upa.user_id = user_uuid AND upa.project_id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, project_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM get_user_project_role(user_uuid, project_uuid);
    
    -- Check if user has admin role (full access)
    IF user_permissions ? '*' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has specific permission
    RETURN user_permissions ? permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
