# 🚀 Fly.io Deployment Guide

## Quick Deploy Steps

### 1. Install Fly CLI

```bash
# macOS
brew install flyctl

# Or download from: https://fly.io/docs/hands-on/install-flyctl/
```

### 2. Login to Fly.io

```bash
flyctl auth login
```

This will open your browser for authentication.

### 3. Initialize Fly.io App

```bash
cd server
flyctl launch
```

This will:
- Create a new app (or use existing `fly.toml`)
- Ask for app name (use: `noticebazaar-api`)
- Ask for region (choose: `iad` - Washington, D.C.)
- Ask to deploy now (say **No** for now)

### 4. Set Environment Variables

```bash
flyctl secrets set \
  SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  FRONTEND_URL=https://noticebazaar.com \
  NODE_ENV=production \
  PORT=8080
```

### 5. Deploy!

```bash
flyctl deploy
```

### 6. Get Your App URL

```bash
flyctl status
```

Your API will be available at: `https://noticebazaar-api.fly.dev`

## Update Frontend

Once deployed, update your frontend environment variable:

```env
VITE_API_BASE_URL=https://noticebazaar-api.fly.dev
```

## Test Your API

```bash
curl https://noticebazaar-api.fly.dev/health
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

## Fly.io Free Tier

✅ **256 MB RAM** (enough for Node.js API)  
✅ **Shared CPU**  
✅ **3 VMs**  
✅ **160 GB outbound data transfer**  
✅ **Always-on** (no spin-down like Render)  
✅ **Custom domains**  
✅ **Automatic HTTPS**

## Useful Commands

```bash
# View logs
flyctl logs

# SSH into VM
flyctl ssh console

# Scale up/down
flyctl scale count 1
flyctl scale memory 512

# View app status
flyctl status

# Open app in browser
flyctl open
```

## Custom Domain (Optional)

1. Add domain:
   ```bash
   flyctl certs add api.noticebazaar.com
   ```

2. Follow DNS instructions shown
3. Wait 5-15 minutes for DNS propagation

## Troubleshooting

**Build fails?**
- Check `Dockerfile` is correct
- Verify `package.json` has build script
- Check logs: `flyctl logs`

**App crashes?**
- Check logs: `flyctl logs`
- Verify environment variables: `flyctl secrets list`
- Check health endpoint: `curl https://noticebazaar-api.fly.dev/health`

**Out of memory?**
- Scale up: `flyctl scale memory 1024`

## Cost

- **Free tier:** $0/month (256 MB RAM, shared CPU)
- **Paid:** Starts at ~$1.94/month for 512 MB RAM

