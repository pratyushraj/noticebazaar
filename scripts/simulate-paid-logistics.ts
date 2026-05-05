#!/usr/bin/env tsx

/**
 * Paid Logistics Deal Flow Simulation
 * 
 * Simulates a full end-to-end deal flow for a "Paid + Product" deal:
 * 1. Create/Ensure Brand and Creator
 * 2. Create Collab Request (Paid + Logistics)
 * 3. Transition to Active Deal (Contract Signed)
 * 4. Logistics: Mark as Shipped (Brand)
 * 5. Logistics: Mark as Received (Creator)
 * 6. Content: Submit Content (Creator)
 * 7. Content: Approve Content (Brand)
 * 8. Payment: Mark as Paid
 * 9. Complete Deal
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load env
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), 'server', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BRAND_EMAIL = 'brand-logistics@test.com';
const CREATOR_EMAIL = 'creator-logistics@test.com';

async function main() {
    console.log('🚀 Starting Paid Logistics Deal Simulation...\n');

    // 1. Ensure Users
    console.log('👥 Ensuring users...');
    const { data: users } = await supabase.auth.admin.listUsers();
    
    let brandId = users?.users.find(u => u.email === BRAND_EMAIL)?.id;
    let creatorId = users?.users.find(u => u.email === CREATOR_EMAIL)?.id;

    if (!brandId) {
        const { data } = await supabase.auth.admin.createUser({
            email: BRAND_EMAIL,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'brand' }
        });
        brandId = data.user?.id;
    }

    if (!creatorId) {
        const { data } = await supabase.auth.admin.createUser({
            email: CREATOR_EMAIL,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'creator' }
        });
        creatorId = data.user?.id;
    }

    // Ensure profiles
    await supabase.from('profiles').upsert([
        { id: brandId, role: 'brand', business_name: 'Logistics Brand', onboarding_complete: true },
        { id: creatorId, role: 'creator', first_name: 'Logistics', last_name: 'Creator', onboarding_complete: true }
    ]);

    console.log(`✅ Brand: ${brandId}`);
    console.log(`✅ Creator: ${creatorId}\n`);

    // 2. Create Collab Request
    console.log('📝 Creating Paid + Logistics Collab Request...');
    const { data: request, error: reqErr } = await supabase.from('collab_requests').insert({
        brand_id: brandId,
        creator_id: creatorId,
        brand_name: 'Logistics Brand',
        brand_email: BRAND_EMAIL,
        collab_type: 'paid',
        exact_budget: 15000,
        campaign_description: 'Simulation of a paid deal with physical product shipment.',
        deliverables: ['1 Unboxing Reel', '1 Product Review Story'],
        barter_description: 'Premium Creator Kit (Value ₹5,000)',
        barter_value: 5000,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'accepted' // Auto-accepted for simulation
    }).select().single();

    if (reqErr) throw reqErr;
    console.log(`✅ Request Created: ${request.id}\n`);

    // 3. Create Brand Deal (The Active Phase)
    console.log('🤝 Transitioning to Active Deal...');
    const { data: deal, error: dealErr } = await supabase.from('brand_deals').insert({
        brand_id: brandId,
        creator_id: creatorId,
        brand_name: 'Logistics Brand',
        collab_request_id: request.id,
        current_state: 'CONTRACT_SIGNED', // Fast-forward to signed
        collab_type: 'paid',
        deal_amount: 15000,
        deliverables: request.deliverables,
        requires_shipping: true,
        shipping_status: 'pending'
    }).select().single();

    if (dealErr) throw dealErr;
    console.log(`✅ Deal Active: ${deal.id}\n`);

    // 4. Logistics: Brand Ships
    console.log('📦 LOGISTICS: Brand marking as SHIPPED...');
    const { error: shipErr } = await supabase.from('brand_deals').update({
        shipping_status: 'shipped',
        courier_name: 'BlueDart',
        tracking_number: 'BD123456789',
        tracking_url: 'https://bluedart.com/track/BD123456789',
        shipped_at: new Date().toISOString()
    }).eq('id', deal.id);

    if (shipErr) throw shipErr;
    console.log('✅ Shipped! Creator will see tracking details.\n');

    // 5. Logistics: Creator Receives
    console.log('📬 LOGISTICS: Creator marking as RECEIVED...');
    const { error: receiveErr } = await supabase.from('brand_deals').update({
        shipping_status: 'delivered',
        delivered_at: new Date().toISOString(),
        current_state: 'CONTENT_IN_PROGRESS'
    }).eq('id', deal.id);

    if (receiveErr) throw receiveErr;
    console.log('✅ Received! Content creation phase started.\n');

    // 6. Content: Creator Submits
    console.log('🎬 CONTENT: Creator submitting work...');
    const { error: contentErr } = await supabase.from('brand_deals').update({
        current_state: 'CONTENT_SUBMITTED',
        content_drive_link: 'https://drive.google.com/test-reel-123',
        content_caption: 'Unboxing the new Premium Kit! #ad #creatorarmour',
        content_delivered_at: new Date().toISOString()
    }).eq('id', deal.id);

    if (contentErr) throw contentErr;
    console.log('✅ Content Submitted! Brand notified for review.\n');

    // 7. Content: Brand Approves
    console.log('⭐ CONTENT: Brand APPROVING work...');
    const { error: approveErr } = await supabase.from('brand_deals').update({
        current_state: 'APPROVED',
        content_approved_at: new Date().toISOString()
    }).eq('id', deal.id);

    if (approveErr) throw approveErr;
    console.log('✅ Content Approved! Moving to payment phase.\n');

    // 8. Payment: Mark as Paid
    console.log('💰 PAYMENT: Marking as PAID...');
    const { error: payErr } = await supabase.from('brand_deals').update({
        current_state: 'PAID',
        payment_status: 'paid',
        amount_paid: 15000,
        payment_released_at: new Date().toISOString()
    }).eq('id', deal.id);

    if (payErr) throw payErr;
    console.log('✅ Payment Complete!\n');

    // 9. Completion
    console.log('🏁 FINALIZING: Marking deal as COMPLETED...');
    const { error: completeErr } = await supabase.from('brand_deals').update({
        current_state: 'COMPLETED'
    }).eq('id', deal.id);

    if (completeErr) throw completeErr;
    
    console.log('✨ SIMULATION SUCCESSFUL! ✨');
    console.log('-----------------------------------');
    console.log(`Deal ID:    ${deal.id}`);
    console.log(`Final State: COMPLETED`);
    console.log(`Total Paid:  ₹15,000`);
    console.log(`Logistics:   Delivered via BlueDart`);
    console.log('-----------------------------------');
}

main().catch(err => {
    console.error('\n❌ Simulation Failed:');
    console.error(err);
    process.exit(1);
});
