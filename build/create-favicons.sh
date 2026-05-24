#!/bin/bash
# Script to create favicon files from logo image
# Usage: ./create-favicons.sh logo.png

if [ -z "$1" ]; then
    echo "Usage: ./create-favicons.sh <logo-image-file>"
    echo "Example: ./create-favicons.sh logo.png"
    exit 1
fi

LOGO_FILE="$1"

if [ ! -f "$LOGO_FILE" ]; then
    echo "Error: Logo file '$LOGO_FILE' not found!"
    exit 1
fi

echo "Creating favicon files from $LOGO_FILE..."

# Create different sizes using sips (macOS built-in tool)
sips -z 16 16 "$LOGO_FILE" --out favicon-16x16.png
sips -z 32 32 "$LOGO_FILE" --out favicon-32x32.png
sips -z 180 180 "$LOGO_FILE" --out apple-touch-icon.png
sips -z 192 192 "$LOGO_FILE" --out icon-192x192.png
sips -z 512 512 "$LOGO_FILE" --out icon-512x512.png

# Create favicon.ico from 32x32 (using sips to create PNG, then we'll note it needs conversion)
sips -z 32 32 "$LOGO_FILE" --out favicon-32-temp.png

echo ""
echo "✅ Created favicon files:"
echo "  - favicon-16x16.png"
echo "  - favicon-32x32.png"
echo "  - apple-touch-icon.png"
echo "  - icon-192x192.png"
echo "  - icon-512x512.png"
echo ""
echo "⚠️  Note: favicon.ico needs to be created separately."
echo "   You can:"
echo "   1. Use https://favicon.io/favicon-converter/ to convert favicon-32x32.png to .ico"
echo "   2. Or use: convert favicon-32x32.png favicon.ico (if ImageMagick is installed)"
echo ""
echo "For now, copying favicon-32x32.png as favicon.ico (browsers will accept PNG as .ico)..."
cp favicon-32x32.png favicon.ico

echo ""
echo "✅ All favicon files created!"
echo "   Refresh your browser (Cmd+Shift+R) to see the new favicon."

