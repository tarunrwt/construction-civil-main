-- =====================================================
-- FIX DUMMY DATA ISSUE
-- =====================================================
-- Run this script in Supabase SQL Editor to fix the dummy data issue

-- First, let's check if we have any users
DO $$
DECLARE
    user_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Total users in auth.users: %', user_count;
    
    -- Get first user
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NULL THEN
        RAISE NOTICE 'No users found! Please create a user account first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'First user ID: %', first_user_id;
    
    -- Check if we have any projects
    SELECT COUNT(*) INTO user_count FROM projects WHERE user_id = first_user_id;
    RAISE NOTICE 'Projects for first user: %', user_count;
    
    -- If no projects exist, insert sample data
    IF user_count = 0 THEN
        RAISE NOTICE 'No projects found. Inserting sample data...';
        
        -- Insert sample projects
        INSERT INTO projects (name, description, start_date, target_end_date, total_cost, status, user_id) VALUES
        ('Green Valley Residential Complex', 'A modern residential complex with 50 apartments', '2024-01-15', '2024-12-15', 25000000.00, 'active', first_user_id),
        ('City Center Mall Extension', 'Extension of existing shopping mall with new retail spaces', '2024-02-01', '2024-11-30', 15000000.00, 'active', first_user_id),
        ('Highway Bridge Construction', 'Construction of a new highway bridge over the river', '2024-03-01', '2025-02-28', 35000000.00, 'active', first_user_id),
        ('Tech Park Office Building', 'Modern office building for IT companies', '2024-01-20', '2024-10-20', 18000000.00, 'active', first_user_id);
        
        RAISE NOTICE 'Sample projects inserted successfully!';
        
        -- Insert sample daily reports
        INSERT INTO daily_reports (project_id, report_date, weather, manpower, work_completed, cost, stage, user_id) VALUES
        ((SELECT id FROM projects WHERE user_id = first_user_id LIMIT 1), '2024-01-15', 'Sunny', 25, 'Site preparation and marking completed. Excavation trenches dug.', 15000.00, 'Site Preparation', first_user_id),
        ((SELECT id FROM projects WHERE user_id = first_user_id LIMIT 1), '2024-01-16', 'Cloudy', 30, 'Foundation work started. Concrete pouring for foundation completed.', 25000.00, 'Foundation Work', first_user_id),
        ((SELECT id FROM projects WHERE user_id = first_user_id LIMIT 1), '2024-01-17', 'Rainy', 20, 'Due to rain, only safety inspections and material organization done.', 5000.00, 'Foundation Work', first_user_id),
        ((SELECT id FROM projects WHERE user_id = first_user_id LIMIT 1), '2024-01-18', 'Sunny', 35, 'Plinth work completed. Brick laying for ground floor started.', 30000.00, 'Plinth Work', first_user_id),
        ((SELECT id FROM projects WHERE user_id = first_user_id LIMIT 1), '2024-01-19', 'Sunny', 40, 'Superstructure work progressing. First floor concrete casting done.', 35000.00, 'Superstructure Work', first_user_id);
        
        RAISE NOTICE 'Sample daily reports inserted successfully!';
        
        -- Insert sample materials
        INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id) VALUES
        ('Cement', 'Portland Cement Grade 53', 'Cement & Concrete', 'bags', 350.00, 'ABC Cement Ltd', '+91-9876543210', 100, 150, first_user_id),
        ('Steel Rods', 'TMT Steel Rods 12mm', 'Steel & Reinforcement', 'kg', 65.00, 'Steel World', '+91-9876543211', 500, 750, first_user_id),
        ('Bricks', 'Red Clay Bricks', 'Bricks & Blocks', 'pieces', 8.50, 'Brick Works', '+91-9876543212', 1000, 2000, first_user_id),
        ('Sand', 'River Sand Fine Grade', 'Sand & Aggregates', 'cubic meters', 1200.00, 'Sand Suppliers', '+91-9876543213', 10, 25, first_user_id),
        ('Gravel', 'Coarse Aggregate 20mm', 'Sand & Aggregates', 'cubic meters', 800.00, 'Aggregate Co', '+91-9876543214', 5, 15, first_user_id);
        
        RAISE NOTICE 'Sample materials inserted successfully!';
        
    ELSE
        RAISE NOTICE 'Projects already exist. Skipping sample data insertion.';
    END IF;
    
END $$;

-- Check final counts
DO $$
DECLARE
    project_count INTEGER;
    report_count INTEGER;
    material_count INTEGER;
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    SELECT COUNT(*) INTO project_count FROM projects WHERE user_id = first_user_id;
    SELECT COUNT(*) INTO report_count FROM daily_reports WHERE user_id = first_user_id;
    SELECT COUNT(*) INTO material_count FROM materials WHERE user_id = first_user_id;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'FINAL DATA COUNTS:';
    RAISE NOTICE 'Projects: %', project_count;
    RAISE NOTICE 'Daily Reports: %', report_count;
    RAISE NOTICE 'Materials: %', material_count;
    RAISE NOTICE '=====================================================';
    
    IF project_count > 0 AND report_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Dummy data is now available!';
    ELSE
        RAISE NOTICE 'ERROR: Still no data found. Please check your database setup.';
    END IF;
    
END $$;
