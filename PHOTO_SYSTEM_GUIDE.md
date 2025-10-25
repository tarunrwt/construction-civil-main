# 📸 Complete Photo Management System Guide

## 🎯 **Where Photos Are Saved**

### **1. Supabase Storage Bucket**
- **Location**: `dpr-photos/` bucket in your Supabase project
- **File Naming**: `{reportId}_{timestamp}.{extension}`
- **Example**: `abc123_1703123456789.jpg`

### **2. Database References**
- **Table**: `dpr_photos` (created by `complete_photo_system.sql`)
- **Stores**: File metadata, URLs, descriptions, and relationships

## 📱 **How to View Progress Photos**

### **Method 1: Reports Section**
1. Go to **Reports** page
2. Click on **"Photos"** tab
3. View all photos with:
   - ✅ Thumbnail previews
   - ✅ Photo descriptions
   - ✅ Report dates
   - ✅ Project names
   - ✅ Download options
   - ✅ Full-screen viewing

### **Method 2: Individual Report Photos**
- Photos are automatically linked to specific DPR reports
- Each photo shows which report it belongs to
- Filter by project or date

## 🗂️ **Photo Storage Structure**

```
Supabase Storage:
├── dpr-photos/
│   ├── report1_1703123456789.jpg
│   ├── report1_1703123456790.png
│   ├── report2_1703123456791.jpg
│   └── ...

Database (dpr_photos table):
├── id (UUID)
├── daily_report_id (Links to DPR)
├── user_id (Owner)
├── file_name (Original name)
├── file_path (Storage path)
├── public_url (Accessible URL)
├── description (User description)
├── file_size (Bytes)
├── mime_type (image/jpeg, etc.)
└── created_at (Upload timestamp)
```

## 👥 **User Management Section**

### **Location**: Admin Panel → User Management

### **Features Available**:

#### **1. User Roles Management**
- ✅ **Create Roles**: Define custom roles with specific permissions
- ✅ **Edit Roles**: Modify role names, descriptions, and permissions
- ✅ **Delete Roles**: Remove unused roles
- ✅ **Permission System**: Granular control over what users can do

#### **2. User Assignments**
- ✅ **Assign Users to Projects**: Link users to specific projects
- ✅ **Role Assignment**: Assign roles to users for each project
- ✅ **Assignment History**: Track when users were assigned
- ✅ **Bulk Operations**: Manage multiple assignments

#### **3. Available Roles** (Default):
- **Admin**: Full system access
- **Project Manager**: Project oversight and reporting
- **Site Engineer**: Daily reporting and progress tracking
- **Foreman**: Team management and basic reporting
- **Worker**: Basic access to assigned tasks

#### **4. Permission Types**:
- `read_reports`: View DPR reports
- `create_reports`: Submit new DPRs
- `edit_reports`: Modify existing reports
- `delete_reports`: Remove reports
- `view_photos`: Access photo gallery
- `upload_photos`: Add photos to reports
- `manage_users`: User management access
- `view_analytics`: Access reports and analytics
- `manage_projects`: Project creation and management

## 🔧 **Setup Instructions**

### **Step 1: Apply Database Schema**
```sql
-- Run this in Supabase SQL Editor
-- File: complete_photo_system.sql
```

### **Step 2: Create Storage Bucket**
1. Go to Supabase Dashboard → Storage
2. Create bucket named `dpr-photos`
3. Set public access if needed

### **Step 3: Configure RLS Policies**
The SQL script automatically creates:
- ✅ Row Level Security policies
- ✅ User-specific photo access
- ✅ Secure photo uploads

## 📊 **Photo Features**

### **Upload Process**:
1. **Select Photos**: Choose multiple images
2. **Add Descriptions**: Describe each photo
3. **Automatic Upload**: Files uploaded to Supabase Storage
4. **Database Entry**: Metadata saved to `dpr_photos` table
5. **Instant Access**: Photos immediately available in Reports

### **Viewing Options**:
- **Grid View**: Thumbnail gallery with descriptions
- **Modal View**: Full-screen photo viewing
- **Download**: Individual photo downloads
- **Filtering**: By project, date, or description

### **Security Features**:
- ✅ **User Isolation**: Users only see their own photos
- ✅ **Secure URLs**: Time-limited access tokens
- ✅ **Permission Checks**: Role-based photo access
- ✅ **Data Validation**: File type and size restrictions

## 🎨 **User Interface**

### **Photo Gallery Features**:
- **Responsive Grid**: Adapts to screen size
- **Hover Effects**: Interactive photo previews
- **Download Buttons**: Quick download access
- **Date Stamps**: When photos were taken
- **Project Labels**: Which project the photo belongs to
- **Description Display**: User-added descriptions

### **Navigation**:
- **Reports → Photos Tab**: Main photo gallery
- **Individual Reports**: Photos specific to that report
- **Search & Filter**: Find photos by date/project

## 🔍 **Troubleshooting**

### **Common Issues**:

#### **"No photos found"**
- ✅ Check if photos were uploaded successfully
- ✅ Verify user has permission to view photos
- ✅ Ensure `dpr_photos` table exists

#### **"Upload failed"**
- ✅ Check Supabase Storage bucket exists
- ✅ Verify RLS policies are configured
- ✅ Ensure user has upload permissions

#### **"Permission denied"**
- ✅ Check user role has `upload_photos` permission
- ✅ Verify RLS policies allow user access
- ✅ Ensure user is authenticated

## 📈 **Analytics & Reporting**

### **Photo Statistics**:
- Total photos uploaded
- Photos per project
- Upload frequency
- Storage usage

### **User Activity**:
- Who uploaded what
- Upload timestamps
- Photo descriptions
- Project associations

## 🚀 **Next Steps**

1. **Apply the database schema** (`complete_photo_system.sql`)
2. **Test photo upload** in Submit DPR form
3. **View photos** in Reports → Photos tab
4. **Configure user roles** in User Management
5. **Set up permissions** for different user types

Your photo management system is now complete and ready to use! 📸✨
