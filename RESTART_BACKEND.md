# Restart Backend to Load Leegality Config

The Leegality environment variables have been added to `server/.env`, but the backend needs to be restarted to load them.

## Quick Steps

1. **Stop the current backend server** (if running):
   - Press `Ctrl+C` in the terminal where the server is running
   - Or find and kill the process

2. **Restart the backend**:
   ```bash
   cd server
   npm run dev
   # or
   pnpm dev
   ```

3. **Verify it's working**:
   - Check the console for startup messages
   - The "Leegality eSign is not configured" error should disappear
   - Try clicking "Send for Legal eSign" again

## Environment Variables Added

The following have been added to `server/.env`:

```
LEEGALITY_AUTH_TOKEN=XNITsMUndZkptapbmj5WprjK6dXHYvO5
LEEGALITY_PRIVATE_SALT=b4JA2ac8XE6npmoHHROcf9PRZMvNiKss
LEEGALITY_WEBHOOK_SECRET=b4JA2ac8XE6npmoHHROcf9PRZMvNiKss
LEEGALITY_BASE_URL=https://sandbox.leegality.com/api/v3
```

## Test Configuration

After restarting, you can test the config endpoint:

```bash
curl http://localhost:3001/api/esign/config
```

Should return:
```json
{
  "success": true,
  "configured": true,
  "hasAuthToken": true,
  "hasPrivateSalt": true,
  "hasWebhookSecret": true,
  "hasBaseUrl": true
}
```

---

**Note**: Environment variables are only loaded when the Node.js process starts, so a restart is required.

