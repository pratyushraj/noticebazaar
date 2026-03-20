# 🚀 Production Deployment Guide

Complete guide for deploying NoticeBazaar to production.

## 📋 Pre-Deployment Checklist

### 1. Build Verification
```bash
# Test production build
npm run build

# Verify build succeeds without errors
# Check bundle size (should be reasonable)
```

### 2. Environment Variables

#### Frontend (Vite) Environment Variables
Create `.env.production` file:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# CometChat (Optional - has fallback to Supabase)
VITE_COMETCHAT_APP_ID=your-cometchat-app-id
VITE_COMETCHAT_REGION=us

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FACEBOOK_PIXEL_ID=your-pixel-id
```

#### Supabase Edge Function Secrets
Go to Supabase Dashboard → Settings → Edge Functions → Secrets

**Required:**
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

**Optional (for social account linking):**
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`

### 3. Database Migrations

**CRITICAL:** Run all migrations in order before deploying:

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in this order:

```sql
-- Core tables
20240101000000_add_onboarding_complete_to_profiles.sql
2025_11_07_create_brand_deals_table.sql
2025_11_07_add_creator_id_to_brand_deals.sql
2025_11_07_refresh_profiles_schema.sql

-- Profile fields
2025_11_08_add_pan_to_profiles.sql
2025_11_20_add_trial_fields_to_profiles.sql
2025_11_21_add_creator_profile_fields.sql
2025_11_26_add_profile_fields.sql

-- Features
2025_11_08_create_creator_features_tables.sql
2025_11_08_create_creators_and_social_accounts_tables.sql
2025_11_09_create_copyright_scanner_tables.sql
2025_11_10_create_tax_tables.sql
2025_11_12_create_social_accounts_table.sql
2025_11_15_update_social_accounts_table.sql

-- Payments & Contracts
2025_11_11_add_payment_fields_to_brand_deals.sql
2025_11_12_ensure_contract_file_url_exists.sql
2025_11_13_enable_rls_for_brand_deals.sql
2025_11_14_create_payment_reminders_table.sql

-- Partner Program
2025_11_22_create_partner_program_tables.sql
2025_11_22_create_partner_functions.sql
2025_11_22_partner_program_complete.sql
2025_11_23_partner_program_enhancements.sql

-- Security & Auth
2025_11_24_create_passkeys_table.sql
2025_11_27_auto_create_creator_profile.sql

-- Notifications & Analytics
2025_11_28_create_notifications_system.sql
2025_01_XX_create_analytics_table.sql
```

**Quick Verification:**
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should include:
-- analytics_events, brand_deals, notifications, 
-- notification_preferences, passkeys, profiles, etc.
```

### 4. Storage Buckets

Verify these buckets exist in Supabase Storage:

1. **`creator-assets`** (or `CREATOR_ASSETS_BUCKET`)
   - Public: Yes
   - RLS: Enabled
   - Policies: Users can upload/read their own files

2. **`contracts`** (if used)
   - Public: No (private)
   - RLS: Enabled

**Setup:**
1. Go to Supabase Dashboard → Storage
2. Create buckets if missing
3. Configure RLS policies

### 5. Edge Functions

Deploy all Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy analytics
supabase functions deploy send-payment-reminder
supabase functions deploy link-social-account
supabase functions deploy scan-copyright
supabase functions deploy send-takedown-notice
supabase functions deploy passkey-challenge
supabase functions deploy passkey-register
supabase functions deploy passkey-authenticate
```

### 6. Supabase Redirect URLs

Add your production URL to Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Site URL**: `https://your-domain.com`
3. Add to **Redirect URLs**: 
   - `https://your-domain.com/**`
   - `https://your-domain.com/auth/callback`

## 🏗️ Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all `VITE_*` variables
   - Set for **Production** environment

3. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Connect Repository**
   - Connect GitHub repo to Netlify
   - Auto-deploy on push to `main`

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all `VITE_*` variables

### Option 3: Self-Hosted (Nginx)

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy to Server**
   ```bash
   # Copy dist folder to server
   scp -r dist/* user@server:/var/www/noticebazaar/
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name noticebazaar.com;
       
       root /var/www/noticebazaar;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

## ✅ Post-Deployment Verification

### 1. Test Critical Flows

- [ ] **New User Signup**
  - Sign up with email
  - Sign up with Google
  - Verify onboarding flow works

- [ ] **Onboarding**
  - Complete onboarding steps
  - Verify profile is created
  - Check empty state displays

- [ ] **Dashboard**
  - New user sees empty state
  - Existing user sees their data
  - No demo data for new users

- [ ] **Contract Upload**
  - Upload a contract
  - Verify file is stored
  - Check AI review works

- [ ] **Payments**
  - View payments page
  - Request payment
  - Verify invoice generation

- [ ] **Messages**
  - Send a message
  - Verify real-time updates
  - Check CometChat/Supabase fallback

### 2. Error Monitoring

Set up error tracking:

**Option 1: Sentry**
```bash
npm install @sentry/react
```

**Option 2: LogRocket**
```bash
npm install logrocket
```

**Option 3: PostHog**
```bash
npm install posthog-js
```

### 3. Performance Monitoring

- [ ] Check Lighthouse score (should be > 90)
- [ ] Monitor bundle size
- [ ] Check Core Web Vitals
- [ ] Test on mobile devices

### 4. Security Checks

- [ ] No hardcoded secrets
- [ ] Environment variables are set
- [ ] HTTPS is enabled
- [ ] CORS is configured correctly
- [ ] RLS policies are active

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working

- Verify variables start with `VITE_`
- Restart dev server after adding variables
- Check `.env.production` file exists

### Database Errors

- Verify all migrations are applied
- Check RLS policies are correct
- Verify service role key is set

### Edge Functions Not Working

- Check function logs in Supabase Dashboard
- Verify secrets are set
- Check function deployment status

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] Error logs (Sentry/LogRocket)
- [ ] User signups
- [ ] API response times
- [ ] Database performance

### Weekly Checks

- [ ] Review analytics
- [ ] Check storage usage
- [ ] Review error trends
- [ ] Update dependencies

### Monthly Checks

- [ ] Security audit
- [ ] Performance optimization
- [ ] Database cleanup
- [ ] Backup verification

## 🆘 Support & Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentation**: See `/docs` folder
- **Migration Files**: `/supabase/migrations`
- **Edge Functions**: `/supabase/functions`

## 📝 Notes

- All `console.log` statements have been replaced with `logger` utility
- Error boundaries are in place
- Empty states are configured for new users
- Demo data only shows in preview routes

---

**Last Updated:** 2025-01-XX  
**Version:** 1.0.0

