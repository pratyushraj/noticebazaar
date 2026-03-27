# Seed Script for Test Data

This script creates a test user account with sample data for testing the NoticeBazaar dashboard.

## Prerequisites

1. **Supabase Service Role Key**: You need the service role key (not the anon key) to bypass RLS and create users.

   - Go to your Supabase Dashboard → Settings → API
   - Copy the `service_role` key (keep this secret!)

2. **Environment Variables**: Add these to your `.env.local` or `.env` file:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   Or set them directly:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

## Installation

Install the required dependencies:

```bash
npm install
```

## Usage

Run the seed script:

```bash
npm run seed
```

Or directly with tsx:

```bash
npx tsx scripts/seed-test-data.ts
```

## What It Creates

The script will create:

1. **Test User Account**
   - Email: `test@noticebazaar.com`
   - Password: `Test123!@#`
   - Auto-confirmed email (no verification needed)

2. **Creator Profile**
   - Role: `creator`
   - Onboarding: Complete (skips onboarding flow)
   - Trial: Activated for 30 days
   - Business details filled in

3. **Sample Brand Deals** (6 deals)
   - Zepto - ₹8,500 (Payment Pending)
   - Nike - ₹20,000 (Payment Pending)
   - Mamaearth - ₹4,254 (Payment Pending)
   - boAt - ₹12,000 (Payment Pending, Overdue)
   - Ajio - ₹14,500 (Payment Pending)
   - Fashion Nova - ₹85,000 (Completed, Payment Received)

## Test Credentials

After running the script, you can log in with:

```
Email: test@noticebazaar.com
Password: Test123!@#
```

## Notes

- The script will **delete and recreate** the test user if it already exists
- All data is created with the test user's ID, so it will appear in their dashboard
- The script uses the service role key to bypass RLS policies
- Brand deals include various statuses (Pending, Completed, Overdue) for testing

## Troubleshooting

### Error: Missing Supabase credentials
- Make sure you've set `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file

### Error: Failed to create profile
- Check that the `profiles` table exists and has the required columns
- Verify your service role key has the correct permissions

### Error: Failed to create brand deals
- Check that the `brand_deals` table exists
- Verify the table structure matches the expected schema

## Resetting Test Data

To reset the test data, simply run the script again:

```bash
npm run seed
```

It will delete the old test user and create a fresh one with new data.

