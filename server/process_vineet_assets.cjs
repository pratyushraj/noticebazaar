const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const username = '_cookingwithvineet';
const reelUrl = 'https://www.instagram.com/reel/DYZHGJoRnrj/';
const tempDir = path.join(__dirname, 'temp_vineet');

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

async function processAssets() {
  console.log('Downloading discovery reel...');
  const rawPath = path.join(tempDir, 'raw_reel.mp4');
  const normalizedPath = path.join(tempDir, 'discovery.mp4');

  try {
    // 1. Download and merge
    console.log('Downloading and merging reel...');
    execSync(`yt-dlp --ffmpeg-location /opt/homebrew/bin/ffmpeg -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" "${reelUrl}" -o "${rawPath}"`);

    // 2. Transcode to H.264 Main 3.1 with faststart
    console.log('Normalizing video format...');
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${rawPath}" -c:v libx264 -profile:v main -level:v 3.1 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k "${normalizedPath}"`);

    console.log('✅ Asset normalization complete.');
    console.log(`Path: ${normalizedPath}`);
  } catch (err) {
    console.error('Error processing assets:', err);
  }
}

processAssets();
