#!/bin/bash

# Blog Autopilot Script
# Generates 1 blog post daily for CreatorArmour.com
# Usage: ./blog-autopilot.sh [date in YYYY-MM-DD format]

set -e

# Configuration
BLOGS_DIR="/Users/pratyushraj/.openclaw/workspace/blogs"
GENERATED_DIR="$BLOGS_DIR/generated"
DAILY_DIR="$BLOGS_DIR/daily"
API_KEY="fw_6JTfSFsy2jrYA25dN6JLfd"
API_URL="https://api.fireworks.ai/inference/v1/chat/completions"
MODEL="accounts/fireworks/models/gpt-oss-120b"

# Date handling
if [ -z "$1" ]; then
    TARGET_DATE=$(date +%Y-%m-%d)
else
    TARGET_DATE="$1"
fi

echo "🔧 Blog Autopilot - Generating blog for $TARGET_DATE"

# Create directories if they don't exist
mkdir -p "$GENERATED_DIR" "$DAILY_DIR"

# Determine topic based on date
# Simple mapping: Monday=Business, Tuesday=Legal, Wednesday=Business, Thursday=Legal, Friday=Analysis
DAY_OF_WEEK=$(date -j -f "%Y-%m-%d" "$TARGET_DATE" +%u)

case $DAY_OF_WEEK in
    1) # Monday
        TITLE="How to Pitch Brands Without a Media Kit"
        KEYWORDS="pitch without media kit, cold email brands, creator pitching, brand outreach"
        CATEGORY="Business"
        SLUG="how-to-pitch-brands-without-media-kit"
        ;;
    2) # Tuesday
        TITLE="5 Legal Clauses Every Creator Contract Must Have"
        KEYWORDS="contract clauses, creator legal rights, influencer contract terms, legal protection"
        CATEGORY="Legal"
        SLUG="5-legal-clauses-every-creator-contract-must-have"
        ;;
    3) # Wednesday
        TITLE="From 0 to First Brand Deal: A 30-Day Action Plan"
        KEYWORDS="first brand deal action plan, creator monetization roadmap, 30-day plan, brand deal strategy"
        CATEGORY="Business"
        SLUG="from-0-to-first-brand-deal-30-day-action-plan"
        ;;
    4) # Thursday
        TITLE="How to Calculate Your Worth as a Creator"
        KEYWORDS="creator worth calculation, influencer pricing, brand deal rates, creator valuation"
        CATEGORY="Business"
        SLUG="how-to-calculate-your-worth-as-creator"
        ;;
    5) # Friday
        TITLE="The Red Flags of Brand Collaboration Emails"
        KEYWORDS="brand collaboration red flags, email warning signs, creator safety, scam detection"
        CATEGORY="Legal"
        SLUG="red-flags-brand-collaboration-emails"
        ;;
    6) # Saturday
        echo "📅 Saturday - No blog scheduled (weekend)"
        exit 0
        ;;
    7) # Sunday
        echo "📅 Sunday - No blog scheduled (weekend)"
        exit 0
        ;;
esac

OUTPUT_FILE="$GENERATED_DIR/${TARGET_DATE}-${SLUG}.md"

# Check if file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "📄 Blog already exists: $OUTPUT_FILE"
    echo "📊 Word count: $(wc -w < "$OUTPUT_FILE") words"
    exit 0
fi

# Create the prompt
PROMPT=$(cat <<EOF
Write a comprehensive blog post for CreatorArmour.com with the following requirements:

TITLE: $TITLE
CATEGORY: $CATEGORY  
KEYWORDS: $KEYWORDS
TARGET AUDIENCE: Indian creators, influencers, content creators seeking brand deals
TONE: Professional, helpful, actionable, empowering
LENGTH: 1000-1500 words
FORMAT: Markdown with proper headings

STRUCTURE:
1. Frontmatter (YAML format with date, title, category, keywords, read_time)
2. Introduction (hook, problem statement, value proposition)
3. Main content (3-5 sections with actionable advice)
4. Practical examples/case studies (Indian creator context)
5. Step-by-step actionable checklist
6. Conclusion with key takeaways
7. Call-to-action (related to CreatorArmour platform)

SPECIAL REQUIREMENTS:
- Include Indian creator examples where relevant
- Reference existing CreatorArmour blog posts if applicable
- Add "Read time: X min" at top
- Include internal links suggestions in [brackets]
- End with "What's your experience with this? Share in comments!"

Write the complete blog post in markdown format starting with frontmatter.
EOF
)

echo "📝 Generating blog: $TITLE"
echo "📁 Output: $OUTPUT_FILE"
echo "🏷️ Category: $CATEGORY"
echo "🔑 Keywords: $KEYWORDS"

# Make API call (fixed quoting using jq)
SYSTEM_MSG="You are a professional content writer for CreatorArmour.com, a platform helping Indian creators secure brand deals. Write engaging, actionable, SEO-optimized blog posts."
# Build JSON payload safely
JSON_PAYLOAD=$(jq -n \
  --arg model "$MODEL" \
  --arg system "$SYSTEM_MSG" \
  --arg user "$PROMPT" \
  '{model:$model, messages:[{role:"system", content:$system}, {role:"user", content:$user}], temperature:0.7, max_tokens:4000}')
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# Extract content from response
CONTENT=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'choices' in data and len(data['choices']) > 0:
        print(data['choices'][0]['message']['content'])
    else:
        print('Error: ' + json.dumps(data.get('error', 'Unknown error'), indent=2))
        sys.exit(1)
except Exception as e:
    print(f'Parse error: {e}')
    sys.exit(1)
")

if [ $? -ne 0 ]; then
    echo "❌ API call failed"
    echo "$CONTENT"
    exit 1
fi

# Add frontmatter if not present
if ! echo "$CONTENT" | grep -q "---"; then
    FRONTMATTER="---
title: \"$TITLE\"
date: $TARGET_DATE
category: $CATEGORY
keywords: $KEYWORDS
read_time: 5 min
slug: $SLUG
---"
    CONTENT="$FRONTMATTER

$CONTENT"
fi

# Save to file
echo "$CONTENT" > "$OUTPUT_FILE"

# Stats
WORD_COUNT=$(echo "$CONTENT" | wc -w)
CHAR_COUNT=$(echo "$CONTENT" | wc -c)

echo "✅ Blog generated successfully!"
echo "📊 Stats: $WORD_COUNT words, $CHAR_COUNT characters"
echo "📁 Saved to: $OUTPUT_FILE"

# Create symbolic link in daily directory
ln -sf "$OUTPUT_FILE" "$DAILY_DIR/${TARGET_DATE}.md"

echo "🔗 Linked to: $DAILY_DIR/${TARGET_DATE}.md"

# Update content calendar status
echo "📅 Update CONTENT-CALENDAR.md status for $TARGET_DATE"
echo "   [x] $TITLE generated (pending review)"

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Review the blog: cat $OUTPUT_FILE"
echo "2. Edit if needed"
echo "3. Publish to CreatorArmour.com"
echo "4. Add to SEO autopilot monitoring"