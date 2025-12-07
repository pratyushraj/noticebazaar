# 🌐 Cloudflared Tunnel Setup for Local API Testing

## Quick Start

### Step 1: Start the Tunnel

In a terminal, run:
```bash
cloudflared tunnel --url http://localhost:3001
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-name.trycloudflare.com                                                    |
+--------------------------------------------------------------------------------------------+
```

### Step 2: Copy the Tunnel URL

Copy the URL (e.g., `https://random-name.trycloudflare.com`)

### Step 3: Set Tunnel URL in Browser

On `noticebazaar.com`, open browser console (F12) and run:
```javascript
localStorage.setItem('tunnelUrl', 'https://YOUR-TUNNEL-URL.trycloudflare.com');
localStorage.setItem('useLocalApi', 'true');
```

Replace `YOUR-TUNNEL-URL` with your actual tunnel URL.

### Step 4: Refresh the Page

Refresh `noticebazaar.com` and try uploading a contract. It will now use your local API via the tunnel!

## Alternative: Use URL Parameter

You can also add the tunnel URL as a parameter:
```
https://noticebazaar.com/upload?localApi=true&tunnelUrl=https://YOUR-TUNNEL-URL.trycloudflare.com
```

## Stopping the Tunnel

Press `Ctrl+C` in the terminal where cloudflared is running.

## Notes

- The tunnel URL changes each time you restart cloudflared
- Keep the terminal open while testing
- The tunnel is free and requires no signup
- It works from any domain (noticebazaar.com, localhost, etc.)

## Troubleshooting

**Tunnel not working?**
- Make sure your local API is running on port 3001
- Check that cloudflared is still running
- Verify the tunnel URL in browser console

**CORS errors?**
- The tunnel should bypass CORS, but if you see errors, check the tunnel URL is correct
- Make sure `useLocalApi` is set to `true` in localStorage

