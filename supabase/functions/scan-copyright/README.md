# Scan Copyright Edge Function

This Edge Function scans all original content for a user and searches for potential copyright infringements across YouTube, TikTok, and Instagram.

## Functionality

1. **Authenticates user** via JWT from request headers
2. **Fetches all original content** for the authenticated user
3. **For each content item:**
   - Fetches original hash
   - Runs platform-specific searches (YouTube, TikTok, Instagram)
   - Computes similarity scores (hash_similarity + caption_similarity)
   - Creates copyright matches if similarity score >= 0.75
   - Uploads screenshots to Supabase storage
4. **Returns JSON** with total matches found and match details

## API

### Endpoint
`POST /functions/v1/scan-copyright`

### Headers
- `Authorization: Bearer <JWT_TOKEN>` - Required

### Response
```json
{
  "found": 5,
  "matches": [
    {
      "id": "uuid",
      "scan_id": "uuid",
      "matched_url": "https://...",
      "platform": "youtube",
      "similarity_score": 0.85,
      "screenshot_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Stub Functions

The following functions are currently stubbed and need implementation:

- `fetchOriginalHash()` - Fetch hash from original content
- `searchYouTube()` - Search YouTube for similar content
- `searchTikTok()` - Search TikTok for similar content
- `searchInstagram()` - Search Instagram for similar content
- `generateScreenshot()` - Generate screenshot of infringing content

## Similarity Score Calculation

The similarity score is computed as:
```
similarity_score = (hash_similarity * 0.6) + (caption_similarity * 0.4)
```

Matches are created only if `similarity_score >= 0.75`.

## Storage

Screenshots are uploaded to the `copyright-screenshots` bucket in Supabase Storage. Make sure this bucket exists and has proper RLS policies configured.

## Schema Notes

**Current Implementation:**
- Uses `scan_id` to link matches to scans (which link to original_content)
- Does not include `creator_id` or `original_content_id` directly in copyright_matches
- Does not include `status` field in copyright_matches

**If you need these fields:**
1. Add a migration to add `creator_id`, `original_content_id`, and `status` columns to `copyright_matches`
2. Update the function to populate these fields

## Error Handling

- All errors are logged to console
- Errors for individual content items don't stop the entire scan
- Returns 500 status with error message on critical failures

## CORS

CORS headers are configured to allow requests from:
- `*` (all origins) - Update for production to specific domains
- `localhost` for local development

## Deployment

```bash
supabase functions deploy scan-copyright
```

## Environment Variables

Required Supabase environment variables (automatically available):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing

Test locally:
```bash
supabase functions serve scan-copyright
```

Test with curl:
```bash
curl -X POST https://<project>.supabase.co/functions/v1/scan-copyright \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

