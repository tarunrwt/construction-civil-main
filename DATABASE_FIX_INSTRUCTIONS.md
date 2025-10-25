# Database Fix Instructions

## Issues Identified

Based on the console errors, the following database issues need to be resolved:

1. **Missing `assigned_at` column** in `user_project_assignments` table
2. **Missing `material_usage` table** (404 error)
3. **Missing `material_purchases` table** (404 error)
4. **Missing `materials` table** (404 error)

## Solution

### Option 1: Run the Database Fix Script (Recommended)

1. **Access your Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to the SQL Editor

2. **Run the Fix Script**:
   - Copy the contents of `fix_database_issues.sql`
   - Paste it into the SQL Editor
   - Execute the script

### Option 2: Manual Database Setup

If the script doesn't work, you can manually run the migrations:

1. **Run the existing migrations in order**:
   ```sql
   -- Run each migration file in the supabase/migrations/ folder
   -- in chronological order (by filename)
   ```

2. **Verify the tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('materials', 'material_usage', 'material_purchases', 'user_project_assignments');
   ```

3. **Check the assigned_at column**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'user_project_assignments' 
   AND column_name = 'assigned_at';
   ```

### Option 3: Reset and Recreate Database

If the above options don't work:

1. **Reset the database** (⚠️ This will delete all data):
   - Go to Supabase Dashboard
   - Go to Settings > Database
   - Click "Reset Database"

2. **Run all migrations**:
   - Execute all SQL files in `supabase/migrations/` in order

## Verification

After applying the fix, verify that:

1. **User Management page** loads without errors
2. **Materials & Inventory page** loads without errors
3. **No 404/400 errors** in the browser console
4. **All tables exist** and have the correct columns

## Environment Variables

Make sure your environment variables are set correctly:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Stack Overflow Error

The stack overflow error in production might be related to:

1. **React Query configuration** - The app uses React Query but components use direct Supabase calls
2. **Production build optimization** - Some minification might be causing issues
3. **Infinite loops** in useEffect hooks (already fixed in the code)

If the stack overflow persists after fixing the database issues, try:

1. **Clear browser cache** and hard refresh
2. **Check if the error occurs in development** vs production
3. **Review the browser console** for any remaining infinite loop patterns

## Next Steps

1. Apply the database fixes
2. Test the application thoroughly
3. If issues persist, check the browser console for new error patterns
4. Consider implementing proper error boundaries for better error handling
