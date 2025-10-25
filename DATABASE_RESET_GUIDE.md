# Complete Database Reset and Setup Guide

## 🔄 **Step 1: Reset Your Supabase Database**

### **Option A: Complete Reset (Recommended)**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rkewawshzanayfjmexry
2. Navigate to **Settings** → **Database**
3. Scroll down to find **"Reset Database"** section
4. Click **"Reset Database"** button
5. Confirm the reset (⚠️ This will delete ALL data)
6. Wait for the reset to complete (1-2 minutes)

### **Option B: Manual Table Deletion**
1. Go to **Database** → **Tables**
2. Delete each table by clicking the "X" icon:
   - `daily_reports`
   - `material_purchases`
   - `material_usage`
   - `materials`
   - `projects`
   - `user_project_assignments`
   - `user_roles`
   - `notifications` (if exists)

## 🏗️ **Step 2: Apply Fresh Database Schema**

1. **Go to SQL Editor**:
   - In your Supabase Dashboard, go to **SQL Editor**
   - Click **"New Query"**

2. **Run the Complete Setup Script**:
   - Copy the entire contents of `complete_database_setup.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to execute the script

3. **Verify the Setup**:
   - Go back to **Database** → **Tables**
   - You should see all tables created with proper columns
   - Check that the tables have the correct structure

## ✅ **Step 3: Verify Database Setup**

After running the script, you should have:

### **Tables Created:**
- ✅ `projects` (10 columns)
- ✅ `daily_reports` (20 columns)
- ✅ `materials` (11 columns)
- ✅ `material_usage` (9 columns)
- ✅ `material_purchases` (11 columns)
- ✅ `user_roles` (6 columns)
- ✅ `user_project_assignments` (7 columns)
- ✅ `notifications` (8 columns)

### **Features Enabled:**
- ✅ Row Level Security (RLS) policies
- ✅ Database indexes for performance
- ✅ Triggers for automatic updates
- ✅ Stock management functions
- ✅ Default user roles
- ✅ Sample data (optional)

## 🧪 **Step 4: Test Your Application**

1. **Test User Management**:
   - Go to https://construction-civil-main.vercel.app/users
   - Should load without errors
   - Should show available roles

2. **Test Materials & Inventory**:
   - Go to https://construction-civil-main.vercel.app/materials
   - Should load without errors
   - Should show materials table

3. **Test Submit DPR**:
   - Go to https://construction-civil-main.vercel.app/submit-dpr
   - Should work without stack overflow errors

4. **Check Browser Console**:
   - No 404/400 errors
   - No stack overflow errors
   - All pages should load properly

## 🔧 **Troubleshooting**

### **If you get errors:**
1. **Check the SQL Editor output** for any error messages
2. **Verify all tables were created** in the Tables section
3. **Check RLS policies** in Database → Policies
4. **Ensure all indexes were created** in Database → Indexes

### **If tables are missing:**
1. **Re-run the complete setup script**
2. **Check for any SQL syntax errors**
3. **Verify you have the correct permissions**

### **If the application still has errors:**
1. **Clear browser cache** and hard refresh
2. **Check the browser console** for specific error messages
3. **Verify environment variables** are set correctly

## 📋 **What This Setup Includes**

- **Complete database schema** with all required tables
- **Proper relationships** between tables
- **Row Level Security** for data protection
- **Performance indexes** for fast queries
- **Automatic triggers** for data consistency
- **Default user roles** for role-based access
- **Sample data** for testing (optional)

After completing these steps, your application should work perfectly without any database-related errors!
