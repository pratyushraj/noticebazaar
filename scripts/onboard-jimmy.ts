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
  const email = 'jimmyandgypsy@creatorarmour.com';
  const username = 'jimmyandgypsy';
  const fullName = 'Jimmy Andgypsy';
  const password = 'CreatorArmour2026!'; // Temporary credential

  console.log(`🚀 Starting Onboarding for Jimmy Andgypsy (@${username})...`);

  try {
    // 1. Create Auth User
    console.log(`📧 Creating auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Jimmy Andgypsy',
        last_name: '',
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

    // Standard high-quality Golden Retriever avatar
    const avatarUrl = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=250&h=250';
    const pastBrands = ['Heads Up For Tails', 'Supertails', 'Barkbox', 'Royal Canin'];

    // 2. Register Profile Details
    console.log('📝 Registering creator profile parameters...');
    const profileUpdate = {
      id: actualUserId,
      first_name: 'Jimmy',
      last_name: 'Andgypsy',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'Team Jimmy Gypsy and Golden Baby 🐾',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Wholesomeness',
      instagram_followers: 15100,
      followers_count: 15100,
      engagement_rate: 10.2, // From Marketplace Insight 10.2% Interaction Rate
      avg_views: 116300,    // Accounts Engaged: 116.3k
      avg_reel_views_manual: 116300,
      reel_price: 15000,   // From DM rate
      story_price: 3000,    // Estimated standard
      starting_price: 15000,
      open_to_collabs: true,
      collaboration_preference: 'paid', // "open to paid collaborations only"
      is_verified: true,
      is_elite_verified: true,
      location: 'Maharashtra, India',
      city: 'Mumbai',
      bio: '🐾 Hey there, Hoomans 💛 Just 3 Goldens making the world a happier place! | Cafe | Food | Wholesome Goldens.',
      intro_line: 'Premium Golden Retriever Trio with 10.2% Industry-Leading Engagement Rate 🐾💛',
      collab_intro_line: 'Team Jimmy Gypsy & Golden Baby share high-energy wholesome pet stories, smart dog parenting, and premium toy reviews.',
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot from Marketplace
      audience_gender_split: { women: 80, men: 20 },
      top_cities: ['Mumbai', 'Bangalore', 'Delhi', 'Pune'],
      audience_age_range: '18-34 (80%)',
      primary_audience_language: 'English / Hindi',

      // System Trust Signals
      deal_score: 95,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,

      // Marketplace Intel
      deal_intelligence: {
        hookRate: 59.7, // 59.7% from Marketplace
        interactionRate: 10.2, // 10.2% from Marketplace
        accountsReached30d: '1.2M', // 1.2M from Marketplace
        accountsEngaged30d: '116.3K', // 116.3K from Marketplace
        viralPotential: 'Top 10% Partner Activity',
        demographicsRelevance: '96% India Concentrated'
      },
      collab_audience_fit_note: 'Strong 96.2% Indian concentration with heavy presence in major metros: Mumbai (10.9%) and Bangalore (9.2%).',
      collab_engagement_confidence_note: 'Exceptional 10.2% interaction rate coupled with a very strong 59.7% hook rate.',
      collab_delivery_reliability_note: 'Highly active creator with verified partnership badges (Top 50% for partnership ad count).',
      collab_cta_trust_note: 'Strong conversion potential for premium pet food, grooming supplies, and smart pet tech.',

      // Deal Templates
      deal_templates: [
        {
          id: 'starter_reel',
          type: 'paid',
          label: '🚀 Premium Collab Reel',
          budget: 15000,
          isPopular: true,
          description: '1 Wholesome Collab Reel featuring the Goldens - Perfect for brand awareness and active organic push.',
          deliverables: [
            '1 Reel (15-30s) featuring the Goldens',
            'Full organic rights',
            'High retention hook integration'
          ]
        },
        {
          id: 'growth_package',
          type: 'paid',
          label: '⭐ Goldens Campaign',
          budget: 25000,
          isPopular: false,
          description: '1 Wholesome Reel + 2 Stories - Best for driving high engagement and direct product link traffic.',
          deliverables: [
            '1 Premium Reel (30-60s) with the Goldens',
            '30-day digital usage rights for ads',
            '2 Story shoutouts with direct product links',
            '1 Revision included'
          ]
        }
      ],
      past_brands: pastBrands,
      past_brand_count: 4,
      collab_brands_count_override: 4
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database with all metrics and marketplace stats.');

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
          followers: 15100,
          linked_at: new Date().toISOString()
        });

      if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
      else console.log('✅ Social account linked');
    } else {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .update({
          followers: 15100,
          linked_at: new Date().toISOString()
        })
        .eq('id', existingSocial.id);

      if (socialError) console.warn('⚠️ Social account update warning:', socialError.message);
      else console.log('✅ Social account updated');
    }

    console.log('\n✨ Database Onboarding Successful! Jimmy Andgypsy is now Elite Verified.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);
    console.log(`👤 User ID: ${actualUserId}`);

  } catch (error: any) {
    console.error('❌ Onboarding failed:', error.message);
    process.exit(1);
  }
}

main();
