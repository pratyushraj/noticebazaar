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
  const email = 'postoseal@gmail.com';
  const username = 'postothezippypuppy';
  const fullName = 'Posto the Zippy Puppy';
  const password = 'CreatorArmour2026!'; // Temporary password

  console.log(`🚀 Starting Onboarding for Posto (@${username})...`);

  try {
    // 1. Create Auth User
    console.log(`📧 Creating auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Posto',
        last_name: 'Zippy',
      }
    });

    if (userError) {
      if (userError.message.toLowerCase().includes('already')) {
        console.log('⚠️ User already exists, proceeding to update profile...');
      } else {
        throw userError;
      }
    }

    const userId = userData.user?.id;
    let actualUserId = '';
    if (!userId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);
      if (!existingUser) throw new Error('Could not find or create user');
      actualUserId = existingUser.id;
    } else {
      actualUserId = userId;
    }

    console.log(`✅ User ID resolved: ${actualUserId}`);

    // Reusing the high-fidelity H.264/FastStart optimized golden retriever video in Supabase
    const publicUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/rohit_cheeku_bhandari_discovery_1778841394128.mp4';
    console.log(`✅ Discovery Video URL: ${publicUrl}`);

    // 2. Register Profile Details
    console.log('📝 Registering creator profile parameters...');
    const avatarUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=250&h=250'; // Cute puppy avatar
    const pastBrands = ['Fur Ball Story', 'Vetic', 'Boggos Pet Food', 'Heads Up For Tails', 'Petz Essentials', 'Tell Tails'];

    const profileUpdate = {
      id: actualUserId,
      first_name: 'Posto',
      last_name: 'Zippy',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: fullName,
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Entertainment',
      instagram_followers: 48900,
      followers_count: 48900,
      engagement_rate: 6.2,
      avg_views: 38000,
      avg_reel_views_manual: 38000,
      reel_price: 10000,
      story_price: 3000,
      starting_price: 10000,
      open_to_collabs: true,
      collaboration_preference: 'paid',
      is_verified: true,
      is_elite_verified: true,
      location: 'Bengaluru, India',
      city: 'Bengaluru',
      bio: '🐾 Bengaluru\'s favorite zippy boy Posto! Sharing high-energy adventures, smart pup tricks, and wholesome family logs.',
      intro_line: "Bengaluru's Elite Pet Influencer - Posto 🐕✨",
      collab_intro_line: 'Posto shares wholesome family fun, premium pet accessories, and high-energy metropolitan routines.',
      discovery_video_url: publicUrl,
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot
      audience_gender_split: { women: 71.0, men: 29.0 },
      top_cities: ['Bengaluru', 'Mumbai', 'Delhi', 'Kolkata'],
      audience_age_range: '18-34 (84%)',
      primary_audience_language: 'English / Bengali',
      
      // System Trust Signals
      deal_score: 98,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,

      // Intel
      deal_intelligence: {
        hookRate: 63.5,
        interactionRate: 6.2,
        accountsReached30d: '450K',
        accountsEngaged30d: '41K',
        viralPotential: 'Top 12% Partner Activity',
        demographicsRelevance: '93% India Concentrated'
      },
      collab_audience_fit_note: 'Strong female pet-parent presence (71%) concentrated in Bengaluru and other major Indian metros.',
      collab_engagement_confidence_note: 'Highly active 6.2% interaction rate with high reel completion and save metrics.',
      collab_delivery_reliability_note: 'Professional management and prompt collaboration timeline responses.',
      collab_cta_trust_note: 'Outstanding recommendation authority for urban dog lifestyle products, custom treats, and smart dog toys.',

      // Active Standardized Deal Templates (Option A Compliant)
      deal_templates: [
        {
          id: 'starter_reel',
          type: 'paid',
          label: '🚀 Starter Collab',
          budget: 10000,
          isPopular: false,
          description: 'Perfect for first-time brand awareness & organic reach.',
          deliverables: [
            '1 Reel (15-30s)',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_package',
          type: 'paid',
          label: '⭐ Growth Campaign',
          budget: 20000,
          isPopular: true,
          description: 'Best for brands wanting ads usage + conversions.',
          deliverables: [
            '1 Premium Reel (30-60s)',
            '30-day usage rights (for ads)',
            'Script + hook optimization',
            '2 Story shoutouts',
            '1 Revision included'
          ]
        }
      ],
      past_brands: pastBrands,
      past_brand_count: 14,
      collab_brands_count_override: 14
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database with all metrics, deal templates, and video URL.');

    // 3. Check and create creator table link
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
          followers: 48900,
          linked_at: new Date().toISOString()
        });

      if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
      else console.log('✅ Social account linked');
    } else {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .update({
          followers: 48900,
          linked_at: new Date().toISOString()
        })
        .eq('id', existingSocial.id);

      if (socialError) console.warn('⚠️ Social account update warning:', socialError.message);
      else console.log('✅ Social account updated');
    }

    console.log('\n✨ Onboarding Successful! Posto the Zippy Puppy is now 100% Elite Verified.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Onboarding failed:', error.message);
  }
}

main();
