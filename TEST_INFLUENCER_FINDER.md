# Testing Influencer Finder System

## Quick Test Guide

### Option 1: Test Locally

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Run test script:**
   ```bash
   # Test health endpoint only
   node test-influencer-finder.js health
   
   # Test all endpoints (requires auth token)
   TEST_AUTH_TOKEN=your-jwt-token node test-influencer-finder.js
   
   # Test specific endpoint
   TEST_AUTH_TOKEN=your-jwt-token node test-influencer-finder.js find
   ```

### Option 2: Test on Render (Deployed)

If your service is deployed on Render:

```bash
# Set your Render URL
export API_BASE_URL=https://your-service.onrender.com
export TEST_AUTH_TOKEN=your-jwt-token

# Run tests
node test-influencer-finder.js
```

### Option 3: Manual Testing with cURL

#### 1. Health Check (No Auth Required)
```bash
curl http://localhost:3001/health
```

#### 2. Find Influencers (Requires Auth)
```bash
curl -X GET "http://localhost:3001/api/influencers/find?hashtags=fitness,india&keywords=influencer&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. List Influencers
```bash
curl -X GET "http://localhost:3001/api/influencers/list?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. High-Fit Influencers
```bash
curl -X GET "http://localhost:3001/api/influencers/high-fit?minScore=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Generate Outreach Message
```bash
curl -X POST "http://localhost:3001/api/influencers/johndoe/generate-outreach" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "default"}'
```

#### 6. Run Daily Scan
```bash
curl -X POST "http://localhost:3001/api/influencers/run-daily-scan" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Getting a JWT Token for Testing

### Option 1: From Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user or use existing
3. Copy the JWT token from the user's session

### Option 2: Login via API
```bash
# Login and get token
curl -X POST "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password"
  }'
```

### Option 3: Use Admin Service Role Key
For testing purposes, you can temporarily use the service role key (not recommended for production).

## Expected Responses

### Health Check
```json
{
  "status": "ok",
  "timestamp": "2025-01-29T...",
  "supabaseInitialized": true,
  "nodeEnv": "development",
  "llm": {
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "apiKeyConfigured": true,
    "status": "configured"
  }
}
```

### Find Influencers
```json
{
  "success": true,
  "count": 5,
  "influencers": [
    {
      "creator_name": "John Doe",
      "instagram_handle": "johndoe",
      "followers": 50000,
      "niche": "fitness",
      "fit_score": 8,
      "is_india_based": true,
      "is_relevant_niche": true,
      "is_active": true,
      "source": "manual"
    }
  ]
}
```

## Troubleshooting

### Server Not Running
```bash
cd server
npm run dev
```

### Authentication Errors
- Make sure you have a valid JWT token
- Check that the token hasn't expired
- Verify RLS policies allow your user to access the endpoints

### LLM API Errors
- Verify `LLM_API_KEY` is set in environment variables
- Check `LLM_PROVIDER` matches your API key provider
- Verify API key is valid and has credits/quota

### Database Errors
- Ensure migration has been run: `supabase/migrations/2025_01_29_create_influencers_table.sql`
- Check Supabase connection in environment variables
- Verify RLS policies are set correctly

## Test Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns OK
- [ ] LLM provider is configured correctly
- [ ] Database connection works
- [ ] Find influencers endpoint works (may return empty if no scraping services configured)
- [ ] List influencers endpoint works
- [ ] Generate outreach endpoint works
- [ ] Daily scan endpoint works

## Notes

- The find influencers endpoint may return empty results if Instagram scraping services (Apify/Phantombuster) are not configured
- This is expected - the system will use fallback methods or manual import
- For full functionality, configure at least one scraping service or use manual CSV import

