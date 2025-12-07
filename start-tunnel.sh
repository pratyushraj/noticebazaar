#!/bin/bash

# Start cloudflared tunnel for local API testing

echo "🌐 Starting cloudflared tunnel..."
echo "📡 This will expose your local API (localhost:3001) to the internet"
echo ""
echo "⚠️  Make sure your API server is running on port 3001 first!"
echo ""

# Start tunnel and capture the URL
cloudflared tunnel --url http://localhost:3001 2>&1 | while IFS= read -r line; do
  echo "$line"
  
  # Extract tunnel URL from output
  if [[ $line == *"https://"*".trycloudflare.com"* ]]; then
    TUNNEL_URL=$(echo "$line" | grep -o 'https://[^ ]*\.trycloudflare\.com' | head -1)
    if [ ! -z "$TUNNEL_URL" ]; then
      echo ""
      echo "✅ Tunnel URL: $TUNNEL_URL"
      echo ""
      echo "📋 Next steps:"
      echo "1. Copy this URL: $TUNNEL_URL"
      echo "2. On noticebazaar.com, open browser console (F12)"
      echo "3. Run: localStorage.setItem('tunnelUrl', '$TUNNEL_URL');"
      echo "4. Run: localStorage.setItem('useLocalApi', 'true');"
      echo "5. Refresh the page and test!"
      echo ""
      echo "Or use this URL directly:"
      echo "https://noticebazaar.com/upload?localApi=true&tunnelUrl=$TUNNEL_URL"
      echo ""
    fi
  fi
done

