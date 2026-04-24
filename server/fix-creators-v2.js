
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const VIRAT_ID = 'da2ffdc5-6714-4c36-8294-ca2df278b88a';
const BEYONCE_ID = '82362d16-8d09-4a4e-af58-d826ef4efdb2';

const VIRAT_PHOTO = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=400&h=400';
const BEYONCE_PHOTO = 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400&h=400';

async function fix() {
  console.log('Fixing Virat Kohli...');
  const { error: error1 } = await supabase
    .from('profiles')
    .update({ 
      avatar_url: VIRAT_PHOTO,
      instagram_profile_photo: VIRAT_PHOTO 
    })
    .eq('id', VIRAT_ID);

  if (error1) console.error('Error updating Virat:', error1);
  else console.log('✅ Updated Virat Kohli photo');

  console.log('Fixing Beyoncé...');
  const { error: error2 } = await supabase
    .from('profiles')
    .update({ 
      first_name: 'Beyoncé',
      business_name: 'Beyoncé',
      avatar_url: BEYONCE_PHOTO,
      instagram_profile_photo: BEYONCE_PHOTO
    })
    .eq('id', BEYONCE_ID);

  if (error2) console.error('Error updating Beyoncé:', error2);
  else console.log('✅ Updated Beyoncé name and photo');
}

fix();
