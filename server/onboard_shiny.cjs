
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const path = require('path');
const crypto = require('crypto');

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';
const supabase = createClient(supabaseUrl, supabaseKey);

const creatorId = '3ae63bd0-e512-4ea8-8167-75edf080c1dd'; // Using existing spare ID
const username = 'shinyyy.05';
const fullName = 'Shiny Jain';
const email = 'shinyjain0597@gmail.com';
const location = 'Indore';

const profilePicUrl = 'https://instagram.fixr3-1.fna.fbcdn.net/v/t51.82787-19/621748093_18069735194575800_641735548915797345_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fixr3-1.fna.fbcdn.net&_nc_cat=100&_nc_oc=Q6cZ2gEqflCc1xXSQarGZ2AMzHH6ySH_Dflvacq5QhXzV0TiOM1OMqASS48IxC17fJTKuItOdQJPWXr54ydauSc0uzSJ&_nc_ohc=5O3itipgJnsQ7kNvwF1Sfka&_nc_gid=a6JfViKkl0oJ1SPktoKTCQ&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af6J3bANASq3toXGErXibfX8vkNz3yM_ukCYBHj9oszR2A&oe=6A0A2508&_nc_sid=7a9f4b';

const reelMp4Url = 'https://instagram.fixr3-2.fna.fbcdn.net/o1/v/t2/f2/m367/AQNbvL3aLMumo0yGYHrhWfSEoFE6OKVwArQGSqE_WjE0GD7-QrAqsjPZ0D0a7MGnaiWrEjbNwaKDRTbnozd8TTqJWOSuS9g6RTfs88g.mp4?_nc_cat=108&_nc_oc=AdoFMb0zPMSs40HiK54o0h1ZZbs9Vgv44-vYyzBSk5M89bF3iSgXB0FPdgEPM6eFro2oUoPYQX04p-xnbr2iX_3c&_nc_sid=9ca052&_nc_ht=instagram.fixr3-2.fna.fbcdn.net&_nc_ohc=DI0EvmsDwQ8Q7kNvwGZ0fxR&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmNsaXBzLmMyLUMzLmRhc2hfdnA5LWJhc2ljLWdlbjItaGZyXzEwODBwIiwidmlkZW9faWQiOm51bGwsIm9pbF91cmxnZW5fYXBwX2lkIjo5MzY2MTk3NDMzOTI0NTksImNsaWVudF9uYW1lIjoiaWciLCJ4cHZfYXNzZXRfaWQiOjIxMjI0MTI5NTg1NDEzMTYsImFzc2V0X2FnZV9kYXlzIjoxLCJ2aV91c2VjYXNlX2lkIjoxMDA5OSwiZHVyYXRpb25fcyI6NDMsImJpdHJhdGUiOjQ1NDQxMjgsInVybGdlbl9zb3VyY2UiOiJ3d3cifQ%3D%3D&ccb=17-1&_nc_gid=d2MVNleiBgaSsjUmR0rXhw&_nc_ss=7a22e&_nc_zt=28&oh=00_Af5tE4LshjsAYN8PycY9T3qC7vDrKYOc2ZiQ4p1Prow2mA&oe=6A0A1F1D';

