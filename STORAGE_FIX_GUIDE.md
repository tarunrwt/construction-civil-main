# 🔧 Storage Upload Error Fix Guide

## ❌ **Current Error:**
```
StorageApiError: new row violates row-level security policy
POST https://rkewawshzanayfjmexry.supabase.co/storage/v1/object/dpr-photos/dpr-photos/...
400 (Bad Request)
```

## 🎯 **Root Causes:**
1. **Storage bucket `dpr-photos` doesn't exist**
2. **RLS policies are blocking uploads**
3. **Database schema not applied**

## 🔧 **Step-by-Step Fix:**

### **Step 1: Create Storage Bucket**
1. Go to **Supabase Dashboard**
2. Click **"Storage"** in the sidebar
3. Click **"Create bucket"**
4. **Name**: `dpr-photos`
5. **Public**: ✅ Check this box
6. Click **"Create bucket"**

### **Step 2: Apply Storage Policies**
1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `fix_storage_issues.sql`
3. Click **"Run"**

### **Step 3: Apply Database Schema**
1. In **SQL Editor**, copy and paste `complete_photo_system.sql`
2. Click **"Run"**

### **Step 4: Test Upload**
1. Go to your app
2. Try uploading a photo in Submit DPR
3. Should work without errors

## 🚨 **Quick Fix Commands:**

### **In Supabase SQL Editor, run this:**
```sql
-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dpr-photos', 'dpr-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set RLS policies for storage
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
```

## ✅ **Expected Result:**
- ✅ **No more 400 errors**
- ✅ **Photos upload successfully**
- ✅ **Photos display in gallery**
- ✅ **Download functionality works**

## 🔍 **Troubleshooting:**

### **If you still get errors:**
1. **Check bucket exists**: Go to Storage → should see `dpr-photos`
2. **Check RLS policies**: Go to Authentication → Policies
3. **Check user authentication**: Make sure you're logged in
4. **Check console**: Look for specific error messages

### **Common Issues:**
- **"Bucket not found"** → Create the bucket first
- **"Permission denied"** → Apply RLS policies
- **"Authentication required"** → Make sure user is logged in

## 🎯 **After Fix:**
Your photo upload system will work perfectly! 📸✨
