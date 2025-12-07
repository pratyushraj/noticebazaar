# 🚂 Quick Railway Deployment with API Token

## Using Railway API Token

Since you have a Railway API token, here are the options:

### Option 1: Use Railway Dashboard (Easiest)

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Login with your account

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `noticebazaar` repository
   - Set root directory to: `server`

3. **Add Environment Variables:**
   - Go to Project → Variables
   - Add these:
     ```
     SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     FRONTEND_URL=https://noticebazaar.com
     NODE_ENV=production
     ```

4. **Deploy:**
   - Railway will automatically deploy
   - Get your Railway URL (like `https://your-app.railway.app`)

5. **Configure Custom Domain:**
   - Settings → Networking → Add Custom Domain
   - Enter: `api.noticebazaar.com`
   - Add DNS record as shown
   - Wait 5-15 minutes

### Option 2: Use Railway API Token via CLI

The token you provided might be a project token. Try:

```bash
cd server

# Link to existing project (if you have one)
railway link

# Or create new project
railway init

# Set token as environment variable
export RAILWAY_TOKEN=175095cd-edbb-488b-b3e0-98cede3961db

# Deploy
railway up
```

### Option 3: Use Railway API Directly

You can also use the Railway REST API with your token:

```bash
# Get project info
curl -H "Authorization: Bearer 175095cd-edbb-488b-b3e0-98cede3961db" \
  https://api.railway.app/v1/projects

# Create deployment
# (See Railway API docs for full API usage)
```

## Recommended: Use Dashboard

The **Railway Dashboard** is the easiest way:
- Visual interface
- Easy environment variable management
- Automatic deployments from GitHub
- Simple domain configuration

Go to: https://railway.app/dashboard

