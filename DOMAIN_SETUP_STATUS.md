# 🌐 Domain Setup Status

## Current Status

✅ **DNS Record Added**: `api.noticebazaar.com` → `384723a55f15868.vercel-dns-017.com`  
✅ **DNS Resolving**: Domain correctly points to Vercel servers  
⏳ **SSL Certificate**: Vercel is provisioning SSL (takes 5-15 minutes)  
⚠️ **Domain Assignment**: Need to verify domain is assigned to the correct project

## Next Steps

### 1. Verify Domain Assignment

Make sure `api.noticebazaar.com` is assigned to the **API project** (`server`), not the frontend project:

1. Go to Vercel Dashboard → **API Project** (`server` or `funnyraj10-3806s-projects/server`)
2. Go to **Settings** → **Domains**
3. Verify `api.noticebazaar.com` is listed there
4. If it's not, add it to the API project

### 2. Wait for SSL Certificate

Vercel automatically provisions SSL certificates. This usually takes:
- **5-15 minutes** for new domains
- Check status in Vercel Dashboard → Domains → `api.noticebazaar.com`

### 3. Set Environment Variables

**CRITICAL**: Before the API works, set these in Vercel Dashboard:

1. Go to **API Project** → **Settings** → **Environment Variables**
2. Add for **Production** environment:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   FRONTEND_URL = https://noticebazaar.com
   NODE_ENV = production
   ```
3. **Redeploy** after adding variables (Vercel will prompt you)

### 4. Test the API

Once SSL is ready and environment variables are set:

```bash
# Test health endpoint
curl https://api.noticebazaar.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### 5. Update Frontend

After API is working:

1. Go to **Frontend Project** → **Settings** → **Environment Variables**
2. Add: `VITE_API_BASE_URL = https://api.noticebazaar.com`
3. Redeploy frontend

## Troubleshooting

### SSL Certificate Not Ready
- Wait 5-15 minutes
- Check Vercel Dashboard → Domains for SSL status
- Try again later

### API Returns HTML Instead of JSON
- Domain might be assigned to frontend project
- Reassign domain to API project in Vercel Dashboard

### API Returns 500 Error
- Check environment variables are set
- Check Vercel deployment logs
- Verify Supabase credentials are correct

### CORS Errors
- Ensure `FRONTEND_URL=https://noticebazaar.com` is set
- Check server CORS configuration includes production domain

## Verification Checklist

- [ ] DNS record added and resolving
- [ ] Domain assigned to API project (not frontend)
- [ ] SSL certificate provisioned (check Vercel Dashboard)
- [ ] Environment variables set in API project
- [ ] API project redeployed after setting env vars
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Frontend `VITE_API_BASE_URL` set
- [ ] Frontend redeployed
- [ ] Contract upload tested on production

