# Render Build Fix

## Issue
Render build is failing with:
```
EROFS: read-only file system, unlink '/usr/bin/pnpm'
```

This happens because the build command tries to run `corepack enable`, which attempts to modify system files that are read-only on Render.

## Solution

Render already has pnpm available, so we don't need to enable corepack. Update the build command in Render Dashboard:

### For Static Site (Frontend):

1. Go to Render Dashboard → Your Static Site → Settings
2. Find "Build Command" section
3. Change from:
   ```
   corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build
   ```
   
   To:
   ```
   pnpm install && pnpm run build
   ```

4. Save changes
5. Trigger a new deploy

### Alternative (if pnpm is not in PATH):

If the above doesn't work, try:
```
npx pnpm install && npx pnpm run build
```

Or use npm (slower but works):
```
npm install && npm run build
```

## Why This Works

- Render's Node.js environment already includes pnpm
- Corepack is not needed and fails due to read-only filesystem
- Direct pnpm commands work without corepack

## Verification

After updating, the build should:
1. ✅ Install dependencies successfully
2. ✅ Run `pnpm run build` successfully
3. ✅ Deploy the `dist/` folder

