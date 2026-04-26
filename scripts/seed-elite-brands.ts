import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });
dotenv.config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ELITE_BRANDS = [
  {
    email: 'brand-demo@creatorarmour.com',
    business_name: 'CreatorArmour Demo',
    industry: 'Marketplace',
    location: 'Pan India',
    bio: 'The premium hub for creator-brand connections in India. Currently sourcing top-tier creative talent for 2026 campaigns.',
    avatar_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
  },
  {
    email: 'aether@example.com',
    business_name: 'Aether Audio',
    industry: 'Electronics',
    location: 'Bangalore',
    bio: 'Pioneering spatial audio for the next generation of creators. Minimalist design, maximalist sound.',
    avatar_url: 'https://images.unsplash.com/photo-1544244015-0cd4b3ff809a?q=80&w=2102&auto=format&fit=crop',
  },
  {
    email: 'bloom@example.com',
    business_name: 'Bloom Beauty',
    industry: 'Beauty & Skincare',
    location: 'Mumbai',
    bio: 'Clean, botanical-first skincare for the modern lifestyle. Searching for genuine voices in beauty.',
    avatar_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop',
  },
  {
    email: 'tempo@example.com',
    business_name: 'Tempo Fitness',
    industry: 'Sports & Fitness',
    location: 'Delhi',
    bio: 'High-performance apparel for high-performance humans. We empower your movement.',
    avatar_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
  }
];

async function seedEliteBrands() {
  console.log('🚀 Seeding elite brands...');

  for (const brandData of ELITE_BRANDS) {
    try {
      // 1. Find or create user
      // Note: In a real scenario, we'd use admin interface to create users.
      // For this script, we'll focus on the profiles if the users already exist.
      
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('business_name', brandData.business_name)
        .eq('role', 'brand')
        .maybeSingle();

      if (profile) {
        console.log(`Updating profile for: ${brandData.business_name}`);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                industry: brandData.industry,
                location: brandData.location,
                bio: brandData.bio,
                avatar_url: brandData.avatar_url,
                role: 'brand'
            })
            .eq('id', profile.id);
        
        if (updateError) throw updateError;
      } else {
        console.log(`Skipping ${brandData.business_name} - primary user doesn't exist yet.`);
      }
    } catch (err) {
      console.error(`Failed to seed ${brandData.business_name}:`, err);
    }
  }

  console.log('✅ Seeding complete.');
}

seedEliteBrands();
