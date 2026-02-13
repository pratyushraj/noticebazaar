# Secure Contract Downloads Implementation

## Overview
Implemented Option 1: Signed URLs with expiration for secure contract access. This replaces public Supabase Storage URLs with time-limited signed URLs that expire after 1 hour.

## Security Benefits
- **Time-Limited Access**: URLs expire after 1 hour, preventing long-term exposure
- **Authentication Required**: Only authorized users can generate signed URLs
- **Audit Trail**: All download attempts are logged with user information
- **No URL Enumeration**: Attackers cannot guess or enumerate contract URLs

## Implementation Details

### 1. Backend Changes

#### Storage Service (`server/src/services/storage.ts`)
- Added `uploadFileSecure()`: Uploads files and returns storage path instead of public URL
- Added `extractPathFromPublicUrl()`: Extracts storage path from legacy public URLs for migration

#### New API Endpoint (`server/src/routes/contracts.ts`)
- `POST /api/contracts/signed-url`: Generate signed URL for authenticated users
  - Validates user session
  - Verifies user owns the deal
  - Returns signed URL with 1-hour expiration
  
- `POST /api/contracts/signed-url-token`: Generate signed URL using magic link token
  - Validates token exists and hasn't expired
  - Returns signed URL for unauthenticated access (e.g., brand viewing)

#### Database Migration (`server/database/migrations/20260213_add_contract_file_paths.sql`)
- Added `contract_file_path` column: Stores storage path for unsigned contracts
- Added `signed_contract_path` column: Stores storage path for fully executed contracts
- Legacy `contract_file_url` and `signed_contract_url` columns remain for backward compatibility

### 2. Frontend Changes

#### Secure Download Utility (`src/lib/utils/secureContractDownload.ts`)
- `getSignedContractUrl()`: Generates signed URL for authenticated users
- `getSignedContractUrlWithToken()`: Generates signed URL using magic link token
- `downloadContractSecure()`: Downloads contract using signed URL
- `downloadContractWithToken()`: Downloads contract using token-based access

#### DealDetailPage Updates (`src/pages/DealDetailPage.tsx`)
- Modified `handleDownloadContract()` to use secure download method
- Falls back to legacy public URL if signed URL generation fails
- Logs download attempts with security metadata

## Migration Strategy

### Phase 1: Backward Compatibility (Current)
- New contracts will use path-based storage
- Legacy contracts continue using public URLs
- API endpoint handles both approaches seamlessly

### Phase 2: Gradual Migration
```sql
-- Script to migrate existing public URLs to paths
UPDATE brand_deals
SET contract_file_path = regexp_replace(
  contract_file_url,
  '^.*/storage/v1/object/public/[^/]+/(.+)$',
  '\\1'
)
WHERE contract_file_url IS NOT NULL
  AND contract_file_path IS NULL;
```

### Phase 3: Make Bucket Private (Future)
```sql
-- After all contracts migrated, make bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'creator-assets';
```

## Usage Examples

### Authenticated Download
```typescript
import { downloadContractSecure } from '@/lib/utils/secureContractDownload';

// In component
await downloadContractSecure(dealId);
```

### Magic Link Download
```typescript
import { downloadContractWithToken } from '@/lib/utils/secureContractDownload';

// In ContractReadyPage
await downloadContractWithToken(token, 'contract');
```

## Testing Checklist

- [ ] Authenticated users can download their contracts
- [ ] Signed URLs expire after 1 hour
- [ ] Users cannot access contracts they don't own
- [ ] Magic link tokens work for unauthenticated access
- [ ] Legacy public URLs still work (backward compatibility)
- [ ] Download attempts are logged in action_logs table
- [ ] Error handling works for expired/invalid tokens

## Next Steps

1. **Run Database Migration**: Execute `20260213_add_contract_file_paths.sql` in Supabase
2. **Deploy Backend**: Deploy updated server code to production
3. **Deploy Frontend**: Deploy updated frontend code
4. **Monitor**: Watch for errors in Vercel/Supabase logs
5. **Migrate Legacy Contracts**: Run migration script to convert public URLs to paths
6. **Make Bucket Private**: After migration complete, make bucket private for full security

## Rollback Plan

If issues occur:
1. Revert frontend to use `downloadFile()` directly
2. Keep backend changes (they're backward compatible)
3. Investigate and fix issues
4. Redeploy when ready

## Security Considerations

- Signed URLs are valid for 1 hour - adjust if needed
- Magic link tokens should have expiration dates
- Consider adding rate limiting to signed URL generation
- Monitor for suspicious download patterns
- Consider adding IP address logging for downloads
