const fetch = require('node-fetch');
require('dotenv').config({ path: './server/.env' });

async function sendTestEmail() {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: 'outreach@creatorarmour.com',
      subject: 'Test Forwarding Email from NoticeBazaar!',
      html: '<h1>It works!</h1><p>If you are reading this in your creatorarmour07@gmail.com inbox, then ImprovMX email forwarding is completely set up and working perfectly!</p>'
    })
  });
  
  const data = await response.json();
  console.log(data);
}

sendTestEmail();
