# Leegality eSign Setup Guide

The eSign functionality requires Leegality API credentials. Follow these steps to configure it:

## Required Environment Variables

Add these to your `server/.env` file:

```env
# Leegality eSign Configuration
LEEGALITY_AUTH_TOKEN=your_auth_token_here
LEEGALITY_PRIVATE_SALT=your_private_salt_here
LEEGALITY_WEBHOOK_SECRET=your_webhook_secret_here
LEEGALITY_BASE_URL=https://api.leegality.com/api/v3
```

## For Development/Testing

If you're using the Leegality sandbox:

```env
LEEGALITY_BASE_URL=https://sandbox.leegality.com/api/v3
```

## How to Get Leegality Credentials

1. **Sign up for Leegality**: Go to https://www.leegality.com/
2. **Create an account** or log in to your existing account
3. **Navigate to API Settings** in your Leegality dashboard
4. **Generate API credentials**:
   - Auth Token
   - Private Salt (for webhook signature verification)
   - Webhook Secret (for webhook security)

## Steps to Configure

1. **Open your server `.env` file**:
   ```bash
   # If it doesn't exist, create it in the server directory
   touch server/.env
   ```

2. **Add the environment variables** (see above)

3. **Restart your backend server**:
   ```bash
   cd server
   npm run dev
   ```

## Webhook Configuration

After setting up the environment variables, you'll also need to configure the webhook URL in your Leegality dashboard:

- **Webhook URL**: `https://your-domain.com/api/esign/webhook`
- **Events to subscribe**: `document.sent`, `document.signed`, `document.failed`

## Testing

Once configured, you should be able to:
1. Click "Send for Legal eSign" on a deal
2. The document will be sent to Leegality
3. Signing links will be sent to both brand and creator
4. Webhook will update the deal status when signing is complete

## Troubleshooting

- **Error: "Leegality eSign is not configured"**: Make sure `LEEGALITY_AUTH_TOKEN` is set in your `.env` file
- **Error: "Failed to upload document"**: Check your auth token and base URL
- **Webhook not working**: Verify `LEEGALITY_WEBHOOK_SECRET` matches your Leegality dashboard settings

---

**Note**: For production, make sure to use production Leegality credentials and update `LEEGALITY_BASE_URL` to the production API endpoint.

