
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
    const templateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID;

    console.log('Using Template:', templateId);

    // Try with both mobile and mobiles just in case
    const body = {
        template_id: templateId,
        recipients: [
            {
                mobiles: phoneNumber,
                mobile: phoneNumber,
                otp: '654321'
            }
        ]
    };

    const url = 'https://control.msg91.com/api/v5/flow/';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'authkey': authKey || '',
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Response from MSG91:', data);
}

main().catch(console.error);
