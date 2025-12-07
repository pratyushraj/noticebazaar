# Railway CLI Deployment - Manual Steps

The Railway CLI requires **interactive authentication**. Here's how to deploy:

## Step 1: Login to Railway CLI

Run this command in your terminal:
```bash
cd server
railway login
```

This will:
- Open your browser
- Ask you to authenticate with Railway
- Complete the login process

## Step 2: Link to Your Project

After login, link to your existing project:
```bash
railway link --project passionate-embrace
```

Or if you need to create a new project:
```bash
railway init
```

## Step 3: Set Environment Variables

```bash
railway variables --set "SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co"
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key"
railway variables --set "FRONTEND_URL=https://noticebazaar.com"
railway variables --set "NODE_ENV=production"
```

**Important:** Replace `your-actual-service-role-key` with your actual Supabase service role key.

## Step 4: Deploy

```bash
railway up
```

This will:
- Build your project
- Deploy to Railway
- Show you the deployment URL

## Step 5: Monitor Deployment

```bash
railway logs
```

Watch the logs to see the build and deployment progress.

## Step 6: Get Your Deployment URL

```bash
railway status
```

Or check the Railway Dashboard for your service URL.

## Alternative: Use Dashboard (Faster!)

Since you already have the project set up in the Railway Dashboard:
1. Go to Railway Dashboard
2. Click the **"Deploy"** button (you saw it at the bottom)
3. Wait for deployment to complete
4. Test your API

The dashboard method is faster and doesn't require CLI authentication!

