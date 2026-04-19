import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function find() {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar_url');
  if (error) { console.error(error); return; }
  const bad = (data || []).filter(p => p.avatar_url && p.avatar_url.includes('1620916566390'));
  console.log('Profiles:', JSON.stringify(bad, null, 2));

  const { data: cw, error: e2 } = await supabase.from('creator_web_profiles').select('*');
  if (!e2 && cw) {
    const badCw = cw.filter(c => JSON.stringify(c).includes('1620916566390'));
    console.log('Creator Web:', JSON.stringify(badCw, null, 2));
  }
}
find();
