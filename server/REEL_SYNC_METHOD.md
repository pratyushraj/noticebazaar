# Instagram Reel Sync Method (Native MP4)

This method allows us to bypass Instagram's restricted embed player and serve high-fidelity, autoplay-ready discovery reels directly from our CDN.

## Tool Requirements
- **yt-dlp**: Required for video extraction.
- **Supabase Service Role Key**: Required for storage uploads.

## Usage

Run the following command from the `server` directory:

```bash
npx ts-node scripts/sync_instagram_reel.ts <INSTAGRAM_REEL_URL> <CREATOR_HANDLE>
```

### Example
```bash
npx ts-node scripts/sync_instagram_reel.ts https://www.instagram.com/reel/DOs9iIID295/ souptik_manna
```

## How it works
1. **Extraction**: Uses `yt-dlp` to fetch the highest quality `.mp4` stream directly from the Instagram CDN.
2. **Persistence**: Uploads the raw video file to the `creator-discovery` bucket in Supabase storage.
3. **Database Injection**: Updates the creator's `discovery_video_url` in the `profiles` table to point to the new native URL.
4. **UI Optimization**: The frontend `<video>` tag automatically detects the `.mp4` extension and renders a high-performance, autoplaying, muted, and looping player.

## Why use this?
- **Mobile Performance**: Native videos load faster and more reliably than Instagram iframes.
- **Engagement**: Creators look more "production-ready" with seamless video headers.
- **Resilience**: Bypasses CORS and Cross-Origin Opener Policy (COOP) issues common with social media embeds.
