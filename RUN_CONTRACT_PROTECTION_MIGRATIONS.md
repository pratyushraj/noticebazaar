# Run Contract Protection Migrations

The Contract Protection features require two new database tables. Follow these steps:

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/2025_12_01_create_contract_issues_table.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Repeat steps 3-5 for `supabase/migrations/2025_12_01_create_lawyer_requests_table.sql`

## Option 2: Run via Supabase CLI

If you have Supabase CLI installed and linked to your project:

```bash
supabase db push
```

Or to run a specific migration:

```bash
supabase migration up
```

## Quick SQL Copy-Paste

### 1. Contract Issues Table

Copy and paste this SQL directly into Supabase SQL Editor:

```sql
-- Contract Issues Tracking Table
-- Tracks issues found in contracts and their resolution status

CREATE TABLE IF NOT EXISTS public.contract_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Contract/Deal reference
  deal_id UUID NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Issue details
  issue_type TEXT NOT NULL CHECK (issue_type IN ('exclusivity', 'payment', 'termination', 'ip_rights', 'timeline', 'deliverables', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  impact JSONB DEFAULT '[]'::jsonb, -- Array of impact points
  recommendation TEXT,
  
  -- Resolution tracking
  status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Additional flexible data
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_issues_deal_id ON public.contract_issues(deal_id);
CREATE INDEX IF NOT EXISTS idx_contract_issues_creator_id ON public.contract_issues(creator_id);
CREATE INDEX IF NOT EXISTS idx_contract_issues_status ON public.contract_issues(status);
CREATE INDEX IF NOT EXISTS idx_contract_issues_issue_type ON public.contract_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_contract_issues_created_at ON public.contract_issues(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contract_issues ENABLE ROW LEVEL SECURITY;

-- Creators can view and manage their own contract issues
CREATE POLICY "Creators can view their own contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own contract issues"
ON public.contract_issues FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own contract issues"
ON public.contract_issues FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Admins can view all issues (for support)
CREATE POLICY "Admins can view all contract issues"
ON public.contract_issues FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_issues_updated_at
  BEFORE UPDATE ON public.contract_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_issues_updated_at();
```

### 2. Lawyer Requests Table

After running the first migration, run this one:

```sql
-- Lawyer Requests Table
-- Allows creators to request legal assistance

CREATE TABLE IF NOT EXISTS public.lawyer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Creator reference
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL,
  contract_id UUID, -- Optional: link to a specific contract
  
  -- Request details
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium'::text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'contract_review'::text CHECK (category IN ('contract_review', 'legal_question', 'dispute', 'compliance', 'other')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_summary TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_creator_id ON public.lawyer_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_deal_id ON public.lawyer_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_status ON public.lawyer_requests(status);
CREATE INDEX IF NOT EXISTS idx_lawyer_requests_created_at ON public.lawyer_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.lawyer_requests ENABLE ROW LEVEL SECURITY;

-- Creators can view and manage their own lawyer requests
CREATE POLICY "Creators can view their own lawyer requests"
ON public.lawyer_requests FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert their own lawyer requests"
ON public.lawyer_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own lawyer requests"
ON public.lawyer_requests FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Admins can view all requests (for support)
CREATE POLICY "Admins can view all lawyer requests"
ON public.lawyer_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lawyer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lawyer_requests_updated_at
  BEFORE UPDATE ON public.lawyer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_lawyer_requests_updated_at();
```

## Verify Migration

After running both migrations, verify the tables were created:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see both `contract_issues` and `lawyer_requests` tables listed
3. Check that they have the expected columns

## Test the Feature

After running the migrations:

1. Navigate to the Protection page
2. Click on a contract card
3. Try clicking "Mark Issue Resolved" or "Request Lawyer Help"
4. The buttons should now work without errors

