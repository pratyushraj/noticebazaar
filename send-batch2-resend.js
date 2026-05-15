const RESEND_API_KEY = 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';
const FROM_EMAIL = 'outreach@creatorarmour.com';
const FROM_NAME = 'Pratyush | Creator Armour';

const retryQueue = [
  {brand: 'Cayani', email: 'cayani.work@gmail.com', hook: "the timeless sophistication in your designs is rare"},
  {brand: 'Rangmahal Studio', email: 'rangmahalstudio.care@gmail.com', hook: 'your ethnic wear collection is stunning'},
  {brand: 'Naira Jewels', email: 'nairajewels1947@gmail.com', hook: 'your jewelry craftsmanship stands out'},
  {brand: 'Vya Naturals', email: 'info@vyanaturals.com', hook: 'your clean beauty approach resonates with our creators'},
  {brand: 'YOUGLO', email: 'hello@youglo.in', hook: 'your beauty/nail wrap products are innovative'}
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

async function sendRetries() {
  for (const {brand, email, hook} of retryQueue) {
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

    // Throttle to <5/sec — 1.1s gap
    await new Promise(r => setTimeout(r, 1100));
  }
}

sendRetries();