const portfolioImageUrls = [
  'https://instagram.fixr3-1.fna.fbcdn.net/v/t51.82787-15/517491972_18047970932575800_4240253416468074181_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=MzY3MDg5MTk1MDgxNTMzNzE0Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=QNbZSbo4q9UQ7kNvwFUWJP1&_nc_oc=AdrFX8FlP9BbVreDUuOFtavgrJ4ZJ8cjMmgE1oXjUi_-l842Xf8hrTGBmfsPPeF_Qc0bpsGpoUMPjjtbGxFasp72&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fixr3-1.fna&_nc_gid=a6JfViKkl0oJ1SPktoKTCQ&_nc_ss=7a22e&oh=00_Af7vwHaH8EqquXYGkvXx-6WdTSdfUcMgqN_QsAXBxt7fng&oe=6A0A1EAD',
  'https://instagram.fixr3-3.fna.fbcdn.net/v/t51.75761-15/489960131_18038383769575800_8104380602422332513_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzYwNjAxMDkwODg5MzkzNTQ1OA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=M0MON2Zwzu0Q7kNvwGzRZiN&_nc_oc=AdpL-Ia-Rg8yVPTZ-XfroLO4i-a3JNR9eo_xCSP8xdqtTR4dbVQslYn2Rsxx2EB3PjTwBesXg85FtviZ9bS1yEnh&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fixr3-3.fna&_nc_gid=a6JfViKkl0oJ1SPktoKTCQ&_nc_ss=7a22e&oh=00_Af4eQVrUJVeWgfN8TaKp-z_EjLFFxePFoAUsMO87iDM-7w&oe=6A0A1215',
  'https://instagram.fixr3-3.fna.fbcdn.net/v/t51.75761-15/491329870_18039481988575800_2608298338491671416_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ig_cache_key=MzYxMzk2MzY0NDQ1MzE2MjkyOA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=kDj1Om8M5VkQ7kNvwGXESQd&_nc_oc=AdqxN81rJOTqAGVlwIN1AcDt3eg8cA8q518tUkUThBFhhuAvK6Nz5UxNe_0zgxbxH9t9UjgXLS5WkSyTTKdS1cke&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fixr3-3.fna&_nc_gid=a6JfViKkl0oJ1SPktoKTCQ&_nc_ss=7a22e&oh=00_Af4lRnYAvflk5qv6r2nV-S3DD6igQiMN_8teqcdLcr85rQ&oe=6A09FDA3'
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function uploadToSupabase(filePath, bucket, storagePath) {
  const fileContent = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileContent, {
      contentType: filePath.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
      upsert: true
    });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

const dealTemplates = [
  {
    id: 'starter-collab',
    label: '🚀 Starter Collab',
    budget: 8500,
    description: 'Perfect for first-time brand awareness & organic reach.',
    deliverables: [
      '1 Reel (15-30s)',
      'Organic reach focus',
      '1 Revision included'
    ]
  },
  {
    id: 'growth-campaign',
    label: '⭐ Growth Campaign',
    budget: 13500,
    description: 'Best for brands wanting ads usage + conversions.',
    deliverables: [
      '1 Premium Reel (30-60s)',
      '30-day usage rights (for ads)',
      'Script + hook optimization',
      '2 Story shoutouts',
      '1 Revision included'
    ],
    isPopular: true
  }
];

async function run() {
  try {
    const picPath = path.join(__dirname, 'temp_shiny_dp.jpg');
    const videoPath = path.join(__dirname, 'temp_shiny_video.mp4');

    console.log('Downloading assets for Shiny Jain...');
    await downloadFile(profilePicUrl, picPath);
    await downloadFile(reelMp4Url, videoPath);

    console.log('Uploading to Supabase...');
    const picUrl = await uploadToSupabase(picPath, 'creator-assets', `${creatorId}/avatar_v3.jpg`);
    const videoUrl = await uploadToSupabase(videoPath, 'creator-assets', `${creatorId}/videos/discovery_v3.mp4`);

    const portfolioUrls = [];
    console.log('Processing portfolio items...');
    for (let i = 0; i < portfolioImageUrls.length; i++) {
      const pPath = path.join(__dirname, `temp_portfolio_${i}.jpg`);
      await downloadFile(portfolioImageUrls[i], pPath);
      const pUrl = await uploadToSupabase(pPath, 'creator-assets', `${creatorId}/portfolio/item_${i}.jpg`);
      portfolioUrls.push(pUrl);
    }

    const collabPastWorkItems = [
      {
        id: 'fashion-showcase',
        sourceUrl: videoUrl,
        posterUrl: portfolioUrls[0],
        title: 'Trendy Dresses Fashion Showcase',
        mediaType: 'video',
        platform: 'instagram',
        brand: 'The Shiny Stuff',
        campaignType: 'Organic Content',
        outcome: 'High Reach'
      },
      {
        id: 'aesthetic-shoot',
        sourceUrl: portfolioUrls[1],
        title: 'Aesthetic Pinned Shoot',
        mediaType: 'image',
        platform: 'instagram',
        brand: 'The Shiny Stuff'
      },
      {
        id: 'lifestyle-vlog',
        sourceUrl: portfolioUrls[2],
        title: 'Lifestyle Storytelling',
        mediaType: 'image',
        platform: 'instagram',
        brand: 'The Shiny Stuff'
      }
    ];

    console.log('Upserting profile record...');
    const { error } = await supabase.from('profiles').upsert({
      id: creatorId,
      username: username,
      first_name: 'Shiny',
      last_name: 'Jain',
      location: location,
      avatar_url: picUrl,
      discovery_card_image: picUrl,
      discovery_video_url: videoUrl,
      instagram_profile_photo: picUrl,
      deal_templates: dealTemplates,
      followers_count: 49000,
      instagram_followers: 49000,
      avg_views: 45000,
      avg_reel_views_manual: 45000,
      engagement_rate: 5.2,
      onboarding_complete: true,
      bio: 'Dressing well and dining better | Fashion and food fusion | 📍 Indore',
      creator_category: 'Fashion & Food',
      content_niches: ['Fashion', 'Food', 'Lifestyle'],
      past_brands: ['KDM India', 'Zomato', 'District', 'Sayaji Hotel', 'Poojara', 'Moon Beam', 'Keer Jewellery'],
      past_brand_count: 24,
      instagram_handle: username,
      is_verified: true,
      is_featured: true,
      deal_score: 92,
      top_cities: ['Indore', 'Bhopal', 'Delhi', 'Mumbai'],
      audience_gender_split: { men: 40, women: 60 },
      collab_intro_line: 'Premium Fashion & Food Creator from Indore | 1.4M+ Reach | Verified partner for Zomato, KDM, and more.',
      role: 'creator',
      last_active_at: new Date().toISOString(),
      ugc_capabilities: ['Fashion Styling', 'Food Reviews', 'Cafe Vlogs'],
      collab_show_past_work: true,
      collab_past_work_items: collabPastWorkItems
    });

    if (error) throw error;

    console.log('Successfully onboarded Shiny Jain!');
    console.log('Profile URL: https://www.creatorarmour.com/' + username);

    // Clean up
    fs.unlinkSync(picPath);
    fs.unlinkSync(videoPath);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
