# 🚀 Deploy API to api.creatorarmour.com - Quick Guide

## Step 1: Deploy API Server

### Option A: Using the Deployment Script (Easiest)

```bash
cd server
chmod +x deploy.sh
./deploy.sh
```

### Option B: Manual Deployment

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Login to Vercel (if not already):**
   ```bash
   vercel login
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project (or create new one)
   - Go to **Settings** → **Environment Variables**
   - Add these variables for **Production**:
     ```
     SUPABASE_URL = https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
     FRONTEND_URL = https://creatorarmour.com
     NODE_ENV = production
     ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Add Custom Domain:**
   - In Vercel Dashboard → **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `api.creatorarmour.com`
   - Vercel will show you a DNS record to add

6. **Add DNS Record:**
   - Go to your domain registrar (where you manage creatorarmour.com)
   - Add a CNAME record:
     ```
     Type: CNAME
     Name: api
     Value: [value provided by Vercel]
     TTL: 3600
     ```

7. **Wait for DNS Propagation:**
   - Usually takes 5-10 minutes
   - Check with: `nslookup api.creatorarmour.com`

8. **Verify Deployment:**
   ```bash
   curl https://api.creatorarmour.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

---

## Step 2: Set Frontend Environment Variable

### For Vercel Frontend Deployment:

1. **Go to Vercel Dashboard** → Your Frontend Project → **Settings** → **Environment Variables**

2. **Add or Update:**
   ```
   VITE_API_BASE_URL = https://api.creatorarmour.com
   ```

3. **Set for Production** environment (and optionally Preview/Development)

4. **Redeploy Frontend:**
   - Go to **Deployments** tab
   - Click "..." on latest deployment → **Redeploy**
   - OR push a new commit to trigger auto-deploy

### For Local Development:

Create `.env.local` in root directory:
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Step 3: Verify Everything Works

1. **Test API Health:**
   ```bash
   curl https://api.creatorarmour.com/health
   ```

2. **Test from Frontend:**
   - Open `https://creatorarmour.com` in browser
   - Open Developer Console (F12)
   - Try uploading a contract
   - Check console logs - should see:
     ```
     [ContractUploadFlow] Calling API: https://api.creatorarmour.com/api/protection/analyze
     ```

3. **Check for Errors:**
   - No CORS errors
   - API responds successfully
   - Contract upload works

---

## 🐛 Troubleshooting

### API not responding
- Check Vercel deployment logs
- Verify environment variables are set
- Check DNS record is correct
- Wait for DNS propagation (can take up to 24 hours)

### CORS errors
- Ensure `FRONTEND_URL=https://creatorarmour.com` is set in API environment variables
- Check server CORS config includes production domain

### Frontend still using localhost
- Clear browser cache
- Hard refresh (Cmd+Shift+R)
- Verify `VITE_API_BASE_URL` is set in Vercel
- Rebuild/redeploy frontend

### DNS not resolving
- Check DNS record is correct
- Use `nslookup api.creatorarmour.com` to verify
- Wait longer for propagation
- Check domain registrar settings

---

## 📋 Checklist

- [ ] API deployed to Vercel
- [ ] Environment variables set in Vercel (API project)
- [ ] Custom domain `api.creatorarmour.com` added in Vercel
- [ ] DNS CNAME record added at domain registrar
- [ ] DNS propagated (api.creatorarmour.com resolves)
- [ ] API health check works: `curl https://api.creatorarmour.com/health`
- [ ] `VITE_API_BASE_URL` set in frontend Vercel project
- [ ] Frontend redeployed
- [ ] Contract upload tested on production domain
- [ ] No CORS errors in browser console

---

## 🎉 Success!

Once all steps are complete, your API will be live at `https://api.creatorarmour.com` and your frontend will automatically use it when deployed to production!

