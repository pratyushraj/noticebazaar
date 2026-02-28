
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendCollabRequestWhatsApp } from '../services/msg91Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const phoneNumber = '917292984244';

    console.log('Sending demo message to:', phoneNumber);

    const result = await sendCollabRequestWhatsApp(phoneNumber, 'paid', {
        brand_name: 'Smart Sample Brand',
        value: '₹25,000',
        deliverables: '2 Reels + 1 Story',
        timeline: '10 Days',
        action_url: 'https://creatorarmour.com/collab/demo',
        accept_url: 'https://creatorarmour.com/collab/accept/demo',
        decline_url: 'https://creatorarmour.com/collab/decline/demo',
        counter_url: 'https://creatorarmour.com/collab/counter/demo'
    });

    if (result.success) {
        console.log('Successfully sent demo message!');
    } else {
        console.error('Failed to send demo message:', result.error);
    }
}

main().catch(console.error);
