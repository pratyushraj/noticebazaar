# Fix OTP Email Error on Deployed Server

## Problem
The error "Resend API key is not configured" appears when trying to send OTP emails on the deployed server (`noticebazaar-api.onrender.com`).

## Solution: Add RESEND_API_KEY to Render

### Steps:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in to your account

2. **Open Your Service**
   - Find and click on `noticebazaar-api` service

3. **Add Environment Variable**
   - Click on **"Environment"** tab (in the left sidebar)
   - Click **"Add Environment Variable"** button
   - Add:
     - **Key:** `RESEND_API_KEY`
     - **Value:** Your Resend API key (starts with `re_`)

4. **Get Your Resend API Key**
   - Go to: https://resend.com/api-keys
   - Sign up or log in to Resend
   - Navigate to **API Keys** section
   - Click **"Create API Key"** or use an existing one
   - Copy the key (it starts with `re_`)
   - Paste it as the value in Render

5. **Save and Redeploy**
   - Click **"Save Changes"** in Render
   - Render will automatically redeploy your service
   - Wait 2-3 minutes for deployment to complete

6. **Test**
   - Try sending an OTP again
   - It should work now!

## Local Server

The local server should work automatically if:
- `RESEND_API_KEY` is set in `server/.env`
- The server is restarted (tsx watch should auto-restart)

## Verification

After adding the environment variable, you can verify it's loaded by checking the server logs:
- The server should log: `[Server] RESEND_API_KEY loaded: re_xxxxx...`
- If you see: `[Server] ⚠️ RESEND_API_KEY not found`, the variable wasn't set correctly

## Notes

- The API key in your local `.env` file is: `re_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH`
- You can use the same key for the deployed server, or create a new one
- Never commit `.env` files to git (they're already in `.gitignore`)

