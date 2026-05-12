import { BrandOutreachService } from '../server/src/services/BrandOutreachService.js';
import dotenv from 'dotenv';
import { supabase } from '../server/src/lib/supabase.js';

dotenv.config({ path: 'server/.env' });

async function triggerLiveBatch() {
    console.log('🔥 GOING LIVE: Sending the first batch of 10 REAL D2C outreach emails...');
    
    const { data: leads, error } = await supabase
        .from('brand_leads')
        .select('id, brand_name, email')
        .eq('status', 'pending')
        .limit(10);

    if (error || !leads || leads.length === 0) {
        console.error('❌ No pending leads found in brand_leads.');
        return;
    }

    console.log(`📨 Found ${leads.length} leads. Sending now...`);

    for (const lead of leads) {
        try {
            console.log(`➡️ Sending LIVE outreach to ${lead.brand_name} (${lead.email})...`);
            await BrandOutreachService.sendD2CPitch(lead.id);
            console.log(`✅ Sent ${lead.brand_name}`);
        } catch (err) {
            console.error(`❌ Failed ${lead.brand_name}:`, err.message);
        }
        // Delay to avoid rate limiting and look natural
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('✨ All 10 live outreach emails have been dispatched! Monitor creatorarmour07@gmail.com for replies.');
}

triggerLiveBatch();
