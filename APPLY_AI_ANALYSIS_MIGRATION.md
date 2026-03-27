# Apply AI Analysis Migration

## Migration File
`supabase/migrations/2025_01_31_add_ai_analysis_fields_to_protection_reports.sql`

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/2025_01_31_add_ai_analysis_fields_to_protection_reports.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Direct SQL Connection
If you have direct database access, you can run the SQL file directly using `psql` or your preferred database client.

## What This Migration Does

1. **Adds new columns to `protection_reports` table:**
   - `document_type` - AI-identified document type
   - `detected_contract_category` - AI-detected contract category
   - `brand_detected` - Boolean flag for brand-influencer collaboration
   - `risk_score` - AI-assigned risk score (LOW, MEDIUM, HIGH)

2. **Creates `contract_ai_logs` table:**
   - Tracks all AI decisions for contract analysis
   - Stores model used, prompt hash, risk score, and detection results
   - Links to `protection_reports` and `auth.users`

3. **Creates indexes** for efficient querying

## Verification

After applying the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'protection_reports' 
AND column_name IN ('document_type', 'detected_contract_category', 'brand_detected', 'risk_score');

-- Check if contract_ai_logs table exists
SELECT * FROM information_schema.tables WHERE table_name = 'contract_ai_logs';
```

## Notes

- The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- All new columns are nullable to support existing records
- The migration is backward compatible with existing code

