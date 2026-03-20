# 🔧 Fix report_id Issue - Run Database Migration

The `report_id: null` warning occurs because the `user_id` column is missing from the `protection_reports` table. This migration will add it.

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run the Migration
Copy and paste this SQL into the editor:

```sql
-- Add user_id column to protection_reports if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protection_reports' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE protection_reports ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id ON protection_reports(user_id);
    RAISE NOTICE 'Added user_id column to protection_reports';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

-- Add negotiation_power_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'protection_reports' AND column_name = 'negotiation_power_score'
  ) THEN
    ALTER TABLE protection_reports ADD COLUMN negotiation_power_score INT CHECK (negotiation_power_score >= 0 AND negotiation_power_score <= 100);
    CREATE INDEX IF NOT EXISTS idx_protection_reports_negotiation_power_score ON protection_reports(negotiation_power_score);
    RAISE NOTICE 'Added negotiation_power_score column';
  ELSE
    RAISE NOTICE 'negotiation_power_score column already exists';
  END IF;
END $$;

-- Ensure protection_reports table exists with all required columns
CREATE TABLE IF NOT EXISTS protection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES brand_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_file_url TEXT NOT NULL,
  protection_score INTEGER NOT NULL CHECK (protection_score >= 0 AND protection_score <= 100),
  negotiation_power_score INT CHECK (negotiation_power_score >= 0 AND negotiation_power_score <= 100),
  overall_risk TEXT NOT NULL CHECK (overall_risk IN ('low', 'medium', 'high')),
  analysis_json JSONB NOT NULL,
  pdf_report_url TEXT,
  safe_contract_url TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_protection_reports_user_id ON protection_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_deal_id ON protection_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_protection_reports_risk ON protection_reports(overall_risk);
CREATE INDEX IF NOT EXISTS idx_protection_reports_negotiation_power_score ON protection_reports(negotiation_power_score);
```

### Step 3: Execute
1. Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
2. Wait for "Success" message
3. You should see notices like "Added user_id column" or "user_id column already exists"

### Step 4: Verify
Run this query to verify the column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'protection_reports' 
AND column_name IN ('user_id', 'negotiation_power_score')
ORDER BY column_name;
```

You should see both columns listed.

## What This Fixes

✅ **Before:** `report_id: null` (reports not saved to database)  
✅ **After:** `report_id: <uuid>` (reports saved successfully)

## After Migration

1. **Test contract upload** - Upload a new contract
2. **Check response** - `report_id` should now be a UUID instead of `null`
3. **Verify in database** - Reports will be saved and accessible

## Troubleshooting

**Error: "relation protection_reports does not exist"**
- The table doesn't exist yet. Run the full migration from `server/database/migrations/protection_tables.sql`

**Error: "column user_id already exists"**
- The column is already there! The migration detected this and skipped it. You're good to go.

**Error: "permission denied"**
- Make sure you're using the SQL Editor with proper permissions
- Try running as the service role if needed

---

**Migration File Location:** `server/database/migrations/protection_tables.sql`  
**Full Migration:** Use the complete file if you need to create all tables from scratch

