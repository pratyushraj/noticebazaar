# Create User Account Script

This script allows you to create a user account with a custom email address.

## Quick Usage

### Option 1: Command Line Arguments

```bash
npm run create-user -- --email pratyushraj@outlook.com --password YourPassword123!
```

### Option 2: Environment Variables

```bash
USER_EMAIL=pratyushraj@outlook.com USER_PASSWORD=YourPassword123! npm run create-user
```

### Option 3: With Role and Onboarding Options

```bash
npm run create-user -- --email pratyushraj@outlook.com --password YourPassword123! --role creator --skip-onboarding
```

## Options

- `--email`: Email address for the account (required)
- `--password`: Password for the account (required)
- `--role`: User role - `creator` or `client` (default: `client`)
- `--skip-onboarding`: Skip onboarding flow (default: `false`)

## Environment Variables

You can also set these as environment variables:

- `USER_EMAIL`: Email address
- `USER_PASSWORD`: Password
- `USER_ROLE`: `creator` or `client`
- `SKIP_ONBOARDING`: `true` or `false`

## Requirements

- `VITE_SUPABASE_URL` in `.env` file
- `SUPABASE_SERVICE_ROLE_KEY` in `.env` file

## Examples

### Create a Client Account

```bash
npm run create-user -- --email pratyushraj@outlook.com --password MySecurePass123!
```

### Create a Creator Account (Skip Onboarding)

```bash
npm run create-user -- --email pratyushraj@outlook.com --password MySecurePass123! --role creator --skip-onboarding
```

### Create a Creator Account (With Onboarding)

```bash
npm run create-user -- --email pratyushraj@outlook.com --password MySecurePass123! --role creator
```

## What It Does

1. Checks if a user with the email already exists
2. Deletes the existing user if found (to start fresh)
3. Creates a new user account with the specified email
4. Auto-confirms the email (no email verification needed)
5. Creates/updates the user profile with the specified role
6. Sets up trial period for creator accounts (30 days)
7. Configures onboarding status based on `--skip-onboarding` flag

## After Creation

Once the account is created, you can:
- Log in at `/login` with the email and password
- If `role=creator` and `skip-onboarding=false`, you'll be redirected to `/creator-onboarding`
- If `role=creator` and `skip-onboarding=true`, you'll go directly to `/creator-dashboard`
- If `role=client`, you'll go to `/client-dashboard`

