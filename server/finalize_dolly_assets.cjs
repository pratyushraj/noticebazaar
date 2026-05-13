
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const path = require('path');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const creatorId = 'ea993f5b-7eaa-45b0-b1fc-7623284af774';
const username = 'd_dollypatel';

const profilePicUrl = 'https://instagram.fixr3-2.fna.fbcdn.net/v/t51.2885-19/498231266_18309276607236928_3803812710643774893_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fixr3-2.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2gHvQvwwNps-X_P8CGUiwOdfqEMCg9GHdvi88ageD3-5cmOtfdfQO6QmK0G-JlU0rU5cBiMum70xINPpue7bssBx&_nc_ohc=DKif8tV2LNoQ7kNvwF7U9Tw&_nc_gid=-wPdBfi8o_PqeC0WUgvrwg&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_Af4z0D3dSNqnOV_YWzRY_Fudcoo6NbG6XpTap7HuMDM72A&oe=6A0A2F40&_nc_sid=7d3ac5';

const reelMp4Url = 'https://instagram.fixr3-2.fna.fbcdn.net/o1/v/t2/f2/m367/AQOP2DBkQbWGVyZI8DZzDnH9b0T8hfU3uXwhhxBitsP_UToOxgZYVAWIwqL9N4yJ_bDT_7oFvx3TgayIJfpNsy9LupfLVMxux_a02hU.mp4?_nc_cat=104&_nc_oc=AdrtQOiKhnlcC1ZVU4kXIwg868SPpXE2wyDWO7uK1dTg1xH_teu3D7CRUKkh-Wu2e3eY_o-vCfz2B_6o1oq3DXqM&_nc_sid=9ca052&_nc_ht=instagram.fixr3-2.fna.fbcdn.net&_nc_ohc=PJorEK4XpuAQ7kNvwHNH-Ty&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmNsaXBzLmMyLUMzLmRhc2hfcjJldmV2cDktcjFnZW4ydnA5X3E5MCIsInZpZGVvX2lkIjpudWxsLCJvaWxfdXJsZ2VuX2FwcF9pZCI6OTM2NjE5NzQzMzkyNDU5LCJjbGllbnRfbmFtZSI6ImlnIiwieHB2X2Fzc2V0X2lkIjo5NTg2MDQ3MDY3ODYwNDcsImFzc2V0X2FnZV9kYXlzIjoyLCJ2aV91c2VjYXNlX2lkIjoxMDA5OSwiZHVyYXRpb25fcyI6MTYsImJpdHJhdGUiOjI4OTM5MDUsInVybGdlbl9zb3VyY2UiOiJ3d3cifQ%3D%3D&ccb=17-1&_nc_gid=PPv_k9iNz9Sag6s9hB-g2A&_nc_ss=7a22e&_nc_zt=28&oh=00_Af61fX0pp3JKeuJrJAE2Wd-cs0h7Olc_ji4WGxW7EWT3pQ&oe=6A0A1121';

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

async function run() {
  try {
    const picPath = path.join(__dirname, 'temp_dolly_dp.jpg');
    const videoPath = path.join(__dirname, 'temp_dolly_video.mp4');

    console.log('Downloading assets for Dolly Patel...');
    await downloadFile(profilePicUrl, picPath);
    await downloadFile(reelMp4Url, videoPath);

    console.log('Uploading to Supabase...');
    const picUrl = await uploadToSupabase(picPath, 'creator-assets', `${creatorId}/avatar_v1.jpg`);
    const videoUrl = await uploadToSupabase(videoPath, 'creator-assets', `${creatorId}/discovery_v1.mp4`);

    console.log('Updating profile record...');
    const { error } = await supabase.from('profiles').update({
      avatar_url: picUrl,
      discovery_video_url: videoUrl,
      instagram_profile_photo: picUrl,
      discovery_card_image: picUrl,
      past_brands: ['Royal Rental Clothes', 'Mamaearth', 'Nykaa', 'Zomato', 'Sugar Cosmetics', 'Swiss Beauty', 'Award Show 2'],
      past_brand_count: 12,
      onboarding_complete: true,
      creator_stage: 'verified'
    }).eq('id', creatorId);

    if (error) throw error;

    console.log('Successfully finalized Dolly Patel assets!');
    
    // Clean up
    fs.unlinkSync(picPath);
    fs.unlinkSync(videoPath);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
