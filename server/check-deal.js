
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDeal() {
    const dealId = 'e56727c8-734f-4e4f-8f55-0546d6b1701b';

    const { data: deal } = await supabase.from('brand_deals').select('*').eq('id', dealId).single();
    console.log('Deal:', deal);

    const { data: submission } = await supabase.from('deal_details_submissions').select('*').eq('deal_id', dealId).maybeSingle();
    console.log('Submission:', submission);

    const { data: sigs } = await supabase.from('contract_signatures').select('*').eq('deal_id', dealId);
    console.log('Signatures:', sigs);
}

checkDeal();
