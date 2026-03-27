# Email Signup Troubleshooting Guide

## Issue: "Check your email for the confirmation link" but can't complete signup

This message appears when Supabase requires email confirmation before users can sign in. Here's how to fix it:

## Solution 1: Disable Email Confirmation (Development/Testing)

If you're in development or want to allow immediate signup without email confirmation:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll down to **Email Auth**
4. Find **"Enable email confirmations"**
5. **Toggle it OFF** to disable email confirmation
6. Save changes

**Note:** This allows users to sign up and immediately sign in without email confirmation. Use this for development or if you don't need email verification.

## Solution 2: Configure Email Settings (Production)

If you want to keep email confirmation enabled but fix email delivery:

### A. Check Email Provider Configuration

1. Go to Supabase Dashboard > **Settings** > **Auth**
2. Check **SMTP Settings**:
   - Ensure SMTP is configured (or use Supabase's default email service)
   - Verify the "From" email address is set correctly
   - Check that email sending is enabled

### B. Check Spam/Junk Folder

- Ask users to check their spam/junk folder
- The confirmation email might be filtered

### C. Verify Email Templates

1. Go to **Authentication** > **Email Templates**
2. Check that the "Confirm signup" template is active
3. Verify the confirmation link URL is correct:
   ```
   {{ .ConfirmationURL }}
   ```

### D. Test Email Delivery

1. Go to **Authentication** > **Users**
2. Try signing up with a test email
3. Check Supabase logs for email sending errors:
   - Go to **Logs** > **Auth Logs**
   - Look for email-related errors

## Solution 3: Use Magic Link Instead

Magic links allow users to sign in via email without passwords:

1. The `magicLink={true}` prop is already enabled in the Signup component
2. Users can click "Sign in with magic link" instead of creating a password
3. They'll receive an email with a one-time sign-in link

## Solution 4: Add Better User Feedback

The current implementation shows "Check your email for the confirmation link" message. To improve UX:

1. Add a resend confirmation email button
2. Show a countdown timer
3. Provide alternative sign-in methods (OAuth)
4. Add a "Didn't receive email?" help section

## Common Issues

### Issue: Emails not being sent
- **Check:** Supabase project email sending limits (free tier has limits)
- **Check:** SMTP configuration if using custom SMTP
- **Check:** Email domain reputation

### Issue: Confirmation link not working
- **Check:** Redirect URLs in Supabase Dashboard > Authentication > URL Configuration
- **Check:** The confirmation link format matches your site URL
- **Check:** CORS settings if using custom domain

### Issue: User can't sign in after confirmation
- **Check:** User's email is confirmed in Supabase Dashboard > Authentication > Users
- **Check:** Session is being created properly
- **Check:** Redirect URL after confirmation

## Quick Fix for Development

To quickly test signup without email confirmation:

1. **Disable email confirmation** in Supabase Dashboard (Solution 1)
2. **Or** manually confirm users in Supabase Dashboard:
   - Go to **Authentication** > **Users**
   - Find the user
   - Click **"Confirm email"** button

## Production Recommendations

For production:
1. Keep email confirmation enabled for security
2. Configure proper SMTP settings
3. Use a verified email domain
4. Monitor email delivery rates
5. Provide clear instructions to users about checking spam folders
6. Add a "Resend confirmation email" feature

