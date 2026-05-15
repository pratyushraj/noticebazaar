const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

// Only verified Indian brands
const indianBatch = [
  // Batch 3 — Confirmed Indian
  {brand: 'Poshaak', email: 'support@wearposhaak.com', hook: 'your minimalist fashion pieces are exactly what modern Indian consumers want', niche: 'Fashion'},
  {brand: 'SareesBazaar', email: 'sareesbazaar.socialmedia@gmail.com', hook: 'your ethnic collection is beautiful — love the traditional craftsmanship', niche: 'Ethnic Fashion'},
  {brand: 'Plum Goodness', email: 'hello@plumgoodness.com', hook: 'your skincare philosophy is so aligned with clean beauty trends', niche: 'Skincare'},
  {brand: 'India Botanicals', email: 'support@indiabotanicals.com', hook: 'your clean skincare approach using Indian botanicals is fantastic', niche: 'Beauty'},
  {brand: 'SVARASYA', email: 'contact@svarasya.com', hook: 'your Ayurveda-based skincare line is impressive', niche: 'Ayurvedic Skincare'},
  {brand: 'Shivya Ayurveda', email: 'info@shivyaayurveda.com', hook: 'your wellness products stand out in the Ayurveda space', niche: 'Ayurveda'},
  {brand: 'My Organics', email: 'info@myorganics.co.in', hook: 'your organic beauty products are exactly what conscious consumers seek', niche: 'Organic Beauty'},
  {brand: 'Dineshbhai Patolawala', email: 'dineshbhaipatolawala@gmail.com', hook: 'your ethnic wear and saree collection is exquisite', niche: 'Ethnic Fashion'},
  {brand: 'Kalavaasi', email: 'kalavaasi@gmail.com', hook: 'your streetwear designs are cool — great for influencer showcases', niche: 'Streetwear'},
  {brand: 'Bingette Beauty', email: '+91 8446591917', hook: 'your beauty services in Pune could be great for local creator collaborations', niche: 'Beauty Services'},

  // Threads Goldmine — All confirmed Indian D2C
  {brand: 'Dot & Key', email: 'divas@dotandkey.com', hook: 'your innovative beauty products are exactly what Indian creators are excited about', niche: 'Beauty'},
  {brand: 'Reena Esmetics', email: 'hi@reneecosmetics.in', hook: 'your clean beauty line has such a strong following', niche: 'Beauty'},
  {brand: 'Balya', email: 'partnerships@balya.in', hook: 'your Ayurveda wellness products are perfect for holistic creator content', niche: 'Ayurveda'},
  {brand: "De'Belle Cosmetix", email: 'pr@debellecosmetix.com', hook: 'your cosmetics brand is popular among creators — love the vibe', niche: 'Beauty'},
  {brand: 'Mother Sparsh', email: 'care@mothersparsh.com', hook: 'your baby care products are trusted by parents — great for mom/dad creators', niche: 'Baby Care'},
  {brand: "La'Girl India", email: 'academy@lagirlindia.com', hook: 'your beauty academy and products are perfect for makeup artist collabs', niche: 'Beauty'},
  {brand: 'Swiss Beauty', email: 'support@swissbeauty.in', hook: 'your cosmetics are a favorite among Indian makeup artists', niche: 'Beauty'},
  {brand: 'Flicka Cosmetics', email: 'pr@flickacosmetics.com', hook: 'your vibrant colors are perfect for creator Reels and tutorials', niche: 'Beauty'},
  {brand: 'SugarPop', email: 'collabs@sugarpop.in', hook: 'your fun beauty products are great for trending creator content', niche: 'Beauty'},
  {brand: 'MCaffeine', email: 'woot@mcaffeine.com', hook: 'your caffeine-based wellness products are innovative — perfect for fitness creators', niche: 'Wellness'},
  {brand: 'Honasa (Mamaearth)', email: 'rakhi.s@honasa.in', hook: 'your trusted baby and personal care brand is ideal for parent creator partnerships', niche: 'Baby/Personal Care'}
];

const subject = `Partnership opportunity from Creator Armour — India's creator collaboration network`;

const body = (brand, hook) => `Hi ${brand} team,

I'm Pratyush, founder of Creator Armour — we're building India's first creator collaboration network that connects brands like yours with vetted creators for high-ROI influencer partnerships.

We've helped brands scale through creator-led campaigns, and ${hook}. That's why I'm reaching out.

**What we offer:**
- Access to 5,000+ Indian creators across micro to mid-tier
- Performance-based campaigns (sales, leads, brand awareness)
- End-to-end campaign management — from briefing to payout
- Transparent pricing, no retainers, no lock-ins

If you're exploring influencer partnerships this quarter, I'd love to schedule a 15-min intro call to see if there's a fit.

You can reply here or grab a slot on my calendar: https://calendly.com/creatorarmour/intro

Best,
Pratyush
Founder, Creator Armour
📞 +91 XXXXXXXXXX
🌐 creatorarmour.com`;

async function sendIndianBatch() {
  for (const {brand, email, hook, niche} of indianBatch) {
    try {
      // Skip Bingette (phone only)
      if (email.startsWith('+91')) {
        console.log(`⏭️  ${brand} — phone-only (${email}), skipping Resend`);
        continue;
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [email],
          subject: subject,
          text: body(brand, hook),
          reply_to: 'outreach@creatorarmour.com'
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✅ ${brand} → ${email} | ID: ${data.id}`);
      } else {
        console.error(`❌ ${brand} → ${email} | Status: ${res.status}`, data);
      }
    } catch (err) {
      console.error(`❌ ${brand} → ${email} | Exception:`, err.message);
    }

    await new Promise(r => setTimeout(r, 1100));
  }
}

sendIndianBatch();
