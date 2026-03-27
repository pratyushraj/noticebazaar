# 🧪 Local API Testing Guide

## Current Status

✅ **API Server Running:** `http://localhost:3001`  
✅ **Health Check:** Working (`/health` endpoint responds)

## Testing Options

### Option 1: Test Everything Locally (Easiest)

1. **Start Frontend Locally:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

2. **API is already running on:** `http://localhost:3001`

3. **Test Contract Upload:**
   - Go to `http://localhost:5173`
   - Upload a contract
   - Should work perfectly ✅

### Option 2: Test on noticebazaar.com with Local API (Requires Tunnel)

Browsers block `noticebazaar.com` → `localhost:3001` due to CORS.

**Solution: Use a tunnel to expose localhost:3001**

#### Using Cloudflared (Free, No Signup)

1. **Install Cloudflared:**
   ```bash
   brew install cloudflared  # macOS
   # or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Create Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```
   
   You'll get a URL like: `https://random-name.trycloudflare.com`

3. **Update Frontend:**
   - Add `?localApi=true` to your URL on noticebazaar.com
   - Or set in browser console: `localStorage.setItem('useLocalApi', 'true')`
   - Update the tunnel URL in `ContractUploadFlow.tsx` temporarily

#### Using ngrok (Alternative)

1. **Install ngrok:**
   ```bash
   brew install ngrok  # macOS
   # or download from: https://ngrok.com/download
   ```

2. **Create Tunnel:**
   ```bash
   ngrok http 3001
   ```
   
   You'll get a URL like: `https://random-name.ngrok.io`

3. **Update Frontend** (same as above)

### Option 3: Use Render API (Production)

The Render API is already deployed at:
- `https://noticebazaar-api.onrender.com`

Just update your frontend environment variable:
```env
VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
```

## Quick Test Commands

```bash
# Test API health
curl http://localhost:3001/health

# Test with authentication (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3001/api/protection/analyze \
     -d '{"contract_url":"YOUR_CONTRACT_URL"}'
```

## Current API Status

- ✅ Server running on port 3001
- ✅ CORS configured for noticebazaar.com
- ✅ Health endpoint working
- ⚠️ Browser blocks noticebazaar.com → localhost:3001 (CORS security)

## Recommended: Test Locally First

1. Run frontend: `npm run dev` (port 5173)
2. API already running (port 3001)
3. Test contract upload on `http://localhost:5173`
4. Once working, deploy to Render for production

