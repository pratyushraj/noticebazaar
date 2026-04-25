
import { supabase } from '../lib/supabase.js';

async function checkProfile() {
    const userId = 'a7ed47ed-8490-4846-805b-5c8264f7a35f';
    console.log(`Checking profile for ID: ${userId}`);
    
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('❌ Error fetching profile:', error);
    } else if (!profile) {
        console.error('❌ Profile not found');
    } else {
        console.log('✅ Profile found:', profile);
    }
}

checkProfile();
