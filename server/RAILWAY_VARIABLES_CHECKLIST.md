# Railway Variables Checklist

## Required Variables (Must Have)

Based on your current setup, you need these variables:

✅ **SUPABASE_URL** - Already set
✅ **SUPABASE_SERVICE_ROLE_KEY** - Already set (truncated as `SUPABASE_SERVICE_ROLE_K...`)
✅ **FRONTEND_URL** - Already set
✅ **NODE_ENV** - Already set

## Optional Variables (Nice to Have)

- `VITE_SUPABASE_URL` - Fallback for Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Fallback for anon key
- `RAZORPAY_KEY_SECRET` - For payment processing
- `VITE_RAZORPAY_KEY_ID` - For payment processing

## Verify SUPABASE_SERVICE_ROLE_KEY

Make sure `SUPABASE_SERVICE_ROLE_KEY` is set correctly:
1. Click the eye icon 👁️ next to `SUPABASE_SERVICE_ROLE_K...` to view it
2. Verify it starts with `sb_secret_` and is the full service role key (not anon key)
3. It should be around 100+ characters long

## Next Steps

1. **Verify all variables are correct** (especially SUPABASE_SERVICE_ROLE_KEY)
2. **Click "Deploy" button** at the bottom to trigger deployment
3. **Wait for build to complete** (check Deployments tab)
4. **Test the API** using Railway's provided domain
5. **Add custom domain** `api.noticebazaar.com` in Settings → Networking

## After Deployment

Test your API:
```bash
# Get your Railway domain from the dashboard
curl https://your-app.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","supabaseInitialized":true,"nodeEnv":"production"}
```

