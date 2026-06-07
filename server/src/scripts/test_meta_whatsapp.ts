import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMetaWhatsAppTemplate } from '../services/whatsappMetaService.js';

// Resolve directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runTest() {
  // Use a default phone number to test (the user's number from the screenshot is +91 70337 23720)
  const testPhoneNumber = '917292984244'; 

  // Meta registers a default 'hello_world' template for all WhatsApp Developer accounts to test setup
  const templateName = 'hello_world'; 

  console.log(`[Test Direct WhatsApp] Sending template "${templateName}" to ${testPhoneNumber}...`);

  const result = await sendMetaWhatsAppTemplate({
    to: testPhoneNumber,
    templateName: templateName,
    languageCode: 'en_US',
    bodyParameters: [] // 'hello_world' has no body variables
  });

  if (result.success) {
    console.log('🎉 Direct Meta WhatsApp message sent successfully! Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send Direct WhatsApp message. Error:', result.error);
  }
}

runTest();
