const PHONE_NUMBER_ID = '1179722595225188';
const ACCESS_TOKEN = 'EAAq0l5dUYs0BRpE7NEZBmgrey4WIB8ZB87saxlaNFuIXeIextvXgXT5gzu614H9SqqEzMf8ROrCkGohm7R7AvB4Yg5p2gBWlWwd70GLJdzzowoYk0YpaSRFenHMlvVhnfslwWZCoI7aPLrYZBtiug65W96DVtrTPTsB0ZCDCEaZAzlpk6oxKQGu3oy3wL6DQZDZD'; 
const TO_NUMBER = '917292984244';

async function sendBooking() {
  console.log(`🤖 Sending live booking template dispatch to ${TO_NUMBER}...`);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: TO_NUMBER,
    type: 'template',
    template: {
      name: 'appointment_booking_confirmation',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Pratyush Raj' },
            { type: 'text', text: '15 Jun 2026' },
            { type: 'text', text: '3:30 PM' },
            { type: 'text', text: 'Dr. Nilmani' },
            { type: 'text', text: '+91 75448 60350' }
          ]
        }
      ]
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('📡 Meta API Response HTTP Status:', res.status);
    console.log('📦 Meta API Response Payload:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Direct API communication failed:', err.message);
  }
}

sendBooking();
