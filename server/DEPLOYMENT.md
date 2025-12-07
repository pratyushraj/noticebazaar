# 🚀 API Server Deployment Guide

Deploy the NoticeBazaar API server to `api.noticebazaar.com` subdomain.

## 📋 Prerequisites

1. Domain: `noticebazaar.com` (already configured)
2. DNS access to add A/CNAME record for `api.noticebazaar.com`
3. Environment variables ready (see below)

## 🔧 Environment Variables

Create these in your deployment platform:

```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://noticebazaar.com

# Optional
STORAGE_BUCKET=creator-assets
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Pros:** Free tier, automatic HTTPS, easy subdomain setup

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from server directory:**
   ```bash
   cd server
   vercel --prod
   ```

3. **Configure Domain:**
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add `api.noticebazaar.com`
   - Add DNS record (Vercel will show you the exact record)

4. **Set Environment Variables:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables listed above
   - Set for **Production** environment

5. **Verify:**
   ```bash
   curl https://api.noticebazaar.com/health
   ```

**Vercel Configuration:**
- Framework: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

### Option 2: Railway

**Pros:** Simple, good free tier, automatic deployments

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy:**
   ```bash
   cd server
   railway init
   railway up
   ```

3. **Configure Domain:**
   - Railway Dashboard → Project → Settings → Domains
   - Add custom domain: `api.noticebazaar.com`
   - Railway will provide DNS records to add

4. **Set Environment Variables:**
   - Railway Dashboard → Project → Variables
   - Add all variables listed above

5. **Verify:**
   ```bash
   curl https://api.noticebazaar.com/health
   ```

---

### Option 3: Render

**Pros:** Free tier, simple setup

1. **Create New Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Set Root Directory: `server`

2. **Configure Build:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Set Environment Variables:**
   - Render Dashboard → Environment
   - Add all variables listed above

4. **Configure Custom Domain:**
   - Render Dashboard → Settings → Custom Domains
   - Add `api.noticebazaar.com`
   - Render will provide DNS records

5. **Verify:**
   ```bash
   curl https://api.noticebazaar.com/health
   ```

---

### Option 4: DigitalOcean App Platform

**Pros:** Good performance, reasonable pricing

1. **Create App:**
   - Go to DigitalOcean → Apps → Create App
   - Connect GitHub repository
   - Set Root Directory: `server`

2. **Configure:**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment Variables: Add all listed above

3. **Add Domain:**
   - Settings → Domains → Add Domain
   - Add `api.noticebazaar.com`
   - Add DNS A record pointing to provided IP

4. **Verify:**
   ```bash
   curl https://api.noticebazaar.com/health
   ```

---

### Option 5: Self-Hosted (VPS/Server)

**Pros:** Full control, can be cheaper at scale

1. **Setup Server:**
   ```bash
   # On your VPS
   git clone https://github.com/your-username/noticebazaar.git
   cd noticebazaar/server
   npm install
   npm run build
   ```

2. **Create Systemd Service:**
   ```bash
   sudo nano /etc/systemd/system/noticebazaar-api.service
   ```
   
   ```ini
   [Unit]
   Description=NoticeBazaar API Server
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/noticebazaar/server
   Environment="NODE_ENV=production"
   Environment="PORT=3001"
   Environment="SUPABASE_URL=https://your-project.supabase.co"
   Environment="SUPABASE_SERVICE_ROLE_KEY=your-key"
   ExecStart=/usr/bin/node dist/index.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start Service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable noticebazaar-api
   sudo systemctl start noticebazaar-api
   ```

4. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name api.noticebazaar.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Setup SSL (Let's Encrypt):**
   ```bash
   sudo certbot --nginx -d api.noticebazaar.com
   ```

---

## 🔍 DNS Configuration

For all options, you'll need to add a DNS record:

**For Vercel/Railway/Render (CNAME):**
```
Type: CNAME
Name: api
Value: [provided by platform]
TTL: 3600
```

**For Self-Hosted (A Record):**
```
Type: A
Name: api
Value: [your server IP]
TTL: 3600
```

---

## ✅ Verification

After deployment, verify:

1. **Health Check:**
   ```bash
   curl https://api.noticebazaar.com/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **API Endpoint:**
   ```bash
   curl -X POST https://api.noticebazaar.com/api/protection/analyze \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"contract_url":"..."}'
   ```

3. **CORS Check:**
   - Open browser console on `noticebazaar.com`
   - Try uploading a contract
   - Should connect to `api.noticebazaar.com` without CORS errors

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL=https://noticebazaar.com` is set
- Check server CORS config includes production domain
- Verify DNS is properly configured

### 500 Errors
- Check environment variables are set correctly
- Verify Supabase credentials
- Check server logs in deployment platform

### Connection Refused
- Verify DNS record is correct
- Check if server is running
- Verify firewall/security group allows traffic

---

## 📝 Next Steps

After deployment:

1. Update frontend environment variable:
   ```env
   VITE_API_BASE_URL=https://api.noticebazaar.com
   ```

2. Rebuild and redeploy frontend

3. Test contract upload on production domain

4. Monitor server logs for any issues

