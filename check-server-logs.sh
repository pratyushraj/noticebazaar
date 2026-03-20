#!/bin/bash
# Script to check server status and test the sign-creator route

echo "=== Server Status Check ==="
echo ""

# Check if server is running
echo "1. Checking if server is running on port 3001..."
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
    echo "   PID: $(lsof -ti:3001)"
else
    echo "❌ Server is NOT running on port 3001"
    echo "   Run: cd server && npm run dev"
    exit 1
fi

echo ""
echo "2. Testing server health endpoint..."
curl -s http://localhost:3001/health | jq '.' 2>/dev/null || curl -s http://localhost:3001/health

echo ""
echo ""
echo "3. Testing sign-creator route (will show auth error, but confirms route exists)..."
echo "   Making request to: POST /api/deals/f57086bd-d53c-4223-a370-923bc85181b9/sign-creator"
curl -s -X POST "http://localhost:3001/api/deals/f57086bd-d53c-4223-a370-923bc85181b9/sign-creator" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" | jq '.' 2>/dev/null || \
curl -s -X POST "http://localhost:3001/api/deals/f57086bd-d53c-4223-a370-923bc85181b9/sign-creator" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"

echo ""
echo ""
echo "=== Next Steps ==="
echo "1. Check the terminal where 'npm run dev' is running for server logs"
echo "2. When you try to sign, look for logs starting with '[Deals] sign-creator'"
echo "3. Share those logs to debug the 'Deal not found' issue"

