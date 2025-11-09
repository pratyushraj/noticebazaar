# Troubleshooting ERR_FAILED Error

The `ERR_FAILED` error is a generic network error. Follow these steps to diagnose:

## Step 1: Get More Information

1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. Go to the **Network** tab
3. Try to reproduce the error
4. Look for the failed request (it will be in red)
5. Click on the failed request to see details:
   - **Status Code** (e.g., 0, 400, 500, etc.)
   - **Request URL** (what resource is failing)
   - **Response Headers** (if any)
   - **Error Message** (more specific error)

## Step 2: Check Console Errors

1. Go to the **Console** tab in DevTools
2. Look for any error messages
3. Check for:
   - CSP violations
   - CORS errors
   - Network errors
   - JavaScript errors

## Step 3: Common Causes

### CSP (Content Security Policy) Violation
- **Symptom**: Error in console mentioning "Content Security Policy"
- **Solution**: Check if the domain is in `connect-src` in CSP
- **Fix**: Add the domain to `index.html` and `vercel.json` CSP headers

### CORS Error
- **Symptom**: Error mentioning "CORS" or "Access-Control-Allow-Origin"
- **Solution**: Check if the server allows requests from your domain
- **Fix**: Configure CORS on the server or use a proxy

### Network Connectivity
- **Symptom**: Request fails immediately with no response
- **Solution**: Check internet connection, firewall, or VPN
- **Fix**: Try different network or disable VPN/firewall

### Server Error (500, 502, 503)
- **Symptom**: Status code 500, 502, or 503
- **Solution**: Check server logs or Edge Function logs
- **Fix**: Fix the server-side error

### Invalid URL or Missing Resource
- **Symptom**: Request to non-existent URL
- **Solution**: Check if the URL is correct
- **Fix**: Update the URL or create the missing resource

### Authentication Error
- **Symptom**: Status code 401 or 403
- **Solution**: Check if user is logged in and token is valid
- **Fix**: Re-authenticate or refresh token

## Step 4: Check Specific Resources

### If it's a Supabase request:
1. Check Supabase Dashboard > Logs
2. Verify the table/function exists
3. Check RLS policies
4. Verify API keys are correct

### If it's an Edge Function:
1. Check Edge Function logs in Supabase Dashboard
2. Verify the function is deployed
3. Check environment variables/secrets
4. Test the function directly

### If it's an external API:
1. Check if the API is accessible
2. Verify API keys/credentials
3. Check rate limits
4. Test with curl or Postman

## Step 5: Provide Details

When reporting the error, include:
- **What resource is failing** (URL)
- **When it happens** (on page load, on button click, etc.)
- **Status code** (from Network tab)
- **Error message** (from Console tab)
- **Browser and version**
- **Any console errors**

## Quick Fixes to Try

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear browser cache**: Settings > Clear browsing data
3. **Disable browser extensions**: Some extensions block requests
4. **Try incognito/private mode**: Rules out cache/extension issues
5. **Check if it works in another browser**: Rules out browser-specific issues
6. **Check network tab**: See if request is being made at all

## Getting Help

If the error persists, provide:
1. Screenshot of Network tab showing the failed request
2. Screenshot of Console tab showing errors
3. The specific URL that's failing
4. Steps to reproduce the error

