import { fetchInstagramPublicData } from './src/services/instagramService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

async function testFetch(username) {
  console.log(`\n🔍 Testing fetch for: @${username}`);
  try {
    const data = await fetchInstagramPublicData(username);
    if (data) {
      console.log('✅ Success!');
      console.log('📸 Photo:', data.profile_photo ? 'FOUND (starts with ' + data.profile_photo.substring(0, 30) + '...)' : 'MISSING');
      console.log('📈 Followers:', data.followers);
      console.log('👤 Full Name:', data.full_name);
    } else {
      console.log('❌ Failed: No data returned');
    }
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

async function runTests() {
  await testFetch('zuck');
  await testFetch('cristiano');
  await testFetch('leomessi');
}

runTests();
