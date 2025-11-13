# Razorpay Setup Instructions

## ⚠️ SECURITY WARNING
**NEVER commit Razorpay credentials to git!** These are production keys.

## Environment Variables Setup

Add these secrets to your Supabase project:

### Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:

```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Via Supabase CLI:
```bash
supabase secrets set RAZORPAY_KEY_ID=your_key_id_here
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret_here
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Your Credentials

**⚠️ Keep these secure!** Store them in Supabase secrets, not in code.

- **Key ID**: `rzp_live_RfJ4PQBemchFmj`
- **Key Secret**: `t2DtKIxwUjByQjq69KE4SVS7`
- **Webhook Secret**: (Get this from Razorpay dashboard after setting up webhook)

## Quick Setup Script

```bash
# Make sure you're logged in: supabase login
supabase secrets set RAZORPAY_KEY_ID=rzp_live_RfJ4PQBemchFmj
supabase secrets set RAZORPAY_KEY_SECRET=t2DtKIxwUjByQjq69KE4SVS7
```

## Webhook Configuration

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add a new webhook with URL:
   ```
   https://your-project-id.supabase.co/functions/v1/razorpay-webhook
   ```
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Copy the webhook secret and add it:
   ```bash
   supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay
   ```

## Deploy Edge Functions

After setting secrets, deploy the functions:

```bash
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-webhook
```

## Testing

For testing, you can use Razorpay test mode:
- Test Key: `rzp_test_...`
- Test Secret: `...`

Switch to test mode in the edge functions by changing the environment variables.

## Important Notes

- These are **LIVE** credentials (production)
- Keep them secure and never expose in client-side code
- Rotate secrets if they're ever exposed
- Use test credentials for development
- The webhook secret is different from the API secret
