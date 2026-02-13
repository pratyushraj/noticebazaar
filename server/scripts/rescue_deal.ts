
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function rescueDeal() {
    const dealId = 'ac01cd76-9469-412f-bc2f-5009df57e15b';
    const requestId = '73ec7d66-4148-46b3-92a6-eda25770bdc1';

    console.log('🚀 Rescuing deal:', dealId);

    // 1. Link deal to collab request and set status to accepted
    const { error: linkError } = await supabase
        .from('collab_requests')
        .update({
            deal_id: dealId,
            status: 'accepted',
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (linkError) {
        console.error('❌ Failed to link collab request:', linkError);
    } else {
        console.log('✅ Linked collab request and set status to accepted');
    }

    // 2. Clear status of deal to Drafting (it's already Drafting but let's be sure)
    const { error: dealUpdateError } = await supabase
        .from('brand_deals')
        .update({
            status: 'Drafting',
            updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

    if (dealUpdateError) {
        console.error('❌ Failed to update deal status:', dealUpdateError);
    } else {
        console.log('✅ Deal status confirmed as Drafting');
    }

    console.log('📢 Rescue complete. You can now use the "Regenerate Contract" button or endpoint to send the email.');
}

rescueDeal().catch(console.error);
