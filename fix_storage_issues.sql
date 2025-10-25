-- Fix Storage and RLS Issues for Photo Uploads
-- This script fixes the storage bucket and RLS policies

-- First, let's create the storage bucket policy
-- Note: You need to create the bucket manually in Supabase Dashboard first

-- Create RLS policy for storage bucket access
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dpr-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dpr-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dpr-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dpr-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: Allow all authenticated users to access dpr-photos bucket
-- (Use this if the above doesn't work)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload to dpr-photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view dpr-photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update dpr-photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete dpr-photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);
