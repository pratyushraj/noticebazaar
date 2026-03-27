# 🔧 Update Frontend Environment Variables

## Quick Setup for Production API Subdomain

After deploying the API to `api.noticebazaar.com`, update your frontend environment variables.

## 📝 Steps

### 1. For Vercel Deployment

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add or update:
   ```
   VITE_API_BASE_URL = https://api.noticebazaar.com
   ```

3. Set for **Production** environment (and optionally Preview/Development)

4. **Redeploy** your frontend:
   - Vercel will automatically redeploy, OR
   - Go to Deployments → Click "..." → Redeploy

### 2. For Local Development

Create `.env.local` file in the root directory:

```env
# Local development - uses localhost API
VITE_API_BASE_URL=http://localhost:3001

# Your other variables...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. For Production Build (Self-Hosted)

Create `.env.production` file:

```env
# Production - uses API subdomain
VITE_API_BASE_URL=https://api.noticebazaar.com

# Your other variables...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then build:
```bash
npm run build
```

## ✅ Verification

After updating environment variables:

1. **Rebuild/Redeploy** your frontend
2. **Test contract upload** on production domain
3. **Check browser console** - should see:
   ```
   [ContractUploadFlow] Calling API: https://api.noticebazaar.com/api/protection/analyze
   ```

## 🔍 How It Works

The frontend code automatically:
- Uses `VITE_API_BASE_URL` if set
- Falls back to `https://api.noticebazaar.com` if on production domain
- Falls back to `http://localhost:3001` for local development

## 📋 Environment Variable Priority

1. `VITE_API_BASE_URL` (explicitly set)
2. Auto-detect from `window.location.origin`:
   - If `noticebazaar.com` → `https://api.noticebazaar.com`
   - Otherwise → `http://localhost:3001`

## 🐛 Troubleshooting

### API calls still going to localhost
- Clear browser cache
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Verify environment variable is set in deployment platform
- Check build logs to ensure variable is included

### CORS errors
- Ensure API server CORS includes `https://noticebazaar.com`
- Verify API is running on `api.noticebazaar.com`
- Check browser console for exact error message

### Environment variable not working
- Vite requires `VITE_` prefix
- Rebuild after changing variables
- Check `.env` files are in root directory (not in `src/`)

