import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const HANDLE = 'mahekugc';
const NAME = 'Mahek';

async function setup() {
  console.log(`Setting up demo for ${HANDLE}...`);

  // 1. Create Profile
  const creatorId = 'a0c7965b-44af-4735-807b-68b4359fc58d';
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: creatorId,
      instagram_handle: HANDLE,
      username: HANDLE,
      first_name: NAME,
      role: 'creator',
      onboarding_complete: true,
      instagram_followers: 12500,
      avg_reel_views_manual: 18000,
      bio: 'UGC Creator | Fashion & Lifestyle 🌸',
      creator_category: 'Lifestyle',
      open_to_collabs: true,
      collab_intro_line: 'Hey! I create high-quality UGC reels for fashion and lifestyle brands. Open to both paid and barter collaborations.',
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error setting up profile:', profileError);
    return;
  }

  console.log('✅ Profile Created:', profile.id);
  await runDemoRequest(profile.id);
}

async function runDemoRequest(creatorId) {
    // 2. Create Demo Request
    const { data: request, error: requestError } = await supabase
        .from('collab_requests')
        .insert({
            creator_id: creatorId,
            brand_name: 'Glamour India 👗',
            brand_email: 'campaigns@glamourindia.com',
            collab_type: 'paid',
            exact_budget: 12000,
            currency: 'INR',
            status: 'pending',
            campaign_description: 'We love your style! We want to send you 2 outfits from our new collection for a transition reel.',
            deliverables: ['1x Instagram Reel', '2x Stories'],
            usage_rights: true,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            brand_logo_url: 'https://img.freepik.com/free-vector/luxury-fashion-logo-template_23-2148474251.jpg'
        })
        .select()
        .single();

    if (requestError) {
        console.error('Error creating request:', requestError);
        return;
    }

    console.log('✅ Demo Request Created:', request.id);
    console.log('\n--- DEMO READY ---');
    console.log(`Public Link: https://www.creatorarmour.com/${HANDLE}`);
    console.log(`Creator ID: ${creatorId}`);
    console.log('------------------');
}

setup();
