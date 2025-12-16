# Brand Reply Security & Audit Trail Implementation

## Overview

This implementation adds cryptographically secure UUID v4 tokens and a comprehensive audit trail to the Brand Reply flow, ensuring:

- **URL Trust**: Unguessable, non-sequential tokens (UUID v4, 128-bit entropy)
- **Token Validation**: Active/expired/revoked checks on every request
- **Audit Trail**: Immutable log of all brand actions
- **Privacy**: No sensitive data exposure (creator email, phone, internal IDs)
- **Expiry Support**: Optional link expiration (default: no expiry)

## Database Migrations

### 1. `2025_02_01_create_brand_reply_tokens.sql`
Creates the `brand_reply_tokens` table for secure token storage.

**Key Features:**
- UUID v4 primary key (cryptographically secure)
- Links to `deal_id` and `created_by` (creator)
- Optional `expires_at` (NULL = no expiry)
- `is_active` and `revoked_at` for revocation support
- RLS policies for creator access

### 2. `2025_02_01_create_brand_reply_audit_log.sql`
Creates the `brand_reply_audit_log` table for immutable audit trail.

**Key Features:**
- Tracks all actions: `viewed`, `accepted`, `negotiation_requested`, `rejected`, `updated_response`
- Stores `user_agent`, hashed IP address, partial IP (first 3 octets)
- Optional comment from brand
- Append-only (no updates/deletes)
- RLS policies for creator read access

## Backend Changes

### Routes Updated

1. **`/api/brand-response/:token` (GET & POST)**
   - Changed from `/:dealId` to `/:token`
   - Validates token format (UUID v4)
   - Checks token active/expired/revoked status
   - Logs "viewed" action on GET
   - Logs decision actions on POST
   - Returns neutral error messages

2. **`/api/otp/send` & `/api/otp/verify`**
   - Updated to use `token` instead of `dealId`
   - Validates token before processing

3. **`/api/brand-reply-tokens` (NEW)**
   - `POST /` - Create token (authenticated)
   - `DELETE /:tokenId` - Revoke token (authenticated)
   - `GET /audit/:dealId` - Get audit summary (authenticated)

### Services

**`server/src/services/brandReplyTokenService.ts`**
- `createBrandReplyToken()` - Creates secure token
- `revokeBrandReplyToken()` - Revokes token
- `getAuditSummary()` - Returns read-only audit summary for creators

## Frontend Changes

### Route Update
- Changed from `/brand-reply/:dealId` to `/brand-reply/:token`
- Updated `BrandResponsePage.tsx` to use `token` param
- Updated error messages to be neutral

### Token Generation

**Before (insecure):**
```typescript
const brandReplyLink = `${baseUrl}/#/brand-reply/${deal.id}`;
```

**After (secure):**
```typescript
// 1. Create token via API
const response = await fetch('/api/brand-reply-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    dealId: deal.id,
    expiresAt: null // or ISO date string for expiry
  })
});
const { token } = await response.json();

// 2. Use token in link
const brandReplyLink = `${baseUrl}/#/brand-reply/${token.id}`;
```

## Security Features

### Token Security
- ✅ UUID v4 (128-bit entropy, unguessable)
- ✅ Non-sequential (not derived from deal/user IDs)
- ✅ Optional expiry support
- ✅ Revocation support
- ✅ Format validation on all endpoints

### Data Privacy
- ✅ No creator email/phone exposure
- ✅ No internal deal IDs in URLs
- ✅ IP addresses hashed and partially masked
- ✅ Only safe data exposed: brand name, deal summary, requested changes

### Audit Trail
- ✅ Immutable (append-only)
- ✅ Tracks all actions with timestamps
- ✅ Stores user agent and hashed IP
- ✅ Preserves decision history
- ✅ Creator read-only access

## Migration Steps

1. **Run Database Migrations:**
   ```sql
   -- Apply migrations in order:
   -- 1. 2025_02_01_create_brand_reply_tokens.sql
   -- 2. 2025_02_01_create_brand_reply_audit_log.sql
   ```

2. **Update Frontend Code:**
   - Replace all `brand-reply/${dealId}` links with token-based links
   - Update `DealDetailPage.tsx`, `ContractUploadFlow.tsx`, `UniversalShareModal.tsx`
   - Use the new `/api/brand-reply-tokens` endpoint to generate tokens

3. **Deploy Backend:**
   - Updated routes are backward-incompatible (old dealId links won't work)
   - Consider a grace period or migration script for existing links

## Usage Examples

### Creating a Token (Frontend)
```typescript
async function generateBrandReplyLink(dealId: string): Promise<string> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  const response = await fetch(`${apiBaseUrl}/api/brand-reply-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}` // From Supabase session
    },
    body: JSON.stringify({
      dealId,
      expiresAt: null // No expiry, or: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
  });
  
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/brand-reply/${data.token.id}`;
}
```

### Getting Audit Summary (Frontend)
```typescript
async function getBrandReplyAudit(dealId: string) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  const response = await fetch(`${apiBaseUrl}/api/brand-reply-tokens/audit/${dealId}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  const data = await response.json();
  return data.audit; // { firstViewedAt, latestDecision, lastUpdatedAt }
}
```

## Error Handling

### Token Validation Errors
- `token_not_found` - Token doesn't exist
- `token_revoked` - Token was revoked
- `token_expired` - Token expired (if expiry was set)

All return neutral message: "This link is no longer valid. Please contact the creator."

### Expired Links
If expiry is set and exceeded:
- "This request has expired. Please ask the creator to resend."

## Notes

- **No UI Changes**: This implementation maintains existing UI/UX
- **Backward Incompatible**: Old dealId-based links will stop working
- **Audit Trail**: Immutable, append-only log for record-keeping (not legally binding)
- **Privacy First**: IP addresses are hashed and partially masked
- **Creator Visibility**: Read-only audit summary (no IP/user agent details)

## Testing

1. Create a token for a deal
2. Access the brand reply page with the token
3. Verify "viewed" action is logged
4. Submit a decision
5. Verify decision action is logged
6. Check audit summary (creator view)
7. Test token expiry (if set)
8. Test token revocation


