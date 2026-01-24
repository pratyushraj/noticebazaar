// Test script to send brand confirmation email
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

import { sendCollabRequestSubmissionEmail } from './src/services/collabRequestEmailService.js';

async function testBrandEmail() {
  const testEmail = 'alt.zl-8i3zw3v@yopmail.com';
  
  console.log(`Sending test brand confirmation email to ${testEmail}...`);
  
  const result = await sendCollabRequestSubmissionEmail(testEmail, {
    creatorName: 'Rahul Creates',
    creatorPlatforms: ['Instagram', 'YouTube'],
    brandName: 'Demo Brand Co.',
    collabType: 'paid',
    exactBudget: 15000,
    budgetRange: null,
    barterDescription: null,
    deliverables: ['Instagram Reel', 'Post', 'Story'],
    deadline: '2026-02-07',
    requestId: 'test-request-123',
  });
  
  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.emailId);
  } else {
    console.error('❌ Failed to send email:', result.error);
  }
}

testBrandEmail().catch(console.error);

