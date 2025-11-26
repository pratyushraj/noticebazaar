# Test Account Credentials

## Quick Login

**Email:** `test@noticebazaar.com`  
**Password:** `Test123!@#`

## Account Details

This test account includes:
- ✅ Creator profile with onboarding complete
- ✅ 30-day trial activated
- ✅ 6 sample brand deals
- ✅ Instagram: @testcreator (45K followers)
- ✅ YouTube: 125K subscribers
- ✅ Business name: Test Creator Studio
- ✅ GSTIN: 29ABCDE1234F1Z5

## How to Create/Reset the Account

### Option 1: Run Seed Script (Recommended)

```bash
npm run seed
```

**Requirements:**
- `VITE_SUPABASE_URL` in `.env` file
- `VITE_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in `.env` file

The script will:
- Delete existing test user if found
- Create fresh test user
- Create profile with all sample data
- Create 6 brand deals

### Option 2: Manual Creation via Supabase Dashboard

1. **Create User:**
   - Go to **Authentication** → **Users** → **Add user**
   - Email: `test@noticebazaar.com`
   - Password: `Test123!@#`
   - ✅ Auto Confirm User
   - Click **Create user**

2. **Update Profile:**
   - Go to **Table Editor** → **profiles**
   - Find the user's profile (created by trigger)
   - Update with:
     ```json
     {
       "role": "creator",
       "first_name": "Test",
       "last_name": "Creator",
       "onboarding_complete": true,
       "is_trial": true,
       "trial_started_at": "2025-01-27T00:00:00Z",
       "trial_expires_at": "2025-02-26T00:00:00Z",
       "trial_locked": false,
       "instagram_handle": "@testcreator",
       "instagram_followers": 45000,
       "youtube_subs": 125000,
       "business_name": "Test Creator Studio",
       "gstin": "29ABCDE1234F1Z5",
       "phone": "+919876543210",
       "location": "Mumbai, Maharashtra",
       "bio": "Test creator account for NoticeBazaar dashboard testing"
     }
     ```

## Login URL

After creating the account, log in at:
- **URL:** `/login` or `https://www.noticebazaar.com/login`
- **Email:** `test@noticebazaar.com`
- **Password:** `Test123!@#`

## What You'll See

After logging in, you'll be taken to the **Creator Dashboard** with:
- Earnings overview
- Brand deals list (6 deals)
- Payment tracking
- Content protection
- Messages with advisors

## Troubleshooting

**Can't log in?**
1. Check email is confirmed in Supabase Dashboard
2. Verify profile exists and has `role: 'creator'`
3. Ensure `onboarding_complete: true` to skip onboarding

**Want to reset the account?**
- Run `npm run seed` again (it deletes and recreates)
- Or manually delete user in Supabase Dashboard and recreate

