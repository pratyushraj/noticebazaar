# How to Check Backend Error Logs

## 📍 Where to Find Backend Logs

The backend server logs appear in the **terminal where you started the backend server**.

### Step 1: Start Backend Server (if not running)

Open a terminal and run:

```bash
cd server
npm run dev
```

You should see:
```
🚀 CreatorArmour API server running on port 3001
✅ Supabase client initialized successfully
```

### Step 2: Look for Error Messages

When you visit `http://localhost:8080/#/rahul_creates`, watch the backend terminal for errors.

**Look for these log prefixes:**
- `[CollabRequests]` - Errors from the collab routes
- `[CollabRequests] Error fetching creator:` - Database query errors
- `[CollabRequests] Error code:` - Supabase error code
- `[CollabRequests] Error message:` - Detailed error message
- `[CollabRequests] Error details:` - Full error object

### Step 3: Common Error Patterns

**Missing Column Error:**
```
[CollabRequests] Error code: 42703
[CollabRequests] Error message: column "column_name" does not exist
```

**RLS Policy Error:**
```
[CollabRequests] Error code: 42501
[CollabRequests] Error message: new row violates row-level security policy
```

**Connection Error:**
```
[CollabRequests] Supabase client initialized: false
```

## 🔍 Quick Debug Commands

### Check if backend is running:
```bash
curl http://localhost:3001/health
```

### Test the specific endpoint:
```bash
curl http://localhost:3001/api/collab/rahul_creates
```

### Check backend logs in real-time:
If using `tsx watch`, logs appear automatically. If using `node`, restart to see logs.

## 📋 What to Share

When reporting the error, share:
1. **Full error message** from backend terminal
2. **Error code** (e.g., 42703, 42501)
3. **Error message** (the exact text)
4. **Stack trace** (if available)

## 🎯 Example Error Output

```
[CollabRequests] Error fetching creator: {
  code: '42703',
  message: 'column "youtube_channel_id" does not exist',
  details: '...',
  hint: 'Perhaps you meant to reference the column "youtube_channel".'
}
[CollabRequests] Error code: 42703
[CollabRequests] Error message: column "youtube_channel_id" does not exist
[CollabRequests] Username searched: rahul_creates
[CollabRequests] Supabase client initialized: true
```

This tells you exactly which column is missing!

