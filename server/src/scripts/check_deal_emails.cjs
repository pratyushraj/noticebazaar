const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?$/);
    if (match) env[match[1]] = (match[2] || '').replace(/^"|"$/g, '');
});

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const DEAL_ID = '0e249fe1-cc3d-42af-96fd-e44ea24ea009';

async function run() {
    console.log('=== Checking Deal:', DEAL_ID, '===\n');

    // 1. Get deal details
    const dealRes = await fetch(`${SUPABASE_URL}/rest/v1/brand_deals?id=eq.${DEAL_ID}&select=brand_name,brand_email,deal_amount,status,deal_execution_status,creator_id,created_at,updated_at`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const deals = await dealRes.json();
    const deal = deals[0];
    console.log('📋 Deal:', JSON.stringify(deal, null, 2));

    // 2. Get signatures
    const sigRes = await fetch(`${SUPABASE_URL}/rest/v1/contract_signatures?deal_id=eq.${DEAL_ID}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const signatures = await sigRes.json();
    console.log('\n✍️ Signatures:', JSON.stringify(signatures, null, 2));

    // 3. Get action logs
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/deal_action_logs?deal_id=eq.${DEAL_ID}&select=*&order=created_at.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const logs = await logRes.json();
    console.log('\n📝 Action Logs:', JSON.stringify(logs, null, 2));

    // 4. Get creator profile
    if (deal && deal.creator_id) {
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${deal.creator_id}&select=email,first_name,last_name,business_name`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const profiles = await profileRes.json();
        console.log('\n👤 Creator Profile:', JSON.stringify(profiles[0], null, 2));
    }

    // 5. Analysis
    console.log('\n\n=== 📧 EMAIL ANALYSIS ===\n');

    const brandSig = signatures.find(s => s.signer_role === 'brand');
    const creatorSig = signatures.find(s => s.signer_role === 'creator');

    if (brandSig && brandSig.signed) {
        console.log('✅ Brand signed at:', brandSig.signed_at);
        console.log('   Brand email (signer):', brandSig.signer_email);
        console.log('   → Email #1 (Brand Confirmation) → SHOULD have been sent to:', brandSig.signer_email);
        console.log('   → Email #2 (Creator Notification + Magic Link) → SHOULD have been sent to creator');
    } else {
        console.log('❌ Brand has NOT signed');
    }

    if (creatorSig && creatorSig.signed) {
        console.log('\n✅ Creator signed at:', creatorSig.signed_at);
        console.log('   Creator email (signer):', creatorSig.signer_email);
        console.log('   → Email #3 (Creator Confirmation) → SHOULD have been sent to:', creatorSig.signer_email);
        if (deal.brand_email) {
            console.log('   → Email #4 (Brand Notification) → SHOULD have been sent to:', deal.brand_email);
        } else {
            console.log('   ⚠️  Email #4 (Brand Notification) → SKIPPED: brand_email is EMPTY on deal');
        }
    } else {
        console.log('\n❌ Creator has NOT signed');
    }

    console.log('\n=== STATUS ===');
    console.log('Deal status:', deal?.status);
    console.log('Deal execution status:', deal?.deal_execution_status);
}

run().catch(console.error);
