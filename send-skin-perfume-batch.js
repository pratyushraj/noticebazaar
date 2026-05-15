const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

const batch = [
  {
    brand: 'GlowBareSkin',
    email: 'info@glowbareskin.com',
    hook: 'your science-backed, Indian-skin-focused skincare line is exactly what creator-led beauty campaigns need',
    niche: 'Skincare'
  },
  {
    brand: 'Conscious Chemist',
    email: 'hello@consciouschemist.com',
    hook: 'your result-first, actives-driven skincare has already caught the Shark Tank spotlight — perfect timing to supercharge growth with creator collabs',
    niche: 'Science Skincare'
  },
  {
    brand: 'Deconstruct',
    email: 'wecare@thedeconstruct.in',
    hook: 'your gentle, science-backed formulations already resonate hard with skincare creators — we can amplify that with a structured creator network',
    niche: 'Skincare'
  },
  {
    brand: 'Nirmalaya',
    email: 'hello@nirmalaya.com',
    hook: 'your zero-waste, floral-source fragrance and wellness brand has such a powerful sustainability story — creators will love telling it',
    niche: 'Fragrance / Wellness'
  },
  {
    brand: 'Nayeem Perfumes',
    email: 'nayeemmercantile@gmail.com',
    hook: 'your East-meets-West unisex fragrances are beautifully positioned for lifestyle and fragrance connoisseur creators',
    niche: 'Perfumes'
  },
  {
    brand: 'Blue Honey',
    email: 'info@bluehoney.store',
    hook: 'your handcrafted soy candles and fragrance line made by three sisters in Navi Mumbai is exactly the genuine brand story creators want to feature',
    niche: 'Candles + Fragrance'
  },
  {
    brand: 'Mheko',
    email: 'hello@mheko.com',
    hook: 'your pure, calming diffuser oils and home fragrances are ideal for home-lifestyle and wellness creator partnerships',
    niche: 'Home Fragrance'
  }
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
Founder, Creator Armour`;

async function main() {
  const results = [];
  for (const {brand, email, hook, niche} of batch) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          reply_to: 'creatorarmour07@gmail.com',
          to: [email],
          subject,
          text: body(brand, hook)
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✅ ${brand} → ${email} | ID: ${data.id}`);
        results.push({brand, email, status: 'sent', id: data.id});
      } else {
        console.error(`❌ ${brand} → ${email} | Status: ${res.status}`, data);
        results.push({brand, email, status: 'failed', error: data.message || data});
      }
    } catch (err) {
      console.error(`❌ ${brand} → ${email} | Exception:`, err.message);
      results.push({brand, email, status: 'error', error: err.message});
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`${r.status === 'sent' ? '✅' : '❌'} ${r.brand} → ${r.email} [${r.status}] ${r.id || ''}`);
  }
}

main();
