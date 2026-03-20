const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = (match[2] || '').replace(/^"|"$/g, '');
});

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const DEAL_ID = '2b640456-6762-42c8-b42b-40e5268edea4';

async function run() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/brand_deals?id=eq.${DEAL_ID}&select=brand_name,deal_amount,status,brand_response_status,creator_id`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    console.log('Deal:', data[0]);
}
run();
