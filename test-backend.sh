#!/bin/bash

# Test Backend API Script
# Tests both local and deployed backend

echo "=========================================="
echo "Testing NoticeBazaar Backend API"
echo "=========================================="
echo ""

# Test Local Backend
echo "1. Testing LOCAL Backend (http://localhost:3001)..."
LOCAL_RESPONSE=$(curl -s -m 5 http://localhost:3001/health 2>&1)

if [ $? -eq 0 ] && echo "$LOCAL_RESPONSE" | grep -q "status"; then
    echo "✅ Local backend is running"
    echo "$LOCAL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOCAL_RESPONSE"
else
    echo "❌ Local backend is not running or not responding"
    echo "   Start it with: cd server && pnpm run dev"
fi

echo ""
echo "----------------------------------------"
echo ""

# Test Deployed Backend
echo "2. Testing DEPLOYED Backend (https://noticebazaar-api.onrender.com)..."
echo "   (Note: Render free tier may take 30-60 seconds to wake up)"
echo ""

DEPLOYED_RESPONSE=$(curl -s -m 60 https://noticebazaar-api.onrender.com/health 2>&1)

if [ $? -eq 0 ] && echo "$DEPLOYED_RESPONSE" | grep -q "status"; then
    echo "✅ Deployed backend is responding"
    echo "$DEPLOYED_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DEPLOYED_RESPONSE"
    
    # Check if Groq is configured
    if echo "$DEPLOYED_RESPONSE" | grep -q '"provider": "groq"'; then
        echo ""
        echo "✅ Groq LLM is configured correctly"
    else
        echo ""
        echo "⚠️  Groq LLM may not be configured - check environment variables"
    fi
else
    echo "❌ Deployed backend is not responding"
    echo "   Possible reasons:"
    echo "   - Service is spinning up (wait 30-60 seconds and try again)"
    echo "   - Service is down (check Render dashboard)"
    echo "   - Network issue"
    echo ""
    echo "   Response: $DEPLOYED_RESPONSE"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="

