import { createClient } from '@supabase/supabase-js';

// 1. FILL IN YOUR SUPABASE DETAILS
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToAdmin(email) {
  console.log(`🚀 Promoting ${email} to Admin...`);

  // Update role in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Success! This user now has full Admin Command Center access.');
  }
}

// 2. ENTER THE EMAIL OF "THE GUY" HERE
promoteToAdmin('admin@creatorarmour.com');
