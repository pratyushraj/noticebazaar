# Lawyer Dashboard Setup Guide

## ✅ Completed

1. **Created Lawyer Dashboard** (`src/pages/LawyerDashboard.tsx`)
   - Conversation inbox with filters (All, High Risk, Payment, Legal)
   - Contract attachments view and download
   - Quick reply templates for legal advisors
   - Real-time message updates
   - Matches NoticeBazaar purple gradient design

2. **Added Lawyer Role to System**
   - Updated `src/types/index.ts` to include `'lawyer'` role
   - Updated `src/components/ProtectedLayout.tsx` to allow lawyer role
   - Updated `src/components/ProtectedRoute.tsx` to allow lawyer role
   - Updated `src/components/forms/ProfileForm.tsx` to include lawyer option

3. **Added Routing**
   - Route: `/lawyer-dashboard` (protected, lawyer role only)
   - Updated `src/pages/HomePage.tsx` to redirect lawyer users
   - Added lawyer to messages route access

4. **Created Setup Script**
   - `scripts/create-lawyer-user.ts` - Script to create lawyer user account

## 🔧 Manual Setup Required

Since the automated script may have issues with Supabase admin API, you can manually create the lawyer user:

### Option 1: Via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** `lawyer@yopmail.com`
   - **Password:** `Lawyer123!@#`
   - **Auto Confirm User:** ✅ (checked)
4. Click **"Create user"**
5. Go to **Table Editor** → **profiles**
6. Find the user's profile (or create one if it doesn't exist)
7. Update the profile:
   ```sql
   UPDATE profiles
   SET 
     role = 'lawyer',
     first_name = 'Legal',
     last_name = 'Advisor',
     onboarding_complete = true,
     updated_at = NOW()
   WHERE id = '<user-id-from-auth-users>';
   ```

### Option 2: Via SQL Editor

Run this SQL in Supabase SQL Editor:

```sql
-- First, create the auth user (if not exists)
-- Note: You'll need to create the user via Supabase Dashboard first, then update the profile

-- Update profile to lawyer role
UPDATE profiles
SET 
  role = 'lawyer',
  first_name = 'Legal',
  last_name = 'Advisor',
  onboarding_complete = true,
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'lawyer@yopmail.com'
);

-- If profile doesn't exist, create it:
INSERT INTO profiles (id, first_name, last_name, role, onboarding_complete, created_at, updated_at)
SELECT 
  id,
  'Legal',
  'Advisor',
  'lawyer',
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'lawyer@yopmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'lawyer',
  first_name = 'Legal',
  last_name = 'Advisor',
  onboarding_complete = true,
  updated_at = NOW();
```

## 🔗 Access URLs

- **Login:** http://localhost:8080/login
- **Dashboard:** http://localhost:8080/lawyer-dashboard
- **Email:** lawyer@yopmail.com
- **Password:** Lawyer123!@#

## 📋 Features

### Lawyer Dashboard Features:
- ✅ Conversation inbox with creator conversations
- ✅ Filter by risk level (All, High Risk, Payment, Legal)
- ✅ Search conversations
- ✅ View and download contract attachments
- ✅ Send messages to creators
- ✅ Quick reply templates
- ✅ Real-time message updates
- ✅ Unread message counts

### Access:
- Lawyers can access `/lawyer-dashboard`
- Lawyers can access `/messages` (shared with other roles)
- Lawyers are redirected to lawyer dashboard on login

## 🎨 Design

The Lawyer Dashboard matches the existing NoticeBazaar design:
- Purple gradient background (`from-purple-900 via-purple-800 to-indigo-900`)
- Glass morphism cards
- Scale icon for legal advisor branding
- iOS 17 + visionOS design system tokens

## 🔐 Security

- Lawyer role is protected via `ProtectedLayout` and `ProtectedRoute`
- Only users with `role = 'lawyer'` can access `/lawyer-dashboard`
- RLS policies should be updated to allow lawyers to view conversations they're participants in

