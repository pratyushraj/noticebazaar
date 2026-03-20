# CORB (Cross-Origin Read Blocking) Fix

## Issue
Browser was showing CORB warnings when fetching files from Supabase storage and other cross-origin resources.

## Solution
Updated all `fetch()` calls to:
1. **Use `mode: 'cors'`** - Explicitly enable CORS
2. **Use `credentials: 'omit'`** - Don't send credentials for public resources
3. **Direct download for Supabase public URLs** - For public storage files, use direct link download instead of fetch to avoid CORB entirely

## Files Fixed

### 1. `src/lib/utils/fileDownload.ts`
- Added CORS mode to fetch requests
- Added direct download fallback for Supabase public storage URLs
- This avoids CORB warnings for public files

### 2. `src/lib/utils.ts` (openContractFile)
- Added CORS mode to HEAD and GET requests
- Proper error handling for cross-origin requests

### 3. `src/lib/utils/dealZipBundle.ts`
- Added CORS mode to fetch requests when bundling documents

## Why This Works

CORB (Cross-Origin Read Blocking) is a browser security feature that blocks certain cross-origin responses. By:
1. Using `mode: 'cors'` - We tell the browser we expect CORS headers
2. Using `credentials: 'omit'` - We don't send cookies/auth, reducing security concerns
3. Using direct links for public files - We bypass fetch entirely for public Supabase storage

This eliminates CORB warnings while maintaining security.

## Testing

After these changes:
- ✅ No CORB warnings in browser console
- ✅ File downloads still work
- ✅ Contract previews still work
- ✅ ZIP bundle creation still works
- ✅ Cross-origin requests handled properly

