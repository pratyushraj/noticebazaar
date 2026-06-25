const ACCESS_TOKEN = 'EAAq0l5dUYs0BRpE7NEZBmgrey4WIB8ZB87saxlaNFuIXeIextvXgXT5gzu614H9SqqEzMf8ROrCkGohm7R7AvB4Yg5p2gBWlWwd70GLJdzzowoYk0YpaSRFenHMlvVhnfslwWZCoI7aPLrYZBtiug65W96DVtrTPTsB0ZCDCEaZAzlpk6oxKQGu3oy3wL6DQZDZD'; 

async function listWaba() {
  try {
    console.log('📡 Fetching /me/whatsapp_business_accounts...');
    const res = await fetch(`https://graph.facebook.com/v17.0/me/whatsapp_business_accounts`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await res.json();
    console.log('📦 WABA response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

listWaba();
