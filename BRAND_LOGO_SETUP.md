# Brand Logo Auto-Fetch Setup

This document explains how to set up the automatic brand logo fetching feature.

## Overview

When a brand deal is created or updated with a `brand_name` or `brand_domain`, the system automatically:

1. **Option A (Primary)**: Fetches logo from Clearbit Logo API using the domain
2. **Option B (Fallback)**: Generates a logo using DALL·E if Clearbit fails

## Setup Steps

### 1. Database Migration

Run the migration to add `brand_domain` and `brand_logo_url` columns:

```bash
supabase migration up
```

Or apply manually:
- `supabase/migrations/2025_01_17_add_brand_logo_fields.sql`

### 2. Create Supabase Storage Bucket

Create a storage bucket named `brand-logos`:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true);

-- Set up RLS policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos');
```

Or via Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `brand-logos`
3. Make it public
4. Set RLS policies for authenticated users

### 3. Deploy Edge Function

Deploy the `fetch-brand-logo` edge function:

```bash
supabase functions deploy fetch-brand-logo
```

### 4. Set Environment Variables

Add the following secrets to Supabase:

```bash
# Required for DALL·E fallback
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

The function also needs:
- `SUPABASE_URL` (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available)

### 5. How It Works

#### When Creating a Brand Deal:

1. User enters `brand_name` (e.g., "Nike") or `brand_domain` (e.g., "nike.com")
2. After the deal is inserted, the frontend calls `fetch-brand-logo` edge function
3. Edge function:
   - If domain not provided, searches for it using DuckDuckGo API
   - Tries to fetch logo from Clearbit: `https://logo.clearbit.com/{domain}`
   - If Clearbit fails, generates logo using DALL·E
   - Uploads DALL·E logo to Supabase Storage (`brand-logos` bucket)
   - Updates `brand_deals` table with `brand_logo_url` and `brand_domain`

#### When Updating a Brand Deal:

- If `brand_name` or `brand_domain` changes, logo is automatically re-fetched
- Only fetches if `brand_logo_url` is not already set

### 6. API Costs

- **Clearbit Logo API**: Free (no API key required)
- **DuckDuckGo API**: Free (no API key required)
- **DALL·E API**: Paid (requires OpenAI API key)
  - Cost: ~$0.04 per image (256x256, standard quality)
  - Only used as fallback when Clearbit fails

### 7. Usage in Frontend

The logo is automatically displayed in the Brand Deals CRM view. The component:

1. First tries to display `brand_logo_url` if available
2. Falls back to emoji/letter icon if logo fails to load or doesn't exist

### 8. Troubleshooting

**Logo not appearing:**
- Check Supabase Storage bucket `brand-logos` exists and is public
- Check edge function logs: `supabase functions logs fetch-brand-logo`
- Verify `OPENAI_API_KEY` is set if using DALL·E fallback
- Check browser console for errors

**Clearbit logo not working:**
- Verify domain is correct (e.g., "nike.com" not "www.nike.com")
- Some brands may not be in Clearbit's database
- System will automatically fallback to DALL·E

**DALL·E generation failing:**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has credits
- Check edge function logs for specific error messages

