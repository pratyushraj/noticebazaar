import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Fetching users to delete...');
  
  // Get all users from profiles that are creator or brand
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .in('role', ['creator', 'brand']);
    
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  console.log(`Found ${profiles.length} users to delete.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const profile of profiles) {
    const { error } = await supabase.auth.admin.deleteUser(profile.id);
    if (error) {
      console.error(`Failed to delete user ${profile.id}:`, error.message);
      failCount++;
    } else {
      successCount++;
    }
  }
  
  console.log(`Finished. Deleted: ${successCount}, Failed: ${failCount}`);
}

run();
