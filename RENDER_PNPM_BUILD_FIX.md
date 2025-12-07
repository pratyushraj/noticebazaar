# 🔧 Render Build Fix - pnpm Support

## Problem
Render static site build is failing because the project uses `pnpm` but the build command was using `npm`.

## Error
```
npm error Cannot read properties of null (reading 'matches')
```

This happens because:
- Project has `pnpm-lock.yaml` (uses pnpm)
- Render detects pnpm but build command uses npm
- Conflict causes build failure

## Solution

### Updated Build Command for Render Static Site

Change the build command in Render Dashboard to:

```bash
corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build
```

### What This Does:

1. **`corepack enable`** - Enables Node.js Corepack (package manager manager)
2. **`corepack prepare pnpm@latest --activate`** - Activates pnpm
3. **`pnpm install`** - Installs dependencies using pnpm
4. **`pnpm run build`** - Builds the project with pnpm

## How to Fix in Render Dashboard

1. Go to your Static Site service in Render
2. Click **Settings** → **Build & Deploy**
3. Update **Build Command** to:
   ```
   corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build
   ```
4. Click **Save Changes**
5. Go to **Manual Deploy** → **Clear build cache & deploy**

## Alternative: Use npm (Convert Lock File)

If you prefer to use npm instead:

1. Delete `pnpm-lock.yaml`
2. Run `npm install` locally to create `package-lock.json`
3. Commit the changes
4. Use build command: `npm install && npm run build`

**Note:** This may change dependency resolution, so pnpm is recommended if your project is set up for it.

## Verify Node.js Version

Make sure Render is using Node.js 18+ (corepack requires Node 18+):
- Render auto-detects from `package.json` engines field
- Or set in Render Dashboard → Environment → Node Version

## Quick Fix Checklist

- [ ] Go to Render Static Site settings
- [ ] Update Build Command to use pnpm
- [ ] Clear build cache
- [ ] Redeploy
- [ ] Monitor build logs

