#!/bin/bash
# NoticeBazaar API Deployment Script
# Deploys the API server to Vercel

set -e

echo "🚀 Deploying NoticeBazaar API Server..."
echo ""

# Check if we're in the server directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Error: Please run this script from the server/ directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "✅ Vercel CLI found"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel. Please login:"
    vercel login
fi

echo "✅ Logged in to Vercel"
echo ""

# Check environment variables
echo "📋 Checking environment variables..."
echo ""
echo "Required variables:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - FRONTEND_URL (optional, defaults to https://noticebazaar.com)"
echo ""

read -p "Have you set these in Vercel Dashboard? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please set environment variables in Vercel Dashboard first:"
    echo "   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
    echo "   2. Add: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL"
    echo "   3. Then run this script again"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""

vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Go to Vercel Dashboard → Project → Settings → Domains"
echo "   2. Add custom domain: api.noticebazaar.com"
echo "   3. Add the DNS record Vercel provides"
echo "   4. Wait for DNS propagation (5-10 minutes)"
echo "   5. Test: curl https://api.noticebazaar.com/health"
echo ""

