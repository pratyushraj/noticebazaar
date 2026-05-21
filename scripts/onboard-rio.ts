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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'riothelabrador31@gmail.com';
  const username = 'riotheelabrador';
  const fullName = 'Rio patola';
  const password = 'CreatorArmour2026!'; // Temporary credential

  console.log(`🚀 Updating Onboarding for Rio patola (@${username}) to set Drools as their past brand deal...`);

  try {
    // 1. Resolve Auth User ID
    let actualUserId = '';
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);
    
    if (!existingUser) {
      console.log(`📧 User not found. Creating auth user for ${email}...`);
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Rio',
          last_name: 'patola',
        }
      });
      if (userError) throw userError;
      actualUserId = userData.user?.id || '';
    } else {
      actualUserId = existingUser.id;
    }

    console.log(`✅ User ID resolved: ${actualUserId}`);

    // Standard high-quality Yellow Labrador avatar
    const avatarUrl = 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=250&h=250';
    const pastBrands = ['Drools'];

    // 2. Register Profile Details
    console.log('📝 Registering creator profile parameters with high-fidelity marketplace metrics...');
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Rio',
      last_name: 'patola',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Rio patola | Rio the Labrador 🐾',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Wholesomeness',
      instagram_followers: 60300,
      followers_count: 60300,
      engagement_rate: 7.9, // Exact official Meta Interaction Rate
      avg_views: 54400,    // Exact official Meta Accounts Engaged (30d)
      avg_reel_views_manual: 54400,
      reel_price: 7000,   // From DM starting rate
      story_price: 2000,    // Estimated standard
      starting_price: 7000,
      open_to_collabs: true,
      collaboration_preference: 'both', // Open to paid starting from 7k and barter depending on product (~10k)
      is_verified: true,
      is_elite_verified: true,
      location: 'Madhya Pradesh, India',
      city: 'Gwalior',
      bio: '🐾 Just a wholesome yellow Labrador spreading smiles! Lover of treats, long naps, and active play. DM for inquiries 💌',
      intro_line: 'Wholesome Yellow Labrador with 60.3K followers and 7.9% official Meta Interaction Rate 🐾💛',
      collab_intro_line: 'Rio the Labrador shares sweet wholesome stories, playful tricks, and healthy pet food reviews from Gwalior.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot from Meta Creator Marketplace
      audience_gender_split: { women: 51.3, men: 48.7 },
      top_cities: ['Delhi', 'Mumbai', 'Ahmedabad', 'Bangalore'],
      audience_age_range: '18-34 (86.9%)',
      primary_audience_language: 'Hindi / English',

      // System Trust Signals
      deal_score: 94,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true, // Display past work as they have verified brand partnership history

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 46.0, // 46% from Marketplace
        interactionRate: 7.9, // 7.9% from Marketplace
        accountsReached30d: '516.8K', // 516.8K from Marketplace
        accountsEngaged30d: '54.4K', // 54.4K from Marketplace
        viralPotential: 'High Organic Reach Potential',
        demographicsRelevance: '97% India Concentrated'
      },
      collab_audience_fit_note: 'Strong 97% Indian concentration with primary audience concentrated in Delhi (6.4%), Mumbai (2.5%), Ahmedabad (2.2%), and Bangalore (1.7%).',
      collab_engagement_confidence_note: 'Healthy 7.9% official Meta interaction rate combined with an active 46% video hook rate.',
      collab_delivery_reliability_note: 'Verified creator with strong engagement and high organic viewer retention.',
      collab_cta_trust_note: 'Highly recommended for mid-tier Indian D2C pet wellness and accessory campaigns.',

      // Deal Templates
      deal_templates: [
        {
          id: 'starter_reel',
          type: 'paid',
          label: '🚀 Starting Collab Reel',
          budget: 7000,
          isPopular: true,
          description: '1 Wholesome Collab Reel featuring Rio - Perfect for brand awareness and active organic reach.',
          deliverables: [
            '1 Reel (15-30s) featuring Rio the Labrador',
            'Full organic rights',
            'Authentic product integration'
          ]
        },
        {
          id: 'barter_package',
          type: 'barter',
          label: '🎁 Barter Collaboration',
          budget: 10000, // Barter value equivalent
          isPopular: false,
          description: '1 Wholesome Reel in exchange for premium pet products / D2C brand barter value.',
          deliverables: [
            '1 Collab Reel (15-30s) showcasing the product usage',
            '1 Story post tagging the brand',
            'Product value must be at or above ₹10,000'
          ]
        }
      ],
      past_brands: pastBrands,
      past_brand_count: 1,
      collab_brands_count_override: 1
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database with Drools past brand deal.');

    // 3. Creators table link
    const { data: creatorRecord } = await supabase
      .from('creators')
      .select('id')
      .eq('id', actualUserId)
      .maybeSingle();

    if (!creatorRecord) {
      await supabase.from('creators').insert({
        id: actualUserId,
        email: email,
        full_name: fullName,
      });
    }
    console.log('✅ Creators table link established.');

    // 4. Link social account
    console.log('📱 Linking social account...');
    const { data: existingSocial } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('username', username)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (!existingSocial) {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .insert({
          creator_id: actualUserId,
          platform: 'instagram',
          username: username,
          followers: 60300,
          linked_at: new Date().toISOString()
        });

      if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
      else console.log('✅ Social account linked');
    } else {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .update({
          followers: 60300,
          linked_at: new Date().toISOString()
        })
        .eq('id', existingSocial.id);

      if (socialError) console.warn('⚠️ Social account update warning:', socialError.message);
      else console.log('✅ Social account updated');
    }

    console.log('\n✨ Database Update Successful! Rio patola has only 1 past brand: Drools.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);
    console.log(`👤 User ID: ${actualUserId}`);

  } catch (error: any) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

main();
