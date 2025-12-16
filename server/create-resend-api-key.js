// Script to create a new Resend API key
// Usage: node create-resend-api-key.js

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// You need your main Resend API key to create a new one
const MAIN_RESEND_API_KEY = process.env.RESEND_API_KEY || process.argv[2];

if (!MAIN_RESEND_API_KEY || MAIN_RESEND_API_KEY === 'your_resend_api_key_here' || MAIN_RESEND_API_KEY.trim() === '') {
  console.error('❌ RESEND_API_KEY is required!');
  console.error('');
  console.error('Usage:');
  console.error('  Option 1: Set RESEND_API_KEY in server/.env file');
  console.error('  Option 2: node create-resend-api-key.js <your_main_api_key>');
  console.error('');
  console.error('Get your main API key from: https://resend.com/api-keys');
  process.exit(1);
}

const apiKeyName = process.argv[3] || 'CreatorArmour Production';
const permission = process.argv[4] || 'sending_access'; // or 'full_access'
const domainId = process.argv[5] || null; // Optional: restrict to creatorarmour.com domain

async function createApiKey() {
  try {
    console.log('🔑 Creating new Resend API key...');
    console.log(`   Name: ${apiKeyName}`);
    console.log(`   Permission: ${permission}`);
    if (domainId) {
      console.log(`   Domain ID: ${domainId}`);
    }
    console.log('');

    const requestBody = {
      name: apiKeyName,
      permission: permission,
    };

    // Add domain restriction if provided
    if (domainId && permission === 'sending_access') {
      requestBody.domain_id = domainId;
    }

    const response = await fetch('https://api.resend.com/api-keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAIN_RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to create API key:');
      console.error('Status:', response.status);
      console.error('Error:', data);
      process.exit(1);
    }

    if (data.id && data.token) {
      console.log('✅ API Key created successfully!');
      console.log('');
      console.log('📋 API Key Details:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Token: ${data.token}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Save this token now! You won\'t be able to see it again.');
      console.log('');
      console.log('Add to your server/.env file:');
      console.log(`RESEND_API_KEY=${data.token}`);
      console.log('');
    } else {
      console.error('❌ Unexpected response:', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating API key:', error.message);
    process.exit(1);
  }
}

createApiKey();

