# Test Account Credentials

## Quick Access

After running the seed script (`npm run seed`), use these credentials to log in:

```
Email: test@noticebazaar.com
Password: Test123!@#
```

## What's Included

✅ **User Account**: Auto-confirmed, ready to use  
✅ **Creator Profile**: Onboarding complete, trial activated  
✅ **6 Brand Deals**: Mix of pending, completed, and overdue deals  
✅ **Sample Data**: Realistic test data for dashboard testing  

## Setup Instructions

1. **Get Supabase Service Role Key**:
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key

2. **Add to `.env.local`**:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run Seed Script**:
   ```bash
   npm run seed
   ```

4. **Log In**:
   - Go to `/login`
   - Use the credentials above
   - You'll be redirected to the dashboard with real data!

## Sample Data Details

### Brand Deals Created:
- **Zepto** - ₹8,500 (Payment Pending, due in 16 days)
- **Nike** - ₹20,000 (Payment Pending, due in 12 days)
- **Mamaearth** - ₹4,254 (Payment Pending, due in 2 days)
- **boAt** - ₹12,000 (Payment Pending, Overdue by 8 days)
- **Ajio** - ₹14,500 (Payment Pending, due in 4 days)
- **Fashion Nova** - ₹85,000 (Completed, Payment Received)

### Profile Details:
- **Name**: Test Creator
- **Business**: Test Creator Studio
- **Entity Type**: Individual
- **Instagram**: @testcreator (45K followers)
- **YouTube**: 125K subscribers
- **Trial**: Active for 30 days

## Resetting Test Data

To reset and create fresh test data:

```bash
npm run seed
```

The script will automatically delete the old test user and create a new one.

