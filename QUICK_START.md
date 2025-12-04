# NoticeBazaar Messaging System - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+
- Supabase project (or PostgreSQL database)
- npm or pnpm

### Step 1: Install Dependencies

```bash
# Frontend
npm install --legacy-peer-deps

# Backend
cd server
npm install --legacy-peer-deps
cd ..
```

### Step 2: Configure Environment

Create `server/.env`:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
STORAGE_BUCKET=creator-assets
```

### Step 3: Run Migrations

**Option A: Using Supabase CLI**
```bash
supabase db push
```

**Option B: Manual (via Supabase Dashboard)**
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/2025_01_28_messaging_system.sql`
3. Run `supabase/migrations/2025_01_28_protection_reports.sql`

### Step 4: Seed Demo Data (Optional)

```bash
# Set DATABASE_URL first
export DATABASE_URL="postgresql://..."
psql $DATABASE_URL -f scripts/seed-demo-data.sql
```

### Step 5: Start Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

### Step 6: Test It

1. **Frontend:** http://localhost:5173
2. **Backend API:** http://localhost:3001/health
3. **Advisor Dashboard:** http://localhost:5173/advisor-dashboard (login as admin/CA)

## 🧪 Run Tests

```bash
# All tests
make test

# Unit tests only
cd server && npm test

# E2E tests
npx playwright test
```

## 📚 API Testing

1. Import `postman/NoticeBazaar_API.postman_collection.json` into Postman
2. Set `base_url` variable to `http://localhost:3001`
3. Get auth token from login endpoint
4. Set `auth_token` variable
5. Test endpoints!

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file exists in `server/` directory
- Verify Supabase credentials are correct
- Check port 3001 is not in use

### Migrations fail
- Ensure you have database admin access
- Check RLS is enabled in Supabase settings
- Verify all required tables exist

### Realtime not working
- Check Supabase Realtime is enabled in dashboard
- Verify `ALTER PUBLICATION` statements ran
- Check browser console for subscription errors

## 📖 Full Documentation

See `README_MESSAGING_SYSTEM.md` for complete documentation.

