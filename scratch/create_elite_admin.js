import { createClient } from '@supabase/supabase-js';

// 1. FILL IN YOUR SUPABASE DETAILS
const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount(email, password) {
  console.log(`🚀 Creating Admin Account: ${email}...`);

  // Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: 'Elite Onboarding Manager' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ Account already exists. Proceeding to role promotion...');
    } else {
      console.error('❌ Auth Error:', authError.message);
      return;
    }
  }

  // Update role in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'admin',
      username: 'elite.admin',
      full_name: 'Elite Onboarding Manager'
    })
    .eq('email', email);

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
  } else {
    console.log('\n✅ ELITE ADMIN CREATED SUCCESSFULLY');
    console.log('-----------------------------------');
    console.log(`📧 ID: ${email}`);
    console.log(`🔑 PASS: ${password}`);
    console.log('-----------------------------------');
    console.log('Shared this with your onboarding guy! 🎩');
  }
}

createAdminAccount('admin@creatorarmour.com', 'EliteCreator2026!');
