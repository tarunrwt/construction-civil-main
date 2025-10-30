-- Add cost categories to daily_reports table
ALTER TABLE daily_reports ADD COLUMN cost_category VARCHAR(100);
ALTER TABLE daily_reports ADD COLUMN labor_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN material_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN equipment_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN subcontractor_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN other_cost DECIMAL(12,2) DEFAULT 0;

-- Create photos table for DPR photo uploads
CREATE TABLE dpr_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_name VARCHAR(255),
    photo_description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_dpr_photos_daily_report_id ON dpr_photos(daily_report_id);
CREATE INDEX idx_dpr_photos_user_id ON dpr_photos(user_id);

-- Enable Row Level Security
ALTER TABLE dpr_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dpr_photos
CREATE POLICY "Users can view their own DPR photos" ON dpr_photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DPR photos" ON dpr_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DPR photos" ON dpr_photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DPR photos" ON dpr_photos
    FOR DELETE USING (auth.uid() = user_id);
