const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

const batch4 = [
  // Socks / Activewear
  {brand: 'Dynamocks', email: 'collaboration@dynamocks.com', hook: 'your artistic socks are exactly what creator-led fashion collabs need — India\'s first artistic socks brand', niche: 'Socks'},
  {brand: 'Anivé Athleisure', email: 'hello@aniveathleisure.com', hook: 'your premium athleisure with sustainable focus is perfect for fitness creator partnerships', niche: 'Athleisure'},
  {brand: 'Offduty India', email: 'help@offduty.in', hook: 'your contemporary apparel line is ideal for creator showcases and styling content', niche: 'Apparel'},
  // Jewellery
  {brand: 'Womilys', email: 'collabs@womilys.com', hook: 'your premium artificial jewellery is perfect for Instagram Collab campaigns and UGC', niche: 'Jewellery'},
  {brand: 'Nury Nury', email: 'support@nurynury.com', hook: 'your handcrafted semi-precious jewellery is exactly what slow-fashion creators love to feature', niche: 'Handmade Jewellery'},
  {brand: 'Bling Bag', email: 'support@blingbag.co.in', hook: 'your handcrafted fashion jewellery is great for influencer styling content', niche: 'Fashion Jewellery'},
  {brand: 'Pataaka India', email: 'info@pataakashop.com', hook: 'your soul-stirring jewellery designs are perfect for creator storytelling campaigns', niche: 'Jewellery'},
  // Home Decor / Lifestyle
  {brand: 'Miraayaa', email: 'care.miraayaa@gmail.com', hook: 'your Indian art and craftsmanship home decor is perfect for interior creator collabs', niche: 'Home Decor'},
  // Baby / Kids
  {brand: 'Hugs N Snugs', email: 'hugsnsnugsclothing@gmail.com', hook: 'your baby clothing line is perfect for parent influencers and kid creator content', niche: 'Baby Clothing'},
  // Footwear
  {brand: 'Vojos', email: 'info@vojos.in', hook: 'your footwear brand is great for creator unboxing and styling videos', niche: 'Footwear'},
  // Beauty / Skincare
  {brand: 'Tint Cosmetics', email: 'support@tintcosmetics.in', hook: 'your makeup and skincare-infused products are exactly what beauty creators love to review', niche: 'Beauty'},
  {brand: 'Lemmorte', email: 'support@lemmorte.com', hook: 'your dermatologically tested skincare is perfect for skincare routine creator content', niche: 'Skincare'},
  // Fashion
  {brand: 'Cayani', email: 'cayani.work@gmail.com', hook: 'your creative fashion line is great for bold creator collaborations', niche: 'Fashion'}
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

async function sendBatch4() {
  for (const {brand, email, hook, niche} of batch4) {
    try {
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

sendBatch4();
