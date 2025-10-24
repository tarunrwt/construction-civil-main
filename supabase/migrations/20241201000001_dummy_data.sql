-- Insert dummy data for testing
-- Note: Replace '00000000-0000-0000-0000-000000000000' with actual user UUID from auth.users

-- Sample Projects
INSERT INTO projects (id, name, description, start_date, target_end_date, total_cost, status, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Green Valley Residential Complex', 'A modern residential complex with 50 apartments', '2024-01-15', '2024-12-15', 25000000.00, 'active', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440002', 'City Center Mall Extension', 'Extension of existing shopping mall with new retail spaces', '2024-02-01', '2024-11-30', 15000000.00, 'active', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440003', 'Highway Bridge Construction', 'Construction of a new highway bridge over the river', '2024-03-01', '2025-02-28', 35000000.00, 'active', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440004', 'Tech Park Office Building', 'Modern office building for IT companies', '2024-01-20', '2024-10-20', 18000000.00, 'active', '00000000-0000-0000-0000-000000000000');

-- Sample Daily Reports for Green Valley Residential Complex
INSERT INTO daily_reports (project_id, report_date, weather, manpower, work_completed, cost, stage, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '2024-01-15', 'Sunny', 25, 'Site preparation and marking completed. Excavation trenches dug.', 15000.00, 'Site Preparation', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440001', '2024-01-16', 'Cloudy', 30, 'Foundation work started. Concrete pouring for foundation completed.', 25000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440001', '2024-01-17', 'Rainy', 20, 'Due to rain, only safety inspections and material organization done.', 5000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440001', '2024-01-18', 'Sunny', 35, 'Plinth work completed. Brick laying for ground floor started.', 30000.00, 'Plinth Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440001', '2024-01-19', 'Sunny', 40, 'Superstructure work progressing. First floor concrete casting done.', 35000.00, 'Superstructure Work', '00000000-0000-0000-0000-000000000000');

-- Sample Daily Reports for City Center Mall Extension
INSERT INTO daily_reports (project_id, report_date, weather, manpower, work_completed, cost, stage, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', '2024-02-01', 'Sunny', 15, 'Demolition of old structure completed. Site clearance done.', 12000.00, 'Site Preparation', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440002', '2024-02-02', 'Cloudy', 20, 'Foundation excavation completed. Rebar installation started.', 18000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440002', '2024-02-03', 'Sunny', 25, 'Ground floor concrete casting completed. Formwork for first floor ready.', 22000.00, 'Superstructure Work', '00000000-0000-0000-0000-000000000000');

-- Sample Daily Reports for Highway Bridge Construction
INSERT INTO daily_reports (project_id, report_date, weather, manpower, work_completed, cost, stage, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', '2024-03-01', 'Sunny', 50, 'Bridge pier construction started. Foundation piles driven.', 45000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440003', '2024-03-02', 'Windy', 45, 'Steel reinforcement for piers completed. Concrete pouring started.', 52000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440003', '2024-03-03', 'Cloudy', 55, 'Pier construction completed. Started work on bridge deck.', 48000.00, 'Superstructure Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440003', '2024-03-04', 'Sunny', 60, 'Bridge deck steel structure assembly completed.', 55000.00, 'Superstructure Work', '00000000-0000-0000-0000-000000000000');

-- Sample Daily Reports for Tech Park Office Building
INSERT INTO daily_reports (project_id, report_date, weather, manpower, work_completed, cost, stage, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440004', '2024-01-20', 'Sunny', 30, 'Site preparation completed. Foundation layout marked.', 20000.00, 'Site Preparation', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440004', '2024-01-21', 'Cloudy', 35, 'Excavation completed. Foundation concrete pouring done.', 28000.00, 'Foundation Work', '00000000-0000-0000-0000-000000000000'),
('550e8400-e29b-41d4-a716-446655440004', '2024-01-22', 'Sunny', 40, 'Ground floor slab completed. Started vertical construction.', 32000.00, 'Superstructure Work', '00000000-0000-0000-0000-000000000000');

-- Update some project stages to show progress
UPDATE project_stages SET
  status = 'completed',
  progress_percentage = 100,
  actual_start_date = '2024-01-15',
  actual_end_date = '2024-01-15'
WHERE project_id = '550e8400-e29b-41d4-a716-446655440001'
  AND stage_name = 'Site Preparation'
  AND user_id = '00000000-0000-0000-0000-000000000000';

UPDATE project_stages SET
  status = 'in_progress',
  progress_percentage = 75,
  actual_start_date = '2024-01-16',
  estimated_end_date = '2024-01-25'
WHERE project_id = '550e8400-e29b-41d4-a716-446655440001'
  AND stage_name = 'Foundation Work'
  AND user_id = '00000000-0000-0000-0000-000000000000';

UPDATE project_stages SET
  status = 'in_progress',
  progress_percentage = 30,
  actual_start_date = '2024-01-18'
WHERE project_id = '550e8400-e29b-41d4-a716-446655440001'
  AND stage_name = 'Plinth Work'
  AND user_id = '00000000-0000-0000-0000-000000000000';
