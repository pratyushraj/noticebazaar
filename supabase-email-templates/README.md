# CreatorArmour Supabase Email Templates

Branded email templates for Supabase Authentication that match CreatorArmour's professional, trust-building style.

## 📧 Templates Included

1. **Confirm Signup Email** (`confirm-signup.html`)
   - Subject: "Confirm your CreatorArmour account"
   - Used when users sign up and need to verify their email

2. **Magic Link Email** (`magic-link.html`)
   - Subject: "Login to CreatorArmour securely"
   - Used for passwordless login via magic link

3. **Reset Password Email** (`reset-password.html`)
   - Subject: "Reset your CreatorArmour password"
   - Used when users request a password reset

4. **Invite User Email** (`invite-user.html`)
   - Subject: "You've been invited to CreatorArmour"
   - Used when inviting users to a workspace

## 🎨 Design Features

- **Purple gradient theme** matching CreatorArmour brand (#7A2FF4 to #3E1E91)
- **Mobile-responsive** layout with proper viewport handling
- **Professional tone** - trust-building, not threatening
- **Clear CTAs** with prominent buttons
- **Reassuring footers** with security messaging
- **No Supabase branding** - fully branded as CreatorArmour

## 📋 How to Apply

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your CreatorArmour project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Each Template

#### Confirm Signup Email
1. Click on **"Confirm signup"** template
2. Copy the contents of `confirm-signup.html`
3. Paste into the HTML editor
4. Set subject line: `Confirm your CreatorArmour account`
5. Save

#### Magic Link Email
1. Click on **"Magic Link"** template (if enabled)
2. Copy the contents of `magic-link.html`
3. Paste into the HTML editor
4. Set subject line: `Login to CreatorArmour securely`
5. Save

#### Reset Password Email
1. Click on **"Reset password"** template
2. Copy the contents of `reset-password.html`
3. Paste into the HTML editor
4. Set subject line: `Reset your CreatorArmour password`
5. Save

#### Invite User Email
1. Click on **"Invite user"** template
2. Copy the contents of `invite-user.html`
3. Paste into the HTML editor
4. Set subject line: `You've been invited to CreatorArmour`
5. Save

## ✅ Important Notes

### Supabase Variables
These templates use Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The confirmation/reset/invite link
- Other variables are automatically handled by Supabase

### Testing
After applying templates:
1. Test each email type in a development environment
2. Verify links work correctly
3. Check mobile rendering on iPhone/Android
4. Ensure all text is readable and CTAs are clickable

### Customization
To customize further:
- Colors: Update the gradient colors in the header and button
- Fonts: Modify the `font-family` in the body style
- Spacing: Adjust padding values in the table cells
- Content: Edit the headline, body text, and footer as needed

## 🔒 Security Considerations

- All templates include security messaging
- Links expire automatically (handled by Supabase)
- No sensitive information is displayed
- Clear instructions for users who didn't request the email

## 📱 Mobile Compatibility

All templates are:
- Responsive with proper viewport meta tags
- Tested for email client compatibility
- Using table-based layouts (required for email)
- Inline CSS (required for email clients)

## 🎯 Brand Alignment

These templates align with CreatorArmour's brand:
- Professional legal-tech platform tone
- Trust-building language
- No fear-based messaging
- Clear, actionable CTAs
- Consistent purple gradient theme


