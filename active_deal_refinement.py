import sys

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'r') as f:
    content = f.read()

# 1. Handle "Empty Brief" and "Guidelines"
content = content.replace(
    '{selectedItem.description || selectedItem.raw?.description || "No description provided."}',
    '{selectedItem.description || selectedItem.raw?.description || "Ensure high-quality lighting, no competitor logos, and a clear product focus in your content."}'
)

# 2. Consolidate Legal/Protection Sections
# Search for Legal Protection / Creator Armour
protection_start = content.find('<div className="mb-8">', content.find('LEGAL PROTECTION'))
protection_end = content.find('</div>', content.find('Full dispute protection & legal mediation')) + 6

# We'll replace it with a more compact merged version later in the flow if needed, 
# but for now let's just make the existing ones more compact.

# 3. Enhance Hero Image blending (in the 'deal' branch)
# The 'deal' hero is around line 5730-5750
hero_marker = "resolveCreatorDealProductImage(selectedItem)"
hero_pos = content.find(hero_marker)
# Find the img tag and add a gradient overlay
img_tag_start = content.find('<img ', hero_pos)
img_tag_end = content.find('/>', img_tag_start) + 2

overlay_html = '<div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent opacity-60" />'
# We need to wrap the img in a relative div if not already
# The img is already in a div with "relative" at 5791 in previous view (wait, indices shifted)

# 4. Compact Timeline
# The timeline code is long, I'll replace the block 6020-6184 with a more compact version.

# 5. Move "Waiting for brand to fund" higher
# This is currently at the bottom in the 'deal' state.

with open('/Users/pratyushraj/Desktop/noticebazaar/src/pages/MobileDashboardDemo.tsx', 'w') as f:
    f.write(content)
