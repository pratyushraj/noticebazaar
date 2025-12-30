# Regenerate Supabase TypeScript Types

The TypeScript errors you're seeing are because the Supabase types are out of sync with your database schema.

## Quick Fix

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   cd server
   supabase link --project-ref ooaxtwmqrvfzdqzoijcj
   ```

4. **Generate types**:
   ```bash
   supabase gen types typescript --linked > src/types/supabase.ts
   ```

### Option 2: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj/settings/api
2. Scroll to **"TypeScript types"** section
3. Click **"Generate types"**
4. Copy the generated types
5. Paste into `server/src/types/supabase.ts`

### Option 3: Using API (Manual)

1. Get your project API key from Supabase Dashboard
2. Run:
   ```bash
   curl 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/rest/v1/' \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     | jq
   ```
3. Use Supabase CLI to generate types from the schema

## After Regenerating Types

1. **Rebuild the project**:
   ```bash
   cd server
   npm run build
   ```

2. **Check for remaining errors**:
   - The TypeScript errors should be resolved
   - If some tables are still missing, they may need to be created via migrations first

## Current Missing Tables/Columns

Based on the errors, these need to be in the types:
- `consumer_complaints` table
- `conversations` table
- `conversation_participants` table
- `deal_action_logs` table
- `message_attachments` table
- `notifications` table
- `contract_ai_logs` table
- `protection_verified` table
- `brand_response_status` column in `brand_deals`
- `creator_id` column in various tables
- And more...

## Temporary Workaround

If you can't regenerate types right now, the build will still work because of `tsc || exit 0`, but you'll have TypeScript errors. The code will run, but you won't get type safety.

To make the build fail on errors (recommended for production):
```json
"build": "tsc"
```

But first, regenerate the types to fix the errors!

