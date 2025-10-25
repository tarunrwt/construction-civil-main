-- =====================================================
-- DATABASE DIAGNOSTIC SCRIPT
-- =====================================================
-- Run this script in Supabase SQL Editor to diagnose the issue

-- Check if tables exist
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CHECKING DATABASE TABLES...';
    RAISE NOTICE '=====================================================';
    
    -- Check if projects table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        RAISE NOTICE '✅ projects table exists';
    ELSE
        RAISE NOTICE '❌ projects table does NOT exist';
    END IF;
    
    -- Check if daily_reports table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_reports') THEN
        RAISE NOTICE '✅ daily_reports table exists';
    ELSE
        RAISE NOTICE '❌ daily_reports table does NOT exist';
    END IF;
    
    -- Check if materials table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
        RAISE NOTICE '✅ materials table exists';
    ELSE
        RAISE NOTICE '❌ materials table does NOT exist';
    END IF;
    
    -- Check if user_roles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table does NOT exist';
    END IF;
    
END $$;

-- Check users
DO $$
DECLARE
    user_count INTEGER;
    first_user_id UUID;
    user_email TEXT;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CHECKING USERS...';
    RAISE NOTICE '=====================================================';
    
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Total users: %', user_count;
    
    IF user_count > 0 THEN
        SELECT id, email INTO first_user_id, user_email FROM auth.users LIMIT 1;
        RAISE NOTICE 'First user ID: %', first_user_id;
        RAISE NOTICE 'First user email: %', user_email;
    ELSE
        RAISE NOTICE '❌ NO USERS FOUND! You need to create a user account first.';
    END IF;
    
END $$;

-- Check data in tables
DO $$
DECLARE
    project_count INTEGER;
    report_count INTEGER;
    material_count INTEGER;
    role_count INTEGER;
    first_user_id UUID;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CHECKING DATA IN TABLES...';
    RAISE NOTICE '=====================================================';
    
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Check projects
        SELECT COUNT(*) INTO project_count FROM projects WHERE user_id = first_user_id;
        RAISE NOTICE 'Projects for user: %', project_count;
        
        -- Check daily reports
        SELECT COUNT(*) INTO report_count FROM daily_reports WHERE user_id = first_user_id;
        RAISE NOTICE 'Daily reports for user: %', report_count;
        
        -- Check materials
        SELECT COUNT(*) INTO material_count FROM materials WHERE user_id = first_user_id;
        RAISE NOTICE 'Materials for user: %', material_count;
        
        -- Check user roles
        SELECT COUNT(*) INTO role_count FROM user_roles;
        RAISE NOTICE 'User roles: %', role_count;
        
        -- Show sample data
        IF project_count > 0 THEN
            RAISE NOTICE 'Sample project: %', (SELECT name FROM projects WHERE user_id = first_user_id LIMIT 1);
        END IF;
        
        IF report_count > 0 THEN
            RAISE NOTICE 'Sample report cost: %', (SELECT cost FROM daily_reports WHERE user_id = first_user_id LIMIT 1);
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Cannot check data - no users found';
    END IF;
    
END $$;

-- Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CHECKING RLS POLICIES...';
    RAISE NOTICE '=====================================================';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'projects';
    RAISE NOTICE 'RLS policies for projects table: %', policy_count;
    
    IF policy_count = 0 THEN
        RAISE NOTICE '❌ NO RLS POLICIES FOUND! This might be the issue.';
    ELSE
        RAISE NOTICE '✅ RLS policies exist';
    END IF;
    
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DIAGNOSTIC COMPLETE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'If you see ❌ errors above, those need to be fixed.';
    RAISE NOTICE 'If all checks show ✅, the issue might be in the frontend code.';
    RAISE NOTICE '=====================================================';
END $$;

