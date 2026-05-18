import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
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
  const email = 'kingrufus.malhotra@gmail.com';
  const username = 'kingrufus_malhotra';
  const fullName = 'King Rufus Malhotra';
  const password = 'CreatorArmour2026!'; // Temporary password

  console.log(`🚀 Starting Onboarding for King Rufus (@${username})...`);

  try {
    const optimizedVideoPath = join(process.cwd(), 'kingrufus_reel_optimized.mp4');

    if (!existsSync(optimizedVideoPath)) {
      throw new Error(`Optimized video file not found at: ${optimizedVideoPath}`);
    }

    // 1. Create Auth User
    console.log(`📧 Creating auth user for ${email}...`);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Rufus',
        last_name: 'Malhotra',
      }
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
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

    // 2. Upload optimized video to Supabase Storage
    const storagePath = `discovery-reels/${username}-reel.mp4`;
    console.log(`📤 Uploading optimized discovery reel to creator-discovery bucket...`);
    const fileBuffer = readFileSync(optimizedVideoPath);

    const { error: uploadError } = await supabase.storage
      .from('creator-discovery')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log('✅ Video uploaded successfully.');

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-discovery')
      .getPublicUrl(storagePath);
    console.log(`✅ Public Video URL: ${publicUrl}`);

    // 3. Update Profile
    console.log('📝 Registering creator profile parameters...');
    const avatarUrl = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=250&h=250'; // Golden Retriever portrait

    const pastBrands = [
      "Heads Up For Tails", "Supertails", "Wiggles", "Captain Zack", "SOLARA Home",
      "DogMeal India", "Absolut Pet", "Woof Treats", "Tell Tails", "Blep World"
    ];

    const profileUpdate = {
      id: actualUserId,
      first_name: 'Rufus',
      last_name: 'Malhotra',
      avatar_url: avatarUrl,
      username: username,
      instagram_handle: username,
      business_name: 'King Rufus Malhotra',
      role: 'creator',
      onboarding_complete: true,
      creator_category: 'Pet Care & Lifestyle',
      instagram_followers: 125000,
      followers_count: 125000,
      engagement_rate: 4.8,
      avg_views: 85000,
      avg_reel_views_manual: 85000,
      reel_price: 8000,
      story_price: 2000,
      starting_price: 3000,
      open_to_collabs: true,
      collaboration_preference: 'paid',
      is_verified: true,
      is_elite_verified: true,
      location: 'Delhi/Gurgaon, India',
      city: 'Delhi/Gurgaon',
      bio: '🐾 The Golden Retriever King of Gurgaon | Daily wholesomeness, smart pet antics & curated wellness stories.',
      intro_line: "Gurgaon's Elite Pet Influencer - King Rufus 🐕✨",
      collab_intro_line: 'Rufus shares wholesome pet family fun, gourmet wellness, and organic lifestyle routines.',
      discovery_video_url: publicUrl,
      last_instagram_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Audience Demographics Snapshot
      audience_gender_split: { women: 54.5, men: 45.5 },
      top_cities: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai'],
      audience_age_range: '18-34 (72%)',
      primary_audience_language: 'Hindi / English',
      
      // System Trust Signals
      deal_score: 98,
      collab_show_trust_signals: true,
      collab_show_audience_snapshot: true,
      collab_show_past_work: true,

      // Intel
      deal_intelligence: {
        hookRate: 64.2,
        interactionRate: 4.8,
        accountsReached30d: '3.4M',
        accountsEngaged30d: '298.5K',
        viralPotential: 'Premium Active Engagement',
        demographicsRelevance: '98.5% India Concentrated'
      },
      collab_audience_fit_note: 'Highly premium, active pet parent community centered in Delhi NCR. Exceptional organic relevance for D2C dog wellness brands.',
      collab_engagement_confidence_note: 'Extremely loyal audience interaction (4.8%) with high-energy reels retention.',
      collab_delivery_reliability_note: 'Professional response behaviors and seamless physical product integration.',
      collab_cta_trust_note: 'High-conversion recommendation rating for wholesome premium dog lifestyle and nutrition.',

      // Elite Deal Pricing Templates
      deal_templates: [
        {
          id: 'starter_reel_story',
          label: '🚀 Reel + Story Collab',
          description: 'Excellent for organic product placement, wellness stories, and community action.',
          budget: 8000,
          type: 'paid',
          deliverables: [
            '1 Dedicated Premium Reel (15-30s)',
            '1 Active Story shoutout with link sticker',
            '1 Revision included'
          ],
          isPopular: true
        },
        {
          id: 'static_post',
          label: '📸 Dedicated Static Post',
          description: 'High-end aesthetic product portrait showcase on grid.',
          budget: 3000,
          type: 'paid',
          deliverables: [
            '1 High-quality Dedicated Feed Post',
            '1 Active Story shoutout with link sticker'
          ]
        }
      ],
      past_brands: pastBrands,
      past_brand_count: pastBrands.length
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileUpdate);

    if (profileError) throw profileError;
    console.log('✅ Profile updated in database with all metrics, deal templates, and video URL.');

    // 4. Check and create creator table link
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

    // 5. Link social account
    console.log('📱 Linking social account...');
    const { error: socialError } = await supabase
      .from('social_accounts')
      .upsert({
        creator_id: actualUserId,
        platform: 'instagram',
        username: username,
        followers: 125000,
        linked_at: new Date().toISOString()
      }, { onConflict: 'username,platform' });

    if (socialError) console.warn('⚠️ Social account link warning:', socialError.message);
    else console.log('✅ Social account linked');

    console.log('\n✨ Onboarding Successful! King Rufus is now 100% Elite Verified.');
    console.log(`🔗 Profile Link: https://creatorarmour.com/${username}`);

  } catch (error: any) {
    console.error('❌ Onboarding failed:', error.message);
  }
}

main();
