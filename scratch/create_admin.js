import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'admin@creatorarmour.com';
  const password = 'AdminPassword123!';

  console.log('Creating admin user...');
  
  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    console.error('Error creating user:', userError.message);
    return;
  }

  const userId = userData.user.id;
  console.log(`User created with ID: ${userId}`);

  // Try updating the profile role to admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile role:', profileError.message);
  } else {
    console.log('Profile role set to admin successfully.');
  }

  console.log(`\n--- Credentials ---`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

run();
