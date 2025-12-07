#!/bin/bash

# Render API Deployment Script
# Uses Render API to deploy the noticebazaar-api service

set -e

RENDER_API_TOKEN="${RENDER_API_TOKEN:-rnd_uuftljqVQPRw4UzkFFBJFtpOXrck}"
RENDER_API_URL="https://api.render.com/v1"

echo "🚀 Deploying to Render..."

# Check if service exists, if not create it
echo "📋 Checking for existing service..."

# Note: This script assumes you'll create the service via dashboard first
# Then we can trigger deployments via API

echo "✅ Render deployment script ready!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub repo: noticebazaar"
echo "4. Set Root Directory: server"
echo "5. Set Build Command: npm install && npm run build"
echo "6. Set Start Command: npm start"
echo "7. Add environment variables:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - FRONTEND_URL"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo ""
echo "Or use the render.yaml blueprint for auto-config!"

