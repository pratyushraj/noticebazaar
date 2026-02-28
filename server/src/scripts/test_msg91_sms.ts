
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const phoneNumber = '917292984244';
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || 'CRARM';
    const templateId = process.env.MSG91_TEMPLATE_ID;

    console.log('--- MSG91 SMS TEST ---');
    console.log('Target:', phoneNumber);
    console.log('Sender ID:', senderId);
    console.log('Template ID:', templateId);

    // MSG91 v5 SMS API
    const url = 'https://control.msg91.com/api/v5/otp';
    const params = new URLSearchParams({
        template_id: templateId || '',
        mobile: phoneNumber,
        authkey: authKey || '',
        otp: '1234'
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET'
        });

        const data = await response.json();
        console.log('Response from MSG91 SMS:', data);

        if (data.type === 'success') {
            console.log('✅ SMS sent according to MSG91.');
        } else {
            console.error('❌ SMS failed:', data.message);
        }
    } catch (error) {
        console.error('Exception during SMS send:', error);
    }
}

main().catch(console.error);
