-- Manual Database Reset Script
-- This script will delete all existing tables and recreate them with proper schema

-- Drop all existing tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_project_assignments CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS material_purchases CASCADE;
DROP TABLE IF EXISTS material_usage CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_material_stock_on_usage() CASCADE;
DROP FUNCTION IF EXISTS update_material_stock_on_purchase() CASCADE;
DROP FUNCTION IF EXISTS get_user_project_role(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_has_permission(UUID, UUID, TEXT) CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    target_end_date DATE,
    total_cost DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create daily_reports table
CREATE TABLE daily_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    weather VARCHAR(100),
    manpower_count INTEGER,
    machinery_used TEXT,
    work_completed TEXT,
    material_used TEXT,
    safety_incidents TEXT,
    remarks TEXT,
    stage VARCHAR(100),
    floor VARCHAR(20),
    cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    material_cost DECIMAL(10,2),
    equipment_cost DECIMAL(10,2),
    subcontractor_cost DECIMAL(10,2),
    other_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create materials table
CREATE TABLE materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    min_stock_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create material_usage table
CREATE TABLE material_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    daily_report_id UUID REFERENCES daily_reports(id) ON DELETE SET NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    usage_date DATE NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create material_purchases table
CREATE TABLE material_purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity_purchased DECIMAL(10,2) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(255),
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_roles table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create user_project_assignments table
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

-- 8. Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX idx_material_usage_user_id ON material_usage(user_id);
CREATE INDEX idx_material_purchases_material_id ON material_purchases(material_id);
CREATE INDEX idx_material_purchases_user_id ON material_purchases(user_id);
CREATE INDEX idx_user_roles_name ON user_roles(name);
CREATE INDEX idx_user_project_assignments_user_id ON user_project_assignments(user_id);
CREATE INDEX idx_user_project_assignments_project_id ON user_project_assignments(project_id);
CREATE INDEX idx_user_project_assignments_role_id ON user_project_assignments(role_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_reports
CREATE POLICY "Users can view their own reports" ON daily_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON daily_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON daily_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for materials
CREATE POLICY "Users can view their own materials" ON materials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" ON materials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials" ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for material_usage
CREATE POLICY "Users can view their own material usage" ON material_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material usage" ON material_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material usage" ON material_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material usage" ON material_usage
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for material_purchases
CREATE POLICY "Users can view their own material purchases" ON material_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material purchases" ON material_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material purchases" ON material_purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material purchases" ON material_purchases
    FOR DELETE USING (auth.uid() = user_id);

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

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for stock management
CREATE OR REPLACE FUNCTION update_material_stock_on_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock - NEW.quantity_used,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_material_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity_purchased,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for stock management
CREATE TRIGGER update_stock_on_material_usage
    AFTER INSERT ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_usage();

CREATE TRIGGER update_stock_on_material_purchase
    AFTER INSERT ON material_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_purchase();

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

-- Insert default user roles
INSERT INTO user_roles (name, description, permissions) VALUES
('Project Manager', 'Full access to all project features', '["create_projects", "edit_projects", "delete_projects", "view_all_reports", "submit_dpr", "manage_materials", "view_financials", "manage_users"]'),
('Site Supervisor', 'Can submit DPRs and view assigned project reports', '["submit_dpr", "view_assigned_reports", "view_materials"]'),
('Site Engineer', 'Can submit DPRs and view project progress', '["submit_dpr", "view_assigned_reports"]'),
('Admin', 'System administrator with full access', '["*"]');

-- Insert sample project (optional - remove if you don't want sample data)
INSERT INTO projects (name, description, start_date, target_end_date, total_cost, user_id) VALUES
('Sample Construction Project', 'A sample project for testing the application', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 100000.00, (SELECT id FROM auth.users LIMIT 1));

-- Insert sample materials (optional - remove if you don't want sample data)
INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, min_stock_level, current_stock, user_id) VALUES
('Cement', 'Portland cement for construction', 'Cement & Concrete', 'kg', 8.50, 'ABC Suppliers', 1000, 2000, (SELECT id FROM auth.users LIMIT 1)),
('Steel Rods', 'Reinforcement steel rods', 'Steel & Reinforcement', 'kg', 65.00, 'Steel Corp', 500, 1000, (SELECT id FROM auth.users LIMIT 1)),
('Bricks', 'Red clay bricks', 'Bricks & Blocks', 'pieces', 12.00, 'Brick Works', 5000, 10000, (SELECT id FROM auth.users LIMIT 1));
