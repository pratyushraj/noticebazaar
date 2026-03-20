#!/bin/bash

# Script to add environment variables to Vercel
# Usage: ./add-vercel-envs.sh

# Function to add env to vercel
add_env() {
  local key=$1
  local value=$2
  echo "Adding $key..."
  # Use process substitution or echo -n to pipe the literal value
  echo -n "$value" | vercel env add "$key" production --force
}

echo "🚀 Adding individual Environment Variables to Vercel (Production)..."

# Adding variables one by one with proper quoting for the shell
add_env "VITE_SUPABASE_URL" "${VITE_SUPABASE_URL}"
add_env "VITE_SUPABASE_ANON_KEY" "${VITE_SUPABASE_ANON_KEY}"
add_env "VITE_RAZORPAY_KEY_ID" "${VITE_RAZORPAY_KEY_ID}"
add_env "RAZORPAY_KEY_SECRET" "${RAZORPAY_KEY_SECRET}"
add_env "SUPABASE_URL" "${SUPABASE_URL}"
add_env "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_ROLE_KEY}"
add_env "VITE_SUPABASE_SERVICE_ROLE_KEY" "${VITE_SUPABASE_SERVICE_ROLE_KEY}"
add_env "USE_AI_CONTRACT_ANALYSIS" "${USE_AI_CONTRACT_ANALYSIS}"
add_env "LLM_PROVIDER" "${LLM_PROVIDER}"
add_env "LLM_API_KEY" "${LLM_API_KEY}"
add_env "LLM_MODEL" "${LLM_MODEL}"
add_env "LEEGALITY_AUTH_TOKEN" "${LEEGALITY_AUTH_TOKEN}"
add_env "LEEGALITY_PRIVATE_SALT" "${LEEGALITY_PRIVATE_SALT}"
add_env "LEEGALITY_WEBHOOK_SECRET" "${LEEGALITY_WEBHOOK_SECRET}"
add_env "LEEGALITY_BASE_URL" "${LEEGALITY_BASE_URL}"
add_env "MEON_BASE_URL" "${MEON_BASE_URL}"
add_env "MEON_USERNAME" "${MEON_USERNAME}"
add_env "MEON_CLIENT_SECRET_KEY" "${MEON_CLIENT_SECRET_KEY}"
add_env "MEON_WEBHOOK_SECRET" "${MEON_WEBHOOK_SECRET}"
add_env "FAST2SMS_API_KEY" "${FAST2SMS_API_KEY}"
add_env "RESEND_API_KEY" "${RESEND_API_KEY}"
add_env "ALLOW_DEMO_EMAIL" "${ALLOW_DEMO_EMAIL}"
add_env "GSTINCHECK_API_KEY" "${GSTINCHECK_API_KEY}"
add_env "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" "${PUPPETEER_SKIP_CHROMIUM_DOWNLOAD}"
add_env "NODE_ENV" "${NODE_ENV}"

echo ""
echo "✅ All environment variables processed!"
echo "⚠️  Note: Variables already existing on Vercel won't be modified unless you use '--force'."
