# 🚀 Render API Deployment (Using API Token)

Your Render API token: `rnd_uuftljqVQPRw4UzkFFBJFtpOXrck`

## Quick Deploy via Dashboard (Recommended - 5 min)

### Step 1: Create Web Service
1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `noticebazaar`
4. Select the repository

### Step 2: Configure Service
- **Name:** `noticebazaar-api`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free

### Step 3: Add Environment Variables
Click "Add Environment Variable" and add:

```
SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-here>
RESEND_API_KEY=<your-resend-api-key-here>
FRONTEND_URL=https://noticebazaar.com
NODE_ENV=production
PORT=10000
```

**Important:** Get your Resend API key from https://resend.com/api-keys
- Sign up/login to Resend
- Go to API Keys section
- Create a new API key or use an existing one
- Copy the key (starts with `re_`) and paste it as the value for `RESEND_API_KEY`

### Step 4: Deploy
- Click **"Create Web Service"**
- Render will build and deploy automatically
- You'll get a URL like: `https://noticebazaar-api.onrender.com`

### Step 5: Test
```bash
curl https://noticebazaar-api.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "supabaseInitialized": true,
  "nodeEnv": "production"
}
```

## Alternative: Use render.yaml Blueprint

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect GitHub repo: `noticebazaar`
4. Render will auto-detect `server/render.yaml`
5. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL)
6. Click **"Apply"**

## Using Render API (Advanced)

You can also use the Render API programmatically:

```bash
# Set your API token
export RENDER_API_TOKEN="rnd_uuftljqVQPRw4UzkFFBJFtpOXrck"

# Create a service (requires owner ID and repo ID)
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "noticebazaar-api",
    "repo": "https://github.com/your-username/noticebazaar",
    "branch": "main",
    "rootDir": "server",
    "buildCommand": "npm install && npm run build",
    "startCommand": "npm start",
    "planId": "starter"
  }'
```

However, the dashboard method is much easier and recommended.

## Custom Domain Setup (Optional)

1. Go to your service → **Settings** → **Custom Domains**
2. Add: `api.noticebazaar.com`
3. Follow DNS instructions shown
4. Wait 5-15 minutes for DNS propagation

## Update Frontend

Once deployed, update your frontend environment variable:

```env
VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
```

Or if using custom domain:
```env
VITE_API_BASE_URL=https://api.noticebazaar.com
```

## Render Free Tier Notes

✅ Web services supported (unlike Railway free tier)  
✅ 750 hours/month free  
✅ Automatic SSL  
✅ Custom domains  
⚠️ Spins down after 15 min inactivity (wakes on request, ~30s delay)

