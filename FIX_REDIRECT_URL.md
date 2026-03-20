# Quick Fix: Add Wildcard to Production URL

In the "Add new redirect URLs" modal:

1. **Delete** `https://noticebazaar.com` (click trash icon)
2. **Add** `https://noticebazaar.com/**` (with the `/**` wildcard)
3. Click **Save URLs**

The `/**` is important - it allows all paths under your domain to work with authentication redirects.

## Why `/**` is needed:

- Without `/**`: Only `https://noticebazaar.com/` works
- With `/**`: All paths work (e.g., `/login`, `/dashboard`, `/creator-dashboard`, etc.)

This ensures magic links and OAuth callbacks work from any page on your site.
