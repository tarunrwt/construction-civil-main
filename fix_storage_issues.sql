-- Fix Storage and RLS Issues for Photo Uploads
-- This script fixes the storage bucket and RLS policies

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to dpr-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view dpr-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update dpr-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete dpr-photos" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dpr-photos', 'dpr-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create simple RLS policies for authenticated users
CREATE POLICY "Allow authenticated uploads to dpr-photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated reads from dpr-photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated updates to dpr-photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes from dpr-photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dpr-photos' AND 
  auth.role() = 'authenticated'
);
