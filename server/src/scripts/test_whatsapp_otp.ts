
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPviaWhatsApp } from '../services/msg91Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const phoneNumber = '917292984244';
    const otp = '123456';

    console.log('Sending TEST OTP via WhatsApp to:', phoneNumber);

    const result = await sendOTPviaWhatsApp(phoneNumber, otp);

    if (result.success) {
        console.log('Successfully sent TEST OTP!');
        console.log('Message ID/Status:', result.message);
    } else {
        console.error('Failed to send TEST OTP:', result.error);
    }
}

main().catch(console.error);
