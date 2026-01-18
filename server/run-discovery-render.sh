#!/bin/bash
# Run influencer discovery on Render
# Usage: ./run-discovery-render.sh [AUTH_TOKEN]

RENDER_API_URL="${RENDER_API_URL:-https://noticebazaar-api.onrender.com}"
AUTH_TOKEN="${1:-${TEST_AUTH_TOKEN}}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Error: Auth token required"
  echo ""
  echo "Usage:"
  echo "  ./run-discovery-render.sh YOUR_JWT_TOKEN"
  echo ""
  echo "Or set TEST_AUTH_TOKEN environment variable:"
  echo "  export TEST_AUTH_TOKEN=your-jwt-token"
  echo "  ./run-discovery-render.sh"
  echo ""
  echo "To get a JWT token:"
  echo "  1. Go to Supabase Dashboard → Authentication → Users"
  echo "  2. Create a test user or use existing"
  echo "  3. Copy the JWT token from the user's session"
  exit 1
fi

echo "🚀 Running Influencer Discovery on Render..."
echo "📍 API URL: $RENDER_API_URL"
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST \
  "${RENDER_API_URL}/api/influencers/run-daily-scan" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo "✅ Discovery completed successfully!"
  echo ""
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo "❌ Discovery failed (HTTP $http_code)"
  echo ""
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  exit 1
fi

