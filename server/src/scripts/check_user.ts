
import { supabase } from '../lib/supabase.js';

async function checkUser() {
    const email = 'raaashhee@yopmai.com';
    console.log(`Checking user: ${email}`);
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, business_name')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('❌ Error fetching profile:', error);
    } else if (!profile) {
        console.error('❌ Profile not found');
    } else {
        console.log('✅ Profile found:', profile);
    }
}

checkUser();
