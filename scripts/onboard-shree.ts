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
  const email = 'lukshobanaa@gmail.com';
  const username = 'dr.shree.in';
  const fullName = 'Dr. Shree';
  const password = 'CreatorArmour2026!'; // Temporary password

  console.log(`🚀 Starting Onboarding for Dr. Shree (@${username})...`);

  try {
    // 1. Create Auth User
    console.log(`📧 Creating auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Shree',
        last_name: 'Dr.',
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

    // Reusing the high-fidelity H.264/FastStart optimized retriever video in Supabase
    const publicUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/rohit_cheeku_bhandari_discovery_1778841394128.mp4';
    console.log(`✅ Discovery Video URL: ${publicUrl}`);

    // 2. Register Profile Details
    console.log('📝 Registering creator profile parameters...');
    // A beautiful pet-care / veterinarian avatar placeholder (smart puppy with glasses)
    const avatarUrl = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=250&h=250'; 
    const pastBrands = ['Heads Up For Tails', 'Vetic', 'Boggos Pet Food', 'Fur Ball Story'];

    const profileUpdate = {
      id: actualUserId,
      first_name: 'Shree',
      last_name: 'Dr.',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: fullName,
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Wholesomeness',
      instagram_followers: 13000,
      followers_count: 13000,
      engagement_rate: 5.8,
      avg_views: 18000,
      avg_reel_views_manual: 18000,
      reel_price: 8000,
      story_price: 2500,
      starting_price: 8000,
      open_to_collabs: true,
      collaboration_preference: 'paid', // currently not open for barter
      is_verified: true,
      is_elite_verified: true,
      location: 'Coimbatore, Tamil Nadu, India',
      city: 'Coimbatore',
      bio: '🐾 Pediatric & Veterinary Pet Consultant | Coimbatore. Sharing adorable pet milestones, wholesome canine logs, and professional pet wellness tips.',
      intro_line: "Coimbatore's Trusted Pet Care & Wholesome Creator - Dr. Shree 🩺🐶✨",
      collab_intro_line: 'Dr. Shree shares professional pet care guidance, high-energy metropolitan routines, and wholesome pet parent updates.',
      discovery_video_url: publicUrl,
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot
      audience_gender_split: { women: 78.5, men: 21.5 },
      top_cities: ['Coimbatore', 'Chennai', 'Bangalore', 'Mumbai'],
      audience_age_range: '18-34 (82%)',
      primary_audience_language: 'English / Tamil',
      
      // System Trust Signals
      deal_score: 96,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,

      // Intel
      deal_intelligence: {
        hookRate: 58.2,
        interactionRate: 5.8,
        accountsReached30d: '180K',
        accountsEngaged30d: '12K',
        viralPotential: 'Top 15% Partner Activity',
        demographicsRelevance: '92% India Concentrated'
      },
      collab_audience_fit_note: 'Strong regional pet parent presence (78.5%) concentrated in Coimbatore, Chennai, and Bangalore.',
      collab_engagement_confidence_note: 'Active 5.8% interaction rate with high saves and share counts on educational pet wellness content.',
      collab_delivery_reliability_note: 'Professional management with consistent, prompt schedules and premium quality.',
      collab_cta_trust_note: 'High recommendation authority for veterinary-vetted pet food, smart dog toys, and wellness supplies.',

      // Deal Templates
      deal_templates: [
        {
          id: 'starter_reel',
          type: 'paid',
          label: '🚀 Starter Collab',
          budget: 8000,
          isPopular: false,
          description: '1 Collab Reel (without ad rights) - Perfect for first-time brand awareness & organic reach.',
          deliverables: [
            '1 Reel (15-30s) without ad rights',
            'Organic reach focus',
            '1 Revision included'
          ]
        },
        {
          id: 'growth_package',
          type: 'paid',
          label: '⭐ Growth Campaign',
          budget: 15000,
          isPopular: true,
          description: 'Best for brands wanting ads usage + conversions.',
          deliverables: [
            '1 Premium Reel (30-60s) with 30-day usage rights',
            '30-day usage rights (for ads)',
            'Script + hook optimization',
            '1 Story shoutout',
            '1 Revision included'
          ]
        }
      ],
      past_brands: pastBrands,
      past_brand_count: 8,
      collab_brands_count_override: 8
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
          followers: 13000,
          linked_at: new Date().toISOString()
        });

      if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
      else console.log('✅ Social account linked');
    } else {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .update({
          followers: 13000,
          linked_at: new Date().toISOString()
        })
        .eq('id', existingSocial.id);

      if (socialError) console.warn('⚠️ Social account update warning:', socialError.message);
      else console.log('✅ Social account updated');
    }

    console.log('\n✨ Onboarding Successful! Dr. Shree is now 100% Elite Verified.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Onboarding failed:', error.message);
  }
}

main();
