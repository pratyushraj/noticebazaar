import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function find() {
  const { data, error } = await supabase.from('profiles').select('id, username, avatar_url, cover_photo');
  if (error) { console.error("Error from Supabase:", error); return; }
  const bad = (data || []).filter(p => (p.avatar_url && p.avatar_url.includes('1620916566390')) || (p.cover_photo && p.cover_photo.includes('1620916566390')));
  console.log(JSON.stringify(bad, null, 2));
}
find();
