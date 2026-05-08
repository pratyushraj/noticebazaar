
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260508000001_add_charandeep_kaur_profile.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    // If rpc('exec_sql') doesn't exist, we might have to use another way or just report failure
    console.error('Error applying migration:', error);
    
    // Attempting direct query if possible (though supabase-js doesn't support raw SQL easily without RPC)
    console.log('Trying alternative insert...');
    
    // Manual update for Charandeep Kaur to ensure she's fixed
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: 'Professional Fashion, Lifestyle & Beauty creator. Focused on high-quality aesthetic content and authentic brand storytelling.',
        is_elite_verified: false
      })
      .eq('username', 'cutiebug2021');

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Successfully updated Charandeep Kaur bio and cleaned up Elite status!');
    }
  } else {
    console.log('Migration applied successfully via RPC!');
  }
}

applyMigration();
