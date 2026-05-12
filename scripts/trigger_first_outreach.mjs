import { BrandOutreachService } from '../server/src/services/BrandOutreachService.js';
import dotenv from 'dotenv';
import { supabase } from '../server/src/lib/supabase.js';

dotenv.config({ path: 'server/.env' });

async function triggerFirstBatch() {
    console.log('🔥 Triggering the first batch of 5 D2C outreach emails...');
    
    const { data: leads, error } = await supabase
        .from('brand_leads')
        .select('id, brand_name')
        .eq('status', 'pending')
        .limit(5);

    if (error || !leads || leads.length === 0) {
        console.error('❌ No pending leads found in brand_leads.');
        return;
    }

    console.log(`📨 Found ${leads.length} leads. Sending now...`);

    for (const lead of leads) {
        try {
            console.log(`➡️ Sending outreach to ${lead.brand_name}...`);
            await BrandOutreachService.sendD2CPitch(lead.id);
            console.log(`✅ Sent ${lead.brand_name}`);
        } catch (err) {
            console.error(`❌ Failed ${lead.brand_name}:`, err.message);
        }
        // Small delay to be safe
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('✨ All 5 test emails have been dispatched to your Gmail!');
}

triggerFirstBatch();
