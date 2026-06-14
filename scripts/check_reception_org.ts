import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load both root .env and server/.env to ensure variables are loaded
dotenv.config();
dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'reception@yourdentist.in';
  
  // Find auth user
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error('listUsers error:', uErr);
  }
  const user = users?.users?.find(u => u.email === email);
  if (!user) {
    console.log(`❌ No auth user found for ${email}`);
    return;
  }
  
  console.log(`Found User: ID=${user.id}, Email=${user.email}, Metadata=`, user.user_metadata);

  // Find profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) {
    console.error('Profile query error:', pErr);
  } else {
    console.log('Profile:', profile);
  }

  // Find organization if exists
  if (profile?.organization_id) {
    const { data: org, error: oErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .maybeSingle();
    if (oErr) {
      console.error('Org query error:', oErr);
    } else {
      console.log('Organization:', org);
    }
  } else {
    console.log('❌ No organization_id on profile');
  }

  // Find dental clinics
  let { data: clinics, error: cErr } = await supabase
    .from('dental_clinics')
    .select('*');
  if (cErr) {
    console.error('dental_clinics query error:', cErr);
  } else {
    console.log('Dental Clinics before:', clinics);
  }

  // Create clinic if it does not exist
  if (profile?.organization_id && (!clinics || clinics.length === 0)) {
    console.log('Inserting dental clinic for the user...');
    const { data: newClinic, error: insErr } = await supabase
      .from('dental_clinics')
      .insert([
        {
          id: profile.organization_id,
          name: 'Your Dentist',
          owner_id: user.id,
          working_hours: '9:00 AM - 8:00 PM'
        }
      ])
      .select()
      .single();
    
    if (insErr) {
      console.error('❌ Failed to insert dental clinic:', insErr);
    } else {
      console.log('✅ Dental clinic created successfully:', newClinic);
    }
  }
}

main().catch(console.error);
