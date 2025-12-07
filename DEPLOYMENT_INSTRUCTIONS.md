# 🚀 API Deployment Instructions

## ✅ Build Status
The API server has been successfully built and is ready for deployment!

## 📋 Deployment Steps

### Step 1: Deploy to Vercel

Run this command from the `server/` directory:

```bash
cd server
vercel --prod --yes
```

**Note:** If this is your first deployment, Vercel will ask you to:
1. Link to an existing project OR create a new one
2. Set up the project name
3. Configure settings

### Step 2: Set Environment Variables

**IMPORTANT:** Before the API works, you MUST set these environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your API project
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production** environment:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
FRONTEND_URL = https://noticebazaar.com
NODE_ENV = production
```

5. Click **Save**

### Step 3: Add Custom Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `api.noticebazaar.com`
4. Vercel will show you a DNS record (CNAME) to add

### Step 4: Configure DNS

1. Go to your domain registrar (where you manage noticebazaar.com)
2. Add a CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: [value provided by Vercel]
   TTL: 3600
   ```
3. Save and wait 5-10 minutes for DNS propagation

### Step 5: Verify Deployment

Once DNS propagates, test the API:

```bash
curl https://api.noticebazaar.com/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## 🎯 Next Steps After API Deployment

1. **Set Frontend Environment Variable:**
   - Go to Vercel Dashboard → Frontend Project → Settings → Environment Variables
   - Add: `VITE_API_BASE_URL = https://api.noticebazaar.com`
   - Redeploy frontend

2. **Test Contract Upload:**
   - Open `https://noticebazaar.com`
   - Try uploading a contract
   - Check browser console for API calls

## 🐛 Troubleshooting

### Build Errors
- ✅ Already fixed! TypeScript compilation now succeeds

### Deployment Errors
- Check environment variables are set
- Verify Vercel CLI is logged in: `vercel whoami`
- Check Vercel project settings

### DNS Not Resolving
- Wait longer (can take up to 24 hours)
- Verify CNAME record is correct
- Use `nslookup api.noticebazaar.com` to check

### API Not Responding
- Check Vercel deployment logs
- Verify environment variables
- Test health endpoint: `curl https://api.noticebazaar.com/health`

## 📝 Quick Deploy Command

```bash
cd server
vercel --prod --yes
```

Then follow steps 2-5 above to complete setup!

