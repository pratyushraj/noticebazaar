
import { supabase } from '../lib/supabase.js';

async function checkColumns() {
    console.log('Checking profiles table columns...');
    
    // Attempt to select the new OTP columns
    const { data, error } = await supabase
        .from('profiles')
        .select('profile_otp_hash, profile_otp_expires_at, profile_otp_attempts')
        .limit(1);

    if (error) {
        console.error('❌ Error checking columns:', error.message);
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.error('⚠️ The OTP columns are missing. Please run the migrations.');
        }
    } else {
        console.log('✅ OTP columns exist in the profiles table.');
    }
    process.exit(0);
}

checkColumns();
