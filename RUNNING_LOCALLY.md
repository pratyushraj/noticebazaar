# Running NoticeBazaar Locally

## 🚀 Quick Start

### Frontend (Port 5173)
```bash
npm run dev
```
**URL:** http://localhost:5173

### Backend (Port 3001)
```bash
cd server
npm run dev
```
**URL:** http://localhost:3001

## 📋 Current Status

### Frontend Server
- ✅ Running on http://localhost:5173
- ✅ Vite dev server active
- ✅ Hot module replacement enabled

### Backend Server
- ⚠️  Requires configuration:
  1. Create `server/.env` file (see `server/.env.example`)
  2. Add your Supabase credentials:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
  3. Then run: `cd server && npm run dev`

## 🔧 Setup Backend

1. **Create environment file:**
   ```bash
   cd server
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials:**
   ```env
   PORT=3001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FRONTEND_URL=http://localhost:5173
   STORAGE_BUCKET=creator-assets
   ```

3. **Start backend:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Run Migrations
```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manual (via Supabase Dashboard)
# Copy and run:
# - supabase/migrations/2025_01_28_messaging_system.sql
# - supabase/migrations/2025_01_28_protection_reports.sql
```

### Seed Demo Data (Optional)
```bash
# Set DATABASE_URL first
export DATABASE_URL="postgresql://user:pass@host:port/db"
psql $DATABASE_URL -f scripts/seed-demo-data.sql
```

## 🧪 Test the Setup

1. **Frontend:** Open http://localhost:5173
2. **Backend Health:** http://localhost:3001/health
3. **Login:** Use your existing account credentials
4. **Advisor Dashboard:** http://localhost:5173/advisor-dashboard (admin/CA roles)

## 🐛 Troubleshooting

### Frontend won't start
- Clear cache: `rm -rf node_modules/.vite`
- Check port 5173 is free: `lsof -ti:5173`

### Backend won't start
- Check `.env` file exists in `server/` directory
- Verify Supabase credentials are correct
- Check port 3001 is free: `lsof -ti:3001`

### 504 Outdated Optimize Dep errors
- Already fixed! Cache cleared and imports corrected
- Just restart: `npm run dev`

## 📚 Next Steps

1. ✅ Frontend is running
2. ⚠️  Configure backend `.env` file
3. ⚠️  Run database migrations
4. ⚠️  (Optional) Seed demo data
5. ✅ Start testing!

## 🔗 Useful URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Advisor Dashboard:** http://localhost:5173/advisor-dashboard

