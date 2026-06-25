const PHONE_NUMBER_ID = '1179722595225188';
const ACCESS_TOKEN = 'EAAq0l5dUYs0BRpE7NEZBmgrey4WIB8ZB87saxlaNFuIXeIextvXgXT5gzu614H9SqqEzMf8ROrCkGohm7R7AvB4Yg5p2gBWlWwd70GLJdzzowoYk0YpaSRFenHMlvVhnfslwWZCoI7aPLrYZBtiug65W96DVtrTPTsB0ZCDCEaZAzlpk6oxKQGu3oy3wL6DQZDZD'; 

async function getPhoneDetails() {
  try {
    console.log('📡 Fetching raw phone details...');
    const res = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await res.json();
    console.log('📦 Phone Details:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

getPhoneDetails();
