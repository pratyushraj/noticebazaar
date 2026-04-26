#!/bin/bash

# CreatorArmour Vercel Deployment Script
# This script helps deploy the frontend to Vercel

set -e

echo "🚀 CreatorArmour Vercel Deployment"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "   Install it with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "   Running: vercel login"
    vercel login
fi

echo "✅ Logged in to Vercel"
echo ""

# Check for environment variables
echo "📋 Checking environment variables..."
echo ""

if [ -f ".env" ]; then
    echo "✅ Found .env file"
    echo ""
    echo "⚠️  IMPORTANT: Make sure to add these environment variables in Vercel Dashboard:"
    echo ""
    echo "   VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY"
    echo "   VITE_API_BASE_URL"
    echo "   NODE_ENV=production"
    echo ""
    echo "   Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
    echo ""
    read -p "Press Enter to continue with deployment..."
else
    echo "⚠️  No .env file found. Make sure to set environment variables in Vercel Dashboard."
    echo ""
fi

# Deploy to production
echo ""
echo "🚀 Deploying to Vercel (Production)..."
echo ""

vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "   2. Add all required environment variables"
echo "   3. Redeploy if needed"
echo "   4. Add custom domain (optional)"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed instructions"
echo ""

