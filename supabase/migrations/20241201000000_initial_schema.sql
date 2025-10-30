-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    target_end_date DATE,
    total_cost DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_reports table
CREATE TABLE daily_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    weather VARCHAR(100),
    manpower INTEGER,
    work_completed TEXT,
    cost DECIMAL(12,2),
    floor VARCHAR(20),
    stage VARCHAR(100),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, report_date, user_id)
);

-- Create project_stages table for tracking construction stages
CREATE TABLE project_stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, stage_name, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_report_date ON daily_reports(report_date);
CREATE INDEX idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX idx_project_stages_user_id ON project_stages(user_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view their own daily reports" ON daily_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily reports" ON daily_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily reports" ON daily_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily reports" ON daily_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_stages
CREATE POLICY "Users can view their own project stages" ON project_stages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project stages" ON project_stages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project stages" ON project_stages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project stages" ON project_stages
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_stages_updated_at BEFORE UPDATE ON project_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default project stages for new projects
CREATE OR REPLACE FUNCTION create_default_project_stages()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_stages (project_id, stage_name, stage_order, user_id) VALUES
    (NEW.id, 'Site Preparation', 1, NEW.user_id),
    (NEW.id, 'Excavation', 2, NEW.user_id),
    (NEW.id, 'Foundation Work', 3, NEW.user_id),
    (NEW.id, 'Plinth Work', 4, NEW.user_id),
    (NEW.id, 'Superstructure Work', 5, NEW.user_id),
    (NEW.id, 'Roof Work', 6, NEW.user_id),
    (NEW.id, 'Flooring Work', 7, NEW.user_id),
    (NEW.id, 'Plastering', 8, NEW.user_id),
    (NEW.id, 'Door & Window Work', 9, NEW.user_id),
    (NEW.id, 'Electrical & Plumbing Work', 10, NEW.user_id),
    (NEW.id, 'Painting & Finishing Work', 11, NEW.user_id),
    (NEW.id, 'Completed', 12, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create default stages for new projects
CREATE TRIGGER create_default_stages_on_project_insert
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_project_stages();
