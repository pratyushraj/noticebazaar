# Supabase Edge Function Setup for AI Email Composer

The AI Email Composer uses a Supabase Edge Function to proxy LLM API calls, avoiding CORS issues.

## Deploy the Edge Function

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy generate-email
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it: `generate-email`
5. Copy the contents of `supabase/functions/generate-email/index.ts`
6. Click **Deploy**

## Verify Deployment

After deployment, test the function:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a professional email",
    "provider": "huggingface",
    "model": "mistralai/Mistral-7B-Instruct-v0.2"
  }'
```

## Environment Variables (Optional)

If you want to use API keys for better rate limits, you can set them as Supabase secrets:

```bash
# For Hugging Face (optional, improves rate limits)
supabase secrets set HUGGINGFACE_API_KEY=your_key_here

# For Groq
supabase secrets set GROQ_API_KEY=your_key_here

# For Together AI
supabase secrets set TOGETHER_API_KEY=your_key_here

# For OpenAI
supabase secrets set OPENAI_API_KEY=your_key_here
```

Then update the Edge Function to read from `Deno.env.get('HUGGINGFACE_API_KEY')` etc.

## Troubleshooting

### Function not found (404)

- Make sure the function is deployed
- Check the function name matches exactly: `generate-email`
- Verify your Supabase URL is correct

### CORS errors

- The Edge Function handles CORS automatically
- Make sure you're calling it via your Supabase URL, not directly

### Authentication errors

- Ensure `VITE_SUPABASE_ANON_KEY` is set in your `.env.local`
- The function uses the anon key for authentication

## Testing Locally

You can test the Edge Function locally:

```bash
supabase functions serve generate-email
```

Then update your `.env.local` temporarily:
```env
VITE_SUPABASE_URL=http://localhost:54321
```

## Next Steps

Once deployed, the AI Email Composer will automatically use the Edge Function, avoiding all CORS issues! 🎉

