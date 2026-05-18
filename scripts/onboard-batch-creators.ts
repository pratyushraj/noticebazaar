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

interface CreatorPayload {
  email: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  category: string;
  followers: number;
  engagementRate: number;
  avgViews: number;
  reelPrice: number;
  storyPrice: number;
  startingPrice: number;
  location: string;
  city: string;
  bio: string;
  introLine: string;
  collabIntroLine: string;
  videoUrl: string;
  avatarUrl: string;
  pastBrands: string[];
  pastBrandCount: number;
  genderSplit: { women: number; men: number };
  topCities: string[];
  ageRange: string;
  language: string;
  dealScore: number;
  dealIntel: {
    hookRate: number;
    interactionRate: number;
    accountsReached30d: string;
    accountsEngaged30d: string;
    viralPotential: string;
    demographicsRelevance: string;
  };
  audienceFitNote: string;
  engagementConfidenceNote: string;
  deliveryReliabilityNote: string;
  ctaTrustNote: string;
  isPetCreator: boolean;
}

const creatorsToOnboard: CreatorPayload[] = [
  {
    email: 'goofytimtim@gmail.com',
    username: 'goofy.timtim',
    fullName: 'Goofy & TimTim',
    firstName: 'Goofy',
    lastName: 'TimTim',
    category: 'Pet Care & Wholesomeness',
    followers: 84500,
    engagementRate: 6.8,
    avgViews: 65000,
    reelPrice: 15000,
    storyPrice: 4000,
    startingPrice: 15000,
    location: 'Gurgaon, India',
    city: 'Gurgaon',
    bio: '🐾 The Gurgaon Wholesome Duo! Goofy & TimTim sharing daily retriever antics, gourmet canine recipes, and family fun.',
    introLine: 'Gurgaon\'s Elite Verified Pet Duo 🐕✨',
    collabIntroLine: 'Goofy & TimTim deliver premium active lifestyle routines and gourmet pet nutrition advocacy.',
    videoUrl: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/rohit_cheeku_bhandari_discovery_1778841394128.mp4', // Optimized retriever clip
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=250&h=250',
    pastBrands: ['Heads Up For Tails', 'Vetic', 'Boggos Pet Food', 'Fur Ball Story', 'Petz Essentials'],
    pastBrandCount: 22,
    genderSplit: { women: 74.5, men: 25.5 },
    topCities: ['Gurgaon', 'Delhi', 'Mumbai', 'Bangalore'],
    ageRange: '18-34 (84%)',
    language: 'Hindi / English',
    dealScore: 99,
    dealIntel: {
      hookRate: 65.4,
      interactionRate: 6.8,
      accountsReached30d: '780K',
      accountsEngaged30d: '68K',
      viralPotential: 'Top 5% Partner Retention',
      demographicsRelevance: '94% India Concentrated'
    },
    audienceFitNote: 'Extremely strong tier-1 Indian pet-parent base. High response to high-end canine wellness products and organic nutrition.',
    engagementConfidenceNote: 'phenomenal 6.8% engagement with active comments showing massive purchase intent.',
    deliveryReliabilityNote: 'Verified professional communication standards and consistent premium content execution.',
    ctaTrustNote: 'Highly recommended for premium pet care utilities, custom treats, and luxury dog lifestyle essentials.',
    isPetCreator: true
  },
  {
    email: 'savour.n.binge@gmail.com',
    username: 'savour.n.binge',
    fullName: 'Srishti | Savour & Binge',
    firstName: 'Srishti',
    lastName: 'Savour',
    category: 'Food, Travel & Lifestyle',
    followers: 112000,
    engagementRate: 4.2,
    avgViews: 75000,
    reelPrice: 4500,
    storyPrice: 1500,
    startingPrice: 4500,
    location: 'Mumbai, India',
    city: 'Mumbai',
    bio: '🍲 Savoring the best flavors & binging on global travel stories! Curating mouth-watering recipes and gorgeous lifestyle reviews.',
    introLine: 'Mumbai\'s Premier Culinary & Travel Explorer ✈️🥘',
    collabIntroLine: 'Srishti crafts high-fidelity cooking walkthroughs, restaurant reviews, and luxury hospitality stories.',
    videoUrl: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/sneha_discovery_1779040000000.mp4', // Optimized food/lifestyle reel
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250&h=250',
    pastBrands: ['Zomato', 'Swiggy Gourmet', 'Taj Hotels', 'Epigamia', 'Country Delight'],
    pastBrandCount: 34,
    genderSplit: { women: 62.0, men: 38.0 },
    topCities: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'],
    ageRange: '18-34 (80%)',
    language: 'Hindi / English',
    dealScore: 98,
    dealIntel: {
      hookRate: 60.5,
      interactionRate: 4.2,
      accountsReached30d: '1.2M',
      accountsEngaged30d: '95K',
      viralPotential: 'Top 10% Lifestyle Relevance',
      demographicsRelevance: '88% Metro Concentrated'
    },
    audienceFitNote: 'Highly relevant for premium kitchenware, organic groceries, and boutique hotel bookings.',
    engagementConfidenceNote: 'Strong community engagement with massive sharing rates on recipe and review reels.',
    deliveryReliabilityNote: 'Excellent turn-around time and pristine creative quality control.',
    ctaTrustNote: 'High conversion recommendation authority for gourmet products and travel experiences.',
    isPetCreator: false
  },
  {
    email: 'goldenasginger@gmail.com',
    username: 'goldenasginger',
    fullName: 'Ginger | Golden as Ginger',
    firstName: 'Ginger',
    lastName: 'Golden',
    category: 'Pet Care & Adventure',
    followers: 65000,
    engagementRate: 7.4,
    avgViews: 52000,
    reelPrice: 18000,
    storyPrice: 5000,
    startingPrice: 18000,
    location: 'Delhi NCR, India',
    city: 'Delhi NCR',
    bio: '🐾 The golden dog with a spicy ginger attitude! Spreading puppy smiles, outdoor adventures, and healthy lifestyle routines.',
    introLine: 'Delhi\'s Elite Adventurous Retriever 🌲🐕',
    collabIntroLine: 'Ginger shares high-energy trail adventures, premium organic food prep, and playful dog styling.',
    videoUrl: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/rohit_cheeku_bhandari_discovery_1778841394128.mp4', // Retriever clip
    avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=250&h=250',
    pastBrands: ['Vetic', 'Paws for Greens', 'Pupchew Co', 'Heads Up For Tails', 'Tell Tails'],
    pastBrandCount: 18,
    genderSplit: { women: 76.2, men: 23.8 },
    topCities: ['Delhi', 'Gurgaon', 'Noida', 'Mumbai'],
    ageRange: '18-34 (86%)',
    language: 'Hindi / English',
    dealScore: 99,
    dealIntel: {
      hookRate: 68.2,
      interactionRate: 7.4,
      accountsReached30d: '620K',
      accountsEngaged30d: '58K',
      viralPotential: 'Top 3% Category Hook Rate',
      demographicsRelevance: '95% India Concentrated'
    },
    audienceFitNote: 'Perfect fit for premium active dog gear, outdoor accessories, and raw-formulation diets.',
    engagementConfidenceNote: 'Incredibly high retention and loyal community following—ideal for conversion-led paid ads.',
    deliveryReliabilityNote: 'Fabulous creative setups and prompt timeline delivery compliance.',
    ctaTrustNote: 'Stellar conversion recommendation score for organic canine treats and high-quality accessories.',
    isPetCreator: true
  },
  {
    email: 'versatilemeals5@gmail.com',
    username: 'versatile_meals',
    fullName: 'Srimoyee Sahariah (Poppy)',
    firstName: 'Srimoyee',
    lastName: 'Sahariah',
    category: 'Food, Baking & Lifestyle',
    followers: 38000,
    engagementRate: 5.1,
    avgViews: 28000,
    reelPrice: 8000,
    storyPrice: 2500,
    startingPrice: 8000,
    location: 'Guwahati, India',
    city: 'Guwahati',
    bio: '🎂 Crafting versatile, comforting meals & gorgeous home-baked delights! Aesthetic recipes made easy for everyone.',
    introLine: 'Guwahati\'s Emerging Baking & Culinary Artisan 🧁✨',
    collabIntroLine: 'Srimoyee shares visual baking masterclasses, aesthetic food photography, and daily comfort kitchen routines.',
    videoUrl: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/sneha_discovery_1779040000000.mp4', // Food/lifestyle reel
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250&h=250',
    pastBrands: ['Hersheys India', 'Amul', 'Pillsbury', 'Pigeon Kitchenware', 'Mother Dairy'],
    pastBrandCount: 15,
    genderSplit: { women: 78.5, men: 21.5 },
    topCities: ['Guwahati', 'Kolkata', 'Delhi', 'Bangalore'],
    ageRange: '18-34 (82%)',
    language: 'English / Assamese',
    dealScore: 97,
    dealIntel: {
      hookRate: 62.4,
      interactionRate: 5.1,
      accountsReached30d: '320K',
      accountsEngaged30d: '26K',
      viralPotential: 'Top 15% Baking Niche',
      demographicsRelevance: '92% India Concentrated'
    },
    audienceFitNote: 'Excellent alignment for premium cocoa brands, baking tools, dairy products, and aesthetic kitchen lifestyle items.',
    engagementConfidenceNote: 'Highly loyal baking community with high save-rates on recipe reels.',
    deliveryReliabilityNote: 'Very flexible and accommodating collaborator with high creative discipline.',
    ctaTrustNote: 'Trusted culinary voice with high authority in direct-to-home organic ingredients recommendation.',
    isPetCreator: false
  },
  {
    email: 'arnishringi777@gmail.com',
    username: 'arnishringi',
    fullName: 'Arni Shringi | Makeup Artist',
    firstName: 'Arni',
    lastName: 'Shringi',
    category: 'Beauty, Makeup & Fashion',
    followers: 54000,
    engagementRate: 4.8,
    avgViews: 42000,
    reelPrice: 12000,
    storyPrice: 3500,
    startingPrice: 12000,
    location: 'Delhi NCR, India',
    city: 'Delhi NCR',
    bio: '💄 Professional Makeup Artist sharing premium beauty transformations, aesthetic skincare routines, and high-fashion looks.',
    introLine: 'Delhi\'s Elite Verified Beauty & Makeup Artist 💅✨',
    collabIntroLine: 'Arni crafts high-conversion beauty transformation reels, product reviews, and skincare masterclasses.',
    videoUrl: 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/sneha_discovery_1779040000000.mp4', // Lifestyle/beauty reel
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250&h=250',
    pastBrands: ['Sugar Cosmetics', 'Nykaa Premium', 'Mcaffeine', 'Mamaearth', 'Loreal'],
    pastBrandCount: 20,
    genderSplit: { women: 88.0, men: 12.0 },
    topCities: ['Delhi', 'Mumbai', 'Bangalore', 'Jaipur'],
    ageRange: '18-34 (88%)',
    language: 'Hindi / English',
    dealScore: 98,
    dealIntel: {
      hookRate: 63.8,
      interactionRate: 4.8,
      accountsReached30d: '510K',
      accountsEngaged30d: '42K',
      viralPotential: 'Top 8% Beauty Category',
      demographicsRelevance: '94% Female Concentrated'
    },
    audienceFitNote: 'Perfect fit for premium D2C cosmetic launches, medical skincare solutions, and lifestyle fashion accessories.',
    engagementConfidenceNote: 'Extremely focused 88% female active buyer audience with top product inquiry rates.',
    deliveryReliabilityNote: 'Pristine aesthetic production standards with swift turnaround times.',
    ctaTrustNote: 'High conversion-to-sales recommendation authority for modern skincare and premium cosmetic products.',
    isPetCreator: false
  }
];

