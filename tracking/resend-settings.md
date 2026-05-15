# CRITICAL SETTINGS — Creator Armour Resend
# ALWAYS include these in every Resend API call

RESEND_FROM="outreach@creatorarmour.com"
RESEND_REPLY_TO="creatorarmour07@gmail.com"

# ⚠️ 17 emails sent on 2026-05-13 WITHOUT reply_to
# Damage: replies land at outreach@creatorarmour.com (may not be monitored)
# Fix: set up email forwarding from outreach@creatorarmour.com → creatorarmour07@gmail.com IMMEDIATELY

# Future API call template:
# curl -X POST https://api.resend.com/emails \
#   -H "Authorization: Bearer $RESEND_API_KEY" \
#   -H "Content-Type: application/json" \
#   -d '{"from":"outreach@creatorarmour.com","reply_to":"creatorarmour07@gmail.com","to":["..."],"subject":"...","html":"..."}'