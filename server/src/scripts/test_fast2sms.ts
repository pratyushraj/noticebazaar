
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTP } from '../services/fast2smsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const phoneNumber = '917292984244';
    const otp = '999999';

    console.log('Sending SMS via Fast2SMS to:', phoneNumber);

    const result = await sendOTP(phoneNumber, otp);

    if (result.success) {
        console.log('Successfully sent SMS via Fast2SMS!');
    } else {
        console.error('Failed to send SMS via Fast2SMS:', result.error);
    }
}

main().catch(console.error);
