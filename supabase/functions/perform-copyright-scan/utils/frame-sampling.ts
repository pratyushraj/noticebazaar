// Frame Sampling Implementation
// Extracts frames from video at specified intervals (1s, 2s, 5s)

import { generatePerceptualHash } from './perceptual-hash.ts';

export interface FrameSample {
  timestamp: number; // Seconds
  frameHash: string; // pHash
  thumbnail: Uint8Array; // Frame image data
}

/**
 * Extract frames from video at specified intervals
 */
export async function extractFrameSamples(
  videoUrl: string,
  intervals: number[] = [1, 2, 5] // Extract at 1s, 2s, 5s, etc.
): Promise<FrameSample[]> {
  // TODO: Implement actual frame extraction using FFmpeg
  // FFmpeg command: ffmpeg -i video.mp4 -vf "select='not(mod(t,1))'" -vsync vfr frames/frame_%03d.png
  
  console.log(`Extracting frames from ${videoUrl} at intervals: ${intervals.join(', ')}s`);
  
  const samples: FrameSample[] = [];
  
  // Mock: Generate samples for each interval
  // In production, this would:
  // 1. Use FFmpeg to extract frames at specified timestamps
  // 2. Generate pHash for each frame
  // 3. Store thumbnails
  
  for (const interval of intervals) {
    for (let t = 0; t < 60; t += interval) { // Sample up to 60 seconds
      const frameData = new Uint8Array(100); // Mock frame data
      const frameHash = await generatePerceptualHash(frameData);
      
      samples.push({
        timestamp: t,
        frameHash,
        thumbnail: frameData,
      });
    }
  }
  
  return samples;
}

/**
 * Compare frame samples between original and candidate video
 * Returns similarity score based on frame hash matches
 */
export function compareFrameSamples(
  original: FrameSample[],
  candidate: FrameSample[]
): number {
  if (original.length === 0 || candidate.length === 0) return 0;
  
  // Match frames by timestamp proximity
  let totalSimilarity = 0;
  let matches = 0;
  
  for (const origFrame of original) {
    // Find closest timestamp in candidate
    let bestMatch = 0;
    let bestTimestampDiff = Infinity;
    
    for (const candFrame of candidate) {
      const timestampDiff = Math.abs(origFrame.timestamp - candFrame.timestamp);
      if (timestampDiff < bestTimestampDiff) {
        bestTimestampDiff = timestampDiff;
        // Compare hashes (Hamming distance)
        const similarity = compareHashes(origFrame.frameHash, candFrame.frameHash);
        bestMatch = similarity;
      }
    }
    
    if (bestTimestampDiff <= 2) { // Only count if within 2 seconds
      totalSimilarity += bestMatch;
      matches++;
    }
  }
  
  return matches > 0 ? totalSimilarity / matches : 0;
}

/**
 * Compare two hash strings using Hamming distance
 */
function compareHashes(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 0;
  
  let differences = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) differences++;
  }
  
  return 1 - (differences / hash1.length);
}

/**
 * Extract frames at multiple intervals and combine results
 */
export async function extractMultiIntervalFrames(
  videoUrl: string,
  intervals: number[]
): Promise<Record<number, FrameSample[]>> {
  const results: Record<number, FrameSample[]> = {};
  
  for (const interval of intervals) {
    const samples = await extractFrameSamples(videoUrl, [interval]);
    results[interval] = samples;
  }
  
  return results;
}

