import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, creator_category, bio');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log(`Total Creators in database: ${data.length}`);
  
  // Categorize food creators based on category or bio keywords
  const foodKeywords = ['food', 'cook', 'chef', 'recipe', 'kitchen', 'cafe', 'restaurant', 'bake', 'bite', 'meal', 'pickle', 'spice', 'chutney'];
  
  const foodCreators = data.filter((p: any) => {
    const category = (p.creator_category || '').toLowerCase();
    const bio = (p.bio || '').toLowerCase();
    
    const hasFoodCategory = category.includes('food') || category.includes('cook') || category.includes('kitchen') || category.includes('recipe') || category.includes('beverage') || category.includes('drink');
    const hasFoodKeywordInBio = foodKeywords.some(kw => bio.includes(kw));
    
    return hasFoodCategory || hasFoodKeywordInBio;
  });

  console.log(`\nExact Food & Kitchen-related Creators found: ${foodCreators.length}`);
  foodCreators.forEach((p: any, idx: number) => {
    console.log(`${idx + 1}. @${p.username} | Name: ${p.first_name || 'null'} | Category: ${p.creator_category} | Bio: ${p.bio}`);
  });
}

main();
