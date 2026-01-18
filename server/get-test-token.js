#!/usr/bin/env node
// Quick script to get a JWT token for testing
// Usage: node get-test-token.js [email] [password]

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function getToken(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    console.log('\nAdd these to server/.env:');
    console.log('SUPABASE_URL=https://your-project.supabase.co');
    console.log('SUPABASE_ANON_KEY=your-anon-key');
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        email,
        password
      },
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.access_token) {
      console.log('\n✅ Success! Your JWT token:\n');
      console.log(response.data.access_token);
      console.log('\n💡 Use it like this:');
      console.log(`export TEST_AUTH_TOKEN="${response.data.access_token}"`);
      console.log('\nOr test directly:');
      console.log(`curl -X GET "http://localhost:3001/api/influencers/find?hashtags=fitness&keywords=influencer&limit=5" \\`);
      console.log(`  -H "Authorization: Bearer ${response.data.access_token}"`);
      return response.data.access_token;
    } else {
      console.error('❌ No token in response:', response.data);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
      if (error.response.status === 400) {
        console.log('\n💡 User might not exist. Create one at:');
        console.log(`${SUPABASE_URL.replace('/rest/v1', '')}/auth/v1/signup`);
        console.log('\nOr use Supabase Dashboard → Authentication → Users → Add User');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
}

// Get email/password from args or prompt
const email = process.argv[2] || process.env.TEST_EMAIL;
const password = process.argv[3] || process.env.TEST_PASSWORD;

if (!email || !password) {
  console.log('📝 Get JWT Token for Testing\n');
  console.log('Usage:');
  console.log('  node get-test-token.js <email> <password>');
  console.log('\nOr set in .env:');
  console.log('  TEST_EMAIL=your@email.com');
  console.log('  TEST_PASSWORD=yourpassword');
  console.log('\n💡 Create a test user first:');
  console.log('  1. Go to Supabase Dashboard → Authentication → Users');
  console.log('  2. Click "Add User" → Create user with email/password');
  console.log('  3. Use those credentials here\n');
  process.exit(1);
}

getToken(email, password).then(token => {
  if (token) {
    // Also save to .env.test if possible
    console.log('\n✅ Token obtained successfully!');
  }
});

