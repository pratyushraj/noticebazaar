
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const path = require('path');

const supabaseUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c';
const supabase = createClient(supabaseUrl, supabaseKey);

const creatorId = 'b2919d2e-bfb2-4ab0-af24-1749df80a58b';
const username = 'thegurgaonfoodie';

const profilePicUrl = 'https://instagram.fixr3-1.fna.fbcdn.net/v/t51.82787-19/587364893_18347344519201507_7255511375499619201_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fixr3-1.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2gFYlfhnWbxUHE-SFBpY2x0FHtbjkKXJJUB9NDZMMKp3XQVYDNyE0o2-LNjInkXT46GjuFC3Bg8YBDzijjJuI7ki&_nc_ohc=l_5PiTUFvhQQ7kNvwGdM_Re&_nc_gid=cAnS0yuvCkRsRTJ-0L2BwQ&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af7jNpVALP8p8XwsUNTj8dP4mp7vlsmOQvUZ4suS8RE-eg&oe=6A0A0EA6&_nc_sid=7a9f4b';

const reelMp4Url = 'https://instagram.fixr3-1.fna.fbcdn.net/o1/v/t2/f2/m367/AQOx1NViUvqi94wR-9ASnhBsppAFGvyBnQ_fpKOjR8-9Ipslv3i031PT1bmBQyKJR3PTPbVKc0EbmrFlvTOKkFavUDLtTfvHn-zDCoHC8E4wOg.mp4?_nc_cat=111&_nc_oc=AdrdSJbQCiB9lNJRSZNGrYi0NSRNFdPZu4AC_khWOqBz-IxrAtkZWF8I4avdqPXVtUaNkHRiJ-sOR4BPua4H3wC3&_nc_sid=9ca052&_nc_ht=instagram.fixr3-1.fna.fbcdn.net&_nc_ohc=D_T8oOg0zBUQ7kNvwGMWQTw&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmNsaXBzLmMyLUMzLmRhc2hfdnA5LWJhc2ljLWdlbjJfMTA4MHAiLCJ2aWRlb19pZCI6bnVsbCwib2lsX3VybGdlbl9hcHBfaWQiOjkzNjYxOTc0MzM5MjQ1OSwiY2xpZW50X25hbWUiOiJpZyIsInhwdl9hc3NldF9pZCI6OTcyMDU4NDIyMDMyOTQxLCJhc3NldF9hZ2VfZGF5cyI6MSwidmlfdXNlY2FzZV9pZCI6MTA4MjcsImR1cmF0aW9uX3MiOjMyLCJiaXRyYXRlIjoyNTA4Nzk3LCJ1cmxnZW5fc291cmNlIjoid3d3In0%3D&ccb=17-1&_nc_gid=mrv-ScRntxCEFf_6Y5R-NA&_nc_ss=7a22e&_nc_zt=28&oh=00_Af4UaM72dLCF0lg_hOfddTI5yqkMIdr09zSdaTFKMoqUDg&oe=6A0A2B31';

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
    const picPath = path.join(__dirname, 'temp_dp.jpg');
    const videoPath = path.join(__dirname, 'temp_video.mp4');

    console.log('Downloading assets...');
    await downloadFile(profilePicUrl, picPath);
    await downloadFile(reelMp4Url, videoPath);

    console.log('Uploading to Supabase...');
    const picUrl = await uploadToSupabase(picPath, 'creator-assets', `${creatorId}/avatar_v2.jpg`);
    const videoUrl = await uploadToSupabase(videoPath, 'creator-assets', `${creatorId}/videos/discovery_v2.mp4`);

    console.log('Updating profile...');
    const { error } = await supabase.from('profiles').update({
      avatar_url: picUrl,
      discovery_card_image: picUrl,
      discovery_video_url: videoUrl,
      instagram_profile_photo: picUrl,
      followers_count: 11300,
      instagram_followers: 11300,
      onboarding_complete: true
    }).eq('id', creatorId);

    if (error) throw error;

    console.log('Successfully updated Ritika profile with native assets!');
    console.log('Avatar URL:', picUrl);
    console.log('Video URL:', videoUrl);

    // Clean up
    fs.unlinkSync(picPath);
    fs.unlinkSync(videoPath);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
