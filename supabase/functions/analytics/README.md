# Analytics Edge Function

Supabase Edge Function for tracking user analytics events with fraud detection, rate limiting, and replay protection.

## Endpoint

`POST /functions/v1/analytics`

## Authentication

Requires a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Request Body

### Single Event

```json
{
  "event": "tutorial_started",
  "metadata": {
    "category": "tutorial",
    "userId": "uuid",
    "tutorial_type": "dashboard"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "page_url": "https://app.example.com/dashboard"
}
```

### Batch Events (Multiple events in one request)

```json
{
  "events": [
    {
      "event": "tutorial_started",
      "metadata": { "category": "tutorial" },
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "event": "tutorial_step_viewed",
      "metadata": { "step": "welcome", "step_number": 1 },
      "timestamp": "2025-01-15T10:30:05Z"
    }
  ]
}
```

## Response

### Success

```json
{
  "success": true,
  "processed": 2,
  "total": 2,
  "rate_limit": {
    "remaining": 98,
    "reset_at": 1705312200000
  }
}
```

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

Status: `429 Too Many Requests`

Headers:
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Rate Limiting

- **Window:** 1 minute
- **Max Requests:** 100 per user per minute
- **Max Events:** 50 events per request

## Fraud Detection

The function automatically detects:

- **Suspicious Timing:** Events completed too quickly (e.g., tutorial in < 100ms)
- **Invalid Data:** Step numbers exceeding total steps
- **Replay Attacks:** Duplicate request hashes

Anomalies are flagged but still recorded for analysis.

## Database Schema

Events are stored in `analytics_events` table:

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- event_name: TEXT
- event_category: TEXT
- metadata: JSONB
- page_url: TEXT
- user_agent: TEXT
- ip_address: TEXT
- referer: TEXT
- language: TEXT
- request_hash: TEXT (for replay protection)
- is_anomaly: BOOLEAN
- anomaly_reason: TEXT
- created_at: TIMESTAMPTZ
```

## Deployment

```bash
# Deploy the function
supabase functions deploy analytics

# Or using Supabase CLI
npx supabase functions deploy analytics
```

## Environment Variables

Required in Supabase dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Analytics Dashboard

Query aggregated stats:

```sql
SELECT * FROM analytics_dashboard
WHERE event_date >= NOW() - INTERVAL '7 days'
ORDER BY event_date DESC, event_count DESC;
```

## Data Retention

Optional cleanup function removes events older than 1 year:

```sql
SELECT public.cleanup_old_analytics_events();
```

Run this periodically (e.g., via cron job).

