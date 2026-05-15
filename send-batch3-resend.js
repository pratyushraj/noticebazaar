const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

const batch3 = [
  {brand: 'Poshaak', email: 'support@wearposhaak.com', hook: 'your minimalist fashion pieces are exactly what modern Indian consumers want', niche: 'Fashion'},
  {brand: 'SareesBazaar', email: 'sareesbazaar.socialmedia@gmail.com', hook: 'your ethnic collection is beautiful — love the traditional craftsmanship', niche: 'Ethnic Fashion'},
  {brand: 'Plum Goodness', email: 'hello@plumgoodness.com', hook: 'your skincare philosophy is so aligned with clean beauty trends', niche: 'Skincare'},
  {brand: 'India Botanicals', email: 'support@indiabotanicals.com', hook: 'your clean skincare approach using Indian botanicals is fantastic', niche: 'Beauty'},
  {brand: 'SVARASYA', email: 'contact@svarasya.com', hook: 'your Ayurveda-based skincare line is impressive', niche: 'Ayurvedic Skincare'},
  {brand: 'Shivya Ayurveda', email: 'info@shivyaayurveda.com', hook: 'your wellness products stand out in the Ayurveda space', niche: 'Ayurveda'},
  {brand: 'Scarlett Cosmetics', email: 'info@scarlettcosmetic.com', hook: 'your cosmetics brand has great potential for creator collabs', niche: 'Beauty'},
  {brand: 'My Organics', email: 'info@myorganics.co.in', hook: 'your organic beauty products are exactly what conscious consumers seek', niche: 'Organic Beauty'},
  {brand: 'Dolce Bambino Co', email: 'collaborate@dolcebambino.co', hook: 'your home decor designs are stunning — love the aesthetic', niche: 'Home Decor'},
  {brand: 'The Deco Story', email: 'info@thedecostory.com', hook: 'your stationery and home decor products are so curated', niche: 'Stationery'},
  {brand: 'myPAPERCLIP India', email: 'sales@paperclipstore.in', hook: 'your planners and organizers are exactly what organized creators love', niche: 'Stationery'},
  {brand: 'PaperMint', email: 'info@thepapermint.in', hook: 'your personalized stationery is beautiful — great for gifting collabs', niche: 'Personalized Stationery'},
  {brand: 'Pearl of Wax', email: 'help@pearlofwax.com', hook: 'your luxury candles would make for amazing unboxing content', niche: 'Home Fragrance'},
  {brand: 'Amour by Anjali', email: 'amourbyanjali@gmail.com', hook: 'your candle and gifting products are so elegant', niche: 'Candles'},
  {brand: 'Dineshbhai Patolawala', email: 'dineshbhaipatolawala@gmail.com', hook: 'your ethnic wear and saree collection is exquisite', niche: 'Ethnic Fashion'},
  {brand: 'Kalavaasi', email: 'kalavaasi@gmail.com', hook: 'your streetwear designs are cool — great for influencer showcases', niche: 'Streetwear'},
  {brand: 'Skevoxe', email: 'hello@skevoxe.com', hook: 'your vegan sneakers are innovative — sustainability + style is a winning combo', niche: 'Vegan Footwear'},
  {brand: 'Lazy Bums', email: 'hello@lazybumsapparel.com', hook: 'your socks and apparel line is fun and comfortable — perfect for creator content', niche: 'Apparel'},
  {brand: 'Bingette Beauty', email: '+91 8446591917', hook: 'your beauty services in Pune could be great for local creator collaborations', niche: 'Beauty Services'}
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

async function sendBatch3() {
  for (const {brand, email, hook, niche} of batch3) {
    try {
      // Skip Bingette (phone only) for now
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

    // Throttle to stay under 5/sec limit
    await new Promise(r => setTimeout(r, 1100));
  }
}

sendBatch3();
