# Deploy perform-copyright-scan Edge Function

The `perform-copyright-scan` Edge Function needs to be deployed to Supabase.

## Quick Deploy

### Option 1: Via Supabase CLI (Recommended)

If you have Supabase CLI installed and linked to your project:

```bash
supabase functions deploy perform-copyright-scan
```

### Option 2: Via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **New Function** or **Deploy Function**
5. Upload or paste the function code from `supabase/functions/perform-copyright-scan/index.ts`
6. Set the function name: `perform-copyright-scan`
7. Click **Deploy**

## Verify Deployment

1. Go to **Edge Functions** in Supabase Dashboard
2. You should see `perform-copyright-scan` listed
3. Check that it shows as "Active" or "Deployed"
4. Check the deployment timestamp

## Test the Function

After deployment, test it:

### Via Browser Console

```javascript
const { data, error } = await supabase.functions.invoke('perform-copyright-scan', {
  body: { 
    query: 'https://example.com/content',
    platforms: ['YouTube', 'Instagram']
  }
});
console.log({ data, error });
```

### Via curl

```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/perform-copyright-scan \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "https://example.com/content", "platforms": ["YouTube", "Instagram"]}'
```

## Troubleshooting

### If you get "Function not found"
- The function hasn't been deployed yet
- Deploy it using one of the methods above

### If you get CORS errors
- The function should already have CORS headers configured
- Check that the function is deployed correctly
- Verify the OPTIONS request returns 200 status

### If you get 500 errors
- Check Edge Function logs in Supabase Dashboard
- Look for error messages in the Logs tab
- Verify environment variables are set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

## After Deployment

Once deployed, the `ERR_FAILED` error should be resolved and the function should work correctly.