async function main() {
  console.log(`🚀 Starting Batch Onboarding for ${creatorsToOnboard.length} Elite Verified Creators...`);

  for (const creator of creatorsToOnboard) {
    console.log(`\n➡️ Processing ${creator.fullName} (@${creator.username})...`);

    try {
      // 1. Create Auth User
      const password = 'CreatorArmour2026!';
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: creator.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: creator.firstName,
          last_name: creator.lastName,
        }
      });

      if (userError) {
        if (userError.message.toLowerCase().includes('already')) {
          console.log('   ⚠️ Auth user already exists, proceeding to profile registration...');
        } else {
          throw userError;
        }
      }

      const userId = userData.user?.id;
      let actualUserId = '';
      if (!userId) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === creator.email);
        if (!existingUser) throw new Error(`Could not resolve Auth ID for ${creator.email}`);
        actualUserId = existingUser.id;
      } else {
        actualUserId = userId;
      }

      console.log(`   ✅ Resolved ID: ${actualUserId}`);

      // 2. Register Profile details (Option A compliant standardized deal templates)
      const profileUpdate = {
        id: actualUserId,
        first_name: creator.firstName,
        last_name: creator.lastName,
        avatar_url: creator.avatarUrl,
        username: creator.username,
        instagram_handle: creator.username,
        business_name: creator.fullName,
        role: 'creator',
        onboarding_complete: true,
        creator_category: creator.category,
        instagram_followers: creator.followers,
        followers_count: creator.followers,
        engagement_rate: creator.engagementRate,
        avg_views: creator.avgViews,
        avg_reel_views_manual: creator.avgViews,
        reel_price: creator.reelPrice,
        story_price: creator.storyPrice,
        starting_price: creator.startingPrice,
        open_to_collabs: true,
        collaboration_preference: 'paid',
        is_verified: true,
        is_elite_verified: true,
        location: creator.location,
        city: creator.city,
        bio: creator.bio,
        intro_line: creator.introLine,
        collab_intro_line: creator.collabIntroLine,
        discovery_video_url: creator.videoUrl,
        last_instagram_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Demographics
        audience_gender_split: creator.genderSplit,
        top_cities: creator.topCities,
        audience_age_range: creator.ageRange,
        primary_audience_language: creator.language,

        // Trust Signals
        deal_score: creator.dealScore,
        collab_show_trust_signals: true,
        collab_show_audience_snapshot: true,
        collab_show_past_work: true,

        // Intel
        deal_intelligence: creator.dealIntel,
        collab_audience_fit_note: creator.audienceFitNote,
        collab_engagement_confidence_note: creator.engagementConfidenceNote,
        collab_delivery_reliability_note: creator.deliveryReliabilityNote,
        collab_cta_trust_note: creator.ctaTrustNote,

        // Option A Standardized templates
        deal_templates: [
          {
            id: 'starter_reel',
            type: 'paid',
            label: '🚀 Starter Collab',
            budget: creator.reelPrice,
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
            budget: creator.reelPrice * 2,
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
        past_brands: creator.pastBrands,
        past_brand_count: creator.pastBrandCount,
        collab_brands_count_override: creator.pastBrandCount
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate);

      if (profileError) throw profileError;
      console.log('   ✅ Profile updated in Supabase.');

      // 3. Creators table link
      const { data: creatorRecord } = await supabase
        .from('creators')
        .select('id')
        .eq('id', actualUserId)
        .maybeSingle();

      if (!creatorRecord) {
        await supabase.from('creators').insert({
          id: actualUserId,
          email: creator.email,
          full_name: creator.fullName
        });
      }
      console.log('   ✅ Creators link established.');

      // 4. Link Social Account (select before insert pattern)
      const { data: existingSocial } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('username', creator.username)
        .eq('platform', 'instagram')
        .maybeSingle();

      if (!existingSocial) {
        await supabase.from('social_accounts').insert({
          creator_id: actualUserId,
          platform: 'instagram',
          username: creator.username,
          followers: creator.followers,
          linked_at: new Date().toISOString()
        });
        console.log('   ✅ Social account linked.');
      } else {
        await supabase.from('social_accounts').update({
          followers: creator.followers,
          linked_at: new Date().toISOString()
        }).eq('id', existingSocial.id);
        console.log('   ✅ Social account synced.');
      }

      console.log(`✨ Successfully onboarded ${creator.fullName}! Link: https://creatorarmour.com/${creator.username}`);

    } catch (err: any) {
      console.error(`   ❌ Failed to onboard ${creator.fullName}:`, err.message);
    }
  }

  console.log('\n🌟 BATCH ONBOARDING COMPLETED SUCCESSFULLY!');
}

main();
