import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface OriginalContent {
  id: string;
  user_id: string;
  platform: string;
  original_url: string;
  watermark_text: string | null;
  created_at: string;
}

interface CopyrightMatch {
  id: string;
  scan_id: string;
  matched_url: string;
  platform: string;
  similarity_score: number;
  screenshot_url: string | null;
  created_at: string;
}

interface SearchResult {
  url: string;
  platform: string;
  hash_similarity: number;
  caption_similarity: number;
  screenshot?: Uint8Array;
}

// Stub function: Fetch original hash from content
async function fetchOriginalHash(content: OriginalContent): Promise<string> {
  // TODO: Implement actual hash fetching logic
  // For now, return a mock hash based on URL
  return `hash_${content.original_url.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// Stub function: YouTube search
async function searchYouTube(originalHash: string, originalUrl: string, watermarkText: string | null): Promise<SearchResult[]> {
  // TODO: Implement actual YouTube API search
  console.log(`[STUB] Searching YouTube for hash: ${originalHash}`);
  
  // Mock results for demonstration
  return [
    {
      url: 'https://youtube.com/watch?v=mock1',
      platform: 'youtube',
      hash_similarity: 0.85,
      caption_similarity: 0.70,
    },
  ];
}

// Stub function: TikTok search
async function searchTikTok(originalHash: string, originalUrl: string, watermarkText: string | null): Promise<SearchResult[]> {
  // TODO: Implement actual TikTok API search
  console.log(`[STUB] Searching TikTok for hash: ${originalHash}`);
  
  // Mock results for demonstration
  return [
    {
      url: 'https://tiktok.com/@user/video/mock1',
      platform: 'tiktok',
      hash_similarity: 0.80,
      caption_similarity: 0.75,
    },
  ];
}

// Stub function: Instagram scraping
async function searchInstagram(originalHash: string, originalUrl: string, watermarkText: string | null): Promise<SearchResult[]> {
  // TODO: Implement actual Instagram scraping
  console.log(`[STUB] Searching Instagram for hash: ${originalHash}`);
  
  // Mock results for demonstration
  return [
    {
      url: 'https://instagram.com/p/mock1',
      platform: 'instagram',
      hash_similarity: 0.90,
      caption_similarity: 0.65,
    },
  ];
}

// Compute similarity score: hash_similarity + caption_similarity
function computeSimilarityScore(hashSimilarity: number, captionSimilarity: number): number {
  // Weighted average: 60% hash, 40% caption
  return (hashSimilarity * 0.6) + (captionSimilarity * 0.4);
}

// Upload screenshot to Supabase storage
async function uploadScreenshot(
  supabaseAdmin: any,
  userId: string,
  contentId: string,
  matchUrl: string,
  screenshotData: Uint8Array
): Promise<string | null> {
  try {
    const bucketName = 'copyright-screenshots';
    const fileName = `${userId}/${contentId}/${Date.now()}-${matchUrl.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, screenshotData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Screenshot upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return null;
  }
}

// Generate mock screenshot data (stub)
async function generateScreenshot(url: string): Promise<Uint8Array> {
  // TODO: Implement actual screenshot generation
  // For now, return empty bytes
  return new Uint8Array(0);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Authenticate user via JWT from request headers
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get User ID from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // 2. Fetch rows from original_content where user_id = user.id
    const { data: originalContentList, error: fetchError } = await supabaseAdmin
      .from('original_content')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching original content:', fetchError);
      throw new Error(`Failed to fetch original content: ${fetchError.message}`);
    }

    if (!originalContentList || originalContentList.length === 0) {
      return new Response(JSON.stringify({ 
        found: 0, 
        matches: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const allMatches: CopyrightMatch[] = [];
    let totalMatches = 0;

    // 3. For each row in original_content
    for (const content of originalContentList as OriginalContent[]) {
      try {
        // Create a scan record for this content
        const { data: scanData, error: scanError } = await supabaseAdmin
          .from('copyright_scans')
          .insert({ 
            content_id: content.id, 
            scan_status: 'pending' 
          })
          .select('id')
          .single();

        if (scanError) {
          console.error(`Error creating scan for content ${content.id}:`, scanError);
          continue; // Skip this content and continue with next
        }

        const scanId = scanData.id;

        // Fetch original hash
        const originalHash = await fetchOriginalHash(content);

        // Run searches on different platforms
        const searchResults: SearchResult[] = [];

        // YouTube search
        try {
          const youtubeResults = await searchYouTube(originalHash, content.original_url, content.watermark_text);
          searchResults.push(...youtubeResults);
        } catch (error) {
          console.error(`Error searching YouTube for content ${content.id}:`, error);
        }

        // TikTok search
        try {
          const tiktokResults = await searchTikTok(originalHash, content.original_url, content.watermark_text);
          searchResults.push(...tiktokResults);
        } catch (error) {
          console.error(`Error searching TikTok for content ${content.id}:`, error);
        }

        // Instagram search
        try {
          const instagramResults = await searchInstagram(originalHash, content.original_url, content.watermark_text);
          searchResults.push(...instagramResults);
        } catch (error) {
          console.error(`Error searching Instagram for content ${content.id}:`, error);
        }

        // Process each search result
        for (const result of searchResults) {
          // Compute similarity score
          const similarityScore = computeSimilarityScore(
            result.hash_similarity,
            result.caption_similarity
          );

          // If score >= 0.75, create copyright_match
          if (similarityScore >= 0.75) {
            // Generate screenshot (stub)
            const screenshotData = await generateScreenshot(result.url);
            
            // Upload screenshot to storage
            let screenshotUrl: string | null = null;
            if (screenshotData.length > 0) {
              screenshotUrl = await uploadScreenshot(
                supabaseAdmin,
                userId,
                content.id,
                result.url,
                screenshotData
              );
            }

            // Create copyright_match row
            const { data: matchData, error: matchError } = await supabaseAdmin
              .from('copyright_matches')
              .insert({
                scan_id: scanId,
                matched_url: result.url,
                platform: result.platform,
                similarity_score: similarityScore,
                screenshot_url: screenshotUrl,
              })
              .select()
              .single();

            if (matchError) {
              console.error(`Error creating copyright match for ${result.url}:`, matchError);
              continue;
            }

            allMatches.push(matchData as CopyrightMatch);
            totalMatches++;
          }
        }

        // Update scan status to completed
        await supabaseAdmin
          .from('copyright_scans')
          .update({ scan_status: 'completed' })
          .eq('id', scanId);

      } catch (error) {
        console.error(`Error processing content ${content.id}:`, error);
        // Continue with next content
        continue;
      }
    }

    // 4. Return JSON response
    return new Response(JSON.stringify({
      found: totalMatches,
      matches: allMatches,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // 6. Handle errors gracefully and log them
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Scan Copyright Error:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

