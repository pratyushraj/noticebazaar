# Deploy perform-copyright-scan Function - Quick Guide

## Option 1: Via Supabase Dashboard (Easiest - No CLI needed)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ooaxtwmqrvfzdqzoijcj`
3. **Navigate to Edge Functions**: Click "Edge Functions" in the left sidebar
4. **Create New Function**:
   - Click "Create a new function" or "New Function"
   - Function name: `perform-copyright-scan`
5. **Copy the code**:
   - Open `supabase/functions/perform-copyright-scan/index.ts` in your editor
   - Copy ALL the code
   - Paste it into the Supabase Dashboard editor
6. **Deploy**: Click "Deploy" or "Save"

## Option 2: Install Supabase CLI and Deploy

### Install Supabase CLI (macOS)

```bash
brew install supabase/tap/supabase
```

### Link to your project

```bash
supabase link --project-ref ooaxtwmqrvfzdqzoijcj
```

### Deploy the function

```bash
supabase functions deploy perform-copyright-scan
```

## Verify Deployment

After deployment:
1. Go to **Edge Functions** in Supabase Dashboard
2. You should see `perform-copyright-scan` in the list
3. Check the **Logs** tab to verify it's working
4. Test it from your app - the CORS error should be gone!

## Quick Test

After deployment, test with:

```bash
curl -X POST https://ooaxtwmqrvfzdqzoijcj.supabase.co/functions/v1/perform-copyright-scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "https://example.com/video", "platforms": ["YouTube"]}'
```

