# Link Social Account Edge Function

Supabase Edge Function that exchanges OAuth authorization codes for access tokens, stores encrypted credentials, and returns creator profile details for Instagram, YouTube, TikTok, and Twitter (X).

## Endpoint

`POST /functions/v1/link-social-account`

## Request Body

```json
{
  "platform": "instagram",
  "auth_code": "AUTH_CODE_FROM_PLATFORM",
  "user_id": "UUID_OF_PROFILE",
  "redirect_uri": "https://your-app.com/auth/callback" // Optional override
}
```

### Supported platforms
- `instagram`
- `youtube`
- `tiktok`
- `twitter`

## Successful Response

```json
{
  "success": true,
  "platform": "instagram",
  "username": "creatorname",
  "followers": 45230,
  "verified": true,
  "profile_url": "https://instagram.com/creatorname",
  "profile_picture_url": "https://.../avatar.jpg",
  "connected_at": "2025-11-12T09:16:00.000Z"
}
```

## Error Response

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again in a few minutes."
}
```

## Rate Limiting
- Maximum 3 link attempts per platform per user within a 10 minute window.
- Attempts are logged in `social_account_link_attempts`.

## Database

### `social_accounts`
| column               | type      | description                            |
|----------------------|-----------|----------------------------------------|
| id                   | uuid      | Primary key                            |
| user_id              | uuid      | References `profiles(id)`              |
| platform             | text      | instagram, youtube, tiktok, twitter    |
| username             | text      | Creator username                        |
| access_token         | bytea     | Encrypted access token (pgp_sym_encrypt) |
| refresh_token        | bytea     | Encrypted refresh token (optional)     |
| followers            | integer   | Latest follower count                   |
| profile_url          | text      | Profile URL                             |
| profile_picture_url  | text      | Avatar URL                              |
| verified             | boolean   | Verification status                     |
| connected_at         | timestamptz | Linked timestamp                      |
| updated_at           | timestamptz | Updated timestamp                     |

### `social_account_link_attempts`
Tracks link attempts for rate limiting.

## Environment Variables

Add the following to your Supabase Edge Function environment:

```text
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
SOCIAL_ACCOUNT_ENCRYPTION_KEY="strong-random-string"

FACEBOOK_APP_ID="instagram-app-id"
FACEBOOK_APP_SECRET="instagram-app-secret"
INSTAGRAM_REDIRECT_URI="https://your-app.com/auth/instagram"

GOOGLE_CLIENT_ID="youtube-client-id"
GOOGLE_CLIENT_SECRET="youtube-client-secret"
GOOGLE_REDIRECT_URI="https://your-app.com/auth/youtube"

TIKTOK_CLIENT_KEY="tiktok-client-key"
TIKTOK_CLIENT_SECRET="tiktok-client-secret"
TIKTOK_REDIRECT_URI="https://your-app.com/auth/tiktok"

TWITTER_CLIENT_ID="twitter-client-id"
TWITTER_CLIENT_SECRET="twitter-client-secret"
TWITTER_REDIRECT_URI="https://your-app.com/auth/twitter"
```

## Workflows

- **Token Encryption**: Edge function calls `store_social_account` (SQL function) which encrypts tokens with `pgp_sym_encrypt`.
- **OAuth Refresh** (optional): Implement webhook or cron job to refresh tokens on expiry.
- **Follower Sync** (optional): Schedule weekly cron to re-fetch follower counts.
- **UI Badges** (optional): Use API response to show “Linked ✓” or “Reconnect needed”.
