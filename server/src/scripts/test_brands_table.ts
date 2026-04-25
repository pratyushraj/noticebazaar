
import { supabase } from '../lib/supabase.js';

async function test() {
    console.log('Testing brands table...');
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching brands:', error);
    } else {
        console.log('✅ Brands table exists. Data:', data);
    }
}

test();
