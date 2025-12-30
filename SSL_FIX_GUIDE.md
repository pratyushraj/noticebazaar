# Fix SSL Error for api.creatorarmour.com

## Issue
`ERR_SSL_VERSION_OR_CIPHER_MISMATCH` when accessing `api.creatorarmour.com`

## Status
✅ Domain verified in Render
✅ Certificate issued
❌ SSL connection failing

## Solutions

### Solution 1: Wait for Certificate Propagation (Most Common)

After adding a custom domain in Render, SSL certificates can take **5-30 minutes** to fully propagate.

**Steps:**
1. Wait 15-30 minutes after domain verification
2. Try accessing the URL again
3. Clear browser cache or use incognito mode

### Solution 2: Restart Backend Service

Sometimes the service needs a restart to pick up the new SSL certificate.

**Steps:**
1. Go to Render Dashboard
2. Select your backend service (`noticebazaar-api`)
3. Go to **Manual Deploy** tab
4. Click **"Clear build cache & deploy"** or **"Deploy latest commit"**
5. Wait for deployment to complete
6. Test the URL again

### Solution 3: Verify DNS Configuration

Ensure DNS is correctly pointing to Render.

**Check DNS:**
```bash
# Check CNAME record
dig api.creatorarmour.com CNAME

# Should show something like:
# api.creatorarmour.com. 3600 IN CNAME [render-provided-value]
```

**If DNS is incorrect:**
1. Go to your domain registrar
2. Verify CNAME record for `api` subdomain
3. Should point to Render's provided value
4. Wait for DNS propagation (5-15 minutes)

### Solution 4: Check Render Service Configuration

**Verify in Render Dashboard:**
1. Go to your backend service
2. Check **Settings** → **Custom Domains**
3. Ensure `api.creatorarmour.com` shows:
   - ✅ Domain Verified
   - ✅ Certificate Issued
4. If certificate shows "Pending", wait for it to complete

### Solution 5: Test Backend Health

Verify the backend is accessible:

```bash
# Test health endpoint
curl https://api.creatorarmour.com/health

# Test OG endpoint
curl https://api.creatorarmour.com/og
```

**If these fail:**
- Backend might be sleeping (Render free tier)
- Service might need restart
- Check Render logs for errors

### Solution 6: Check Browser/Network Issues

**Try different methods:**
1. **Different browser** (Chrome, Firefox, Safari)
2. **Incognito/Private mode**
3. **Different network** (mobile data, different WiFi)
4. **Command line:**
   ```bash
   curl -v https://api.creatorarmour.com/og
   ```

### Solution 7: Verify Backend is Running

**Check Render Dashboard:**
1. Go to your backend service
2. Check **Logs** tab
3. Verify service is running (not crashed)
4. Look for any SSL/TLS errors in logs

### Solution 8: Force Certificate Renewal (If Needed)

If certificate is stuck:

1. **In Render Dashboard:**
   - Go to Settings → Custom Domains
   - Remove `api.creatorarmour.com`
   - Wait 1 minute
   - Add it back
   - Wait for verification and certificate issuance

2. **Or contact Render support** if issue persists

## Quick Test Commands

```bash
# Test 1: Health check
curl https://api.creatorarmour.com/health

# Test 2: OG endpoint
curl https://api.creatorarmour.com/og

# Test 3: Specific OG deal
curl https://api.creatorarmour.com/og/deal/test-token-id

# Test 4: Check SSL certificate
openssl s_client -connect api.creatorarmour.com:443 -servername api.creatorarmour.com
```

## Expected Behavior

Once SSL is working:
- ✅ Browser shows secure connection (lock icon)
- ✅ `curl` commands return HTML/JSON
- ✅ No SSL errors in browser console
- ✅ OG preview links work correctly

## If Still Not Working

1. **Check Render Status Page:** https://status.render.com
2. **Check Render Logs:** Look for SSL/certificate errors
3. **Contact Render Support:** If issue persists after 1 hour

## Common Causes

1. **Certificate propagation delay** (most common - wait 15-30 min)
2. **Service needs restart** after adding domain
3. **DNS not fully propagated** (wait 5-15 min)
4. **Browser cache** (clear cache or use incognito)
5. **Service crashed** (check Render logs)

