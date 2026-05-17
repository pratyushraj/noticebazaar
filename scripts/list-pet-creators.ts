import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const petKeywords = [
  'pet', 'dog', 'cat', 'puppy', 'kitten', 'retriever', 'beagle', 
  'husky', 'spitz', 'pawsome', 'meow', 'furry', 'paws'
];

async function main() {
  console.log('🐾 Scanning database for verified Pet Creators...');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator');

    if (error) throw error;

    const petCreators = [];

    for (const p of profiles) {
      const usernameLower = (p.username || '').toLowerCase();
      const bioLower = (p.bio || '').toLowerCase();
      const firstLower = (p.first_name || '').toLowerCase();
      const lastLower = (p.last_name || '').toLowerCase();
      
      const categoryLower = (p.creator_category || '').toLowerCase();
      const nicheLower = (p.niche || '').toLowerCase();
      
      // Handle arrays or strings for content_niches / content_vibes
      const nichesStr = Array.isArray(p.content_niches) 
        ? p.content_niches.join(' ').toLowerCase() 
        : (p.content_niches || '').toLowerCase();

      // Check if any keyword matches
      const isPetCreator = petKeywords.some(kw => {
        return usernameLower.includes(kw) || 
               bioLower.includes(kw) || 
               firstLower.includes(kw) || 
               lastLower.includes(kw) || 
               categoryLower.includes(kw) || 
               nicheLower.includes(kw) || 
               nichesStr.includes(kw);
      });

      if (isPetCreator) {
        petCreators.push(p);
      }
    }

    console.log(`\n🐾 Total Pet Creators Found: ${petCreators.length}`);
    console.log('='.repeat(90));
    
    petCreators.forEach((c, idx) => {
      console.log(`${idx + 1}. @${c.username.padEnd(25)} | Name: ${(c.first_name + ' ' + (c.last_name || '')).trim().padEnd(25)} | Followers: ${c.followers_count || 'N/A'} | Niche/Cat: ${c.niche || c.creator_category || 'Pets'}`);
      if (c.bio) {
        console.log(`   Bio: "${c.bio.replace(/\n/g, ' ')}"`);
      }
      console.log('-'.repeat(90));
    });

  } catch (error: any) {
    console.error('❌ Scanning failed:', error.message);
  }
}

main();
