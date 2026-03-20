import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeal() {
    const dealId = 'cd9cbc37-2b14-439e-8f3b-4edcecadafc7';
    const { data, error } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('id', dealId)
        .single();

    if (error) {
        console.error('Error fetching deal:', error);
        return;
    }

    console.log('Deal Data:', JSON.stringify(data, null, 2));
    
    // Also check logs
    const { data: logs, error: logsError } = await supabase
        .from('deal_action_logs')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });
        
    if (logsError) {
        console.error('Error fetching logs:', logsError);
    } else {
        console.log('Action Logs:', JSON.stringify(logs, null, 2));
    }
}

checkDeal();
