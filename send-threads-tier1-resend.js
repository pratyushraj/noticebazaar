const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

const threadsGoldmineTier1 = [
  {brand: 'Dot & Key', email: 'divas@dotandkey.com', hook: 'your innovative beauty products are exactly what Indian creators are excited about', niche: 'Beauty'},
  {brand: 'Reena Esmetics', email: 'hi@reneecosmetics.in', hook: 'your clean beauty line has such a strong following', niche: 'Beauty'},
  {brand: 'Balya', email: 'partnerships@balya.in', hook: 'your Ayurveda wellness products are perfect for holistic creator content', niche: 'Ayurveda'},
  {brand: "De'Belle Cosmetix", email: 'pr@debellecosmetix.com', hook: 'your cosmetics brand is popular among creators — love the vibe', niche: 'Beauty'},
  {brand: 'Mother Sparsh', email: 'care@mothersparsh.com', hook: 'your baby care products are trusted by parents — great for mom/dad creators', niche: 'Baby Care'},
  {brand: "La'Girl India", email: 'academy@lagirlindia.com', hook: 'your beauty academy and products are perfect for makeup artist collabs', niche: 'Beauty'}
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

async function sendThreadsTier1() {
  for (const {brand, email, hook, niche} of threadsGoldmineTier1) {
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

sendThreadsTier1();
