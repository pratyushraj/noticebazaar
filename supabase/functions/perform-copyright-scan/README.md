# PRO-Level Copyright Scanner

A world-class copyright detection system implementing perceptual hashing, audio fingerprinting, frame sampling, platform scrapers, and AI embeddings.

## Features

### ✅ 1. Perceptual Hash (pHash)
- **Keyframes**: Extracts and compares keyframes from videos
- **OCR Text**: Extracts text from frames for watermark/brand detection
- **Face Recognition**: Detects and compares faces using embeddings
- **Motion Vectors**: Analyzes motion patterns for video comparison

### ✅ 2. Audio Fingerprinting
- **Chromaprint**: Industry-standard audio fingerprinting
- **Spectrogram Comparison**: Frequency-domain analysis
- **Whisper Embeddings**: Semantic audio understanding

### ✅ 3. Frame Sampling
- Extracts frames at configurable intervals (1s, 2s, 5s)
- Generates perceptual hashes for each frame
- Compares frame sequences for video matching

### ✅ 4. Platform-Specific Scrapers
- **TikTok**: Scrapes TikTok for matching content
- **Instagram**: Instagram post/video search
- **Facebook**: Facebook video scraping
- **BiliBili**: Chinese video platform support
- **ShareChat**: Indian social media platform
- **Moj**: Indian short video platform

### ✅ 5. AI Embeddings
- **Semantic Similarity**: Uses OpenAI/Gemini for text understanding
- **Commentary Detection**: Identifies transformative vs. direct copies
- **Remix Detection**: Detects remixes and adaptations

## Architecture

```
perform-copyright-scan/
├── index.ts                    # Main Edge Function
├── types.ts                    # TypeScript type definitions
├── utils/
│   ├── perceptual-hash.ts      # pHash, OCR, face recognition, motion vectors
│   ├── audio-fingerprint.ts   # Chromaprint, spectrogram, Whisper
│   ├── frame-sampling.ts       # Frame extraction and comparison
│   ├── platform-scrapers.ts    # Platform-specific scraping
│   └── ai-embeddings.ts        # OpenAI/Gemini integration
└── README.md                   # This file
```

## API

### Request
```typescript
{
  query: string;                    // Content URL or description
  platforms: string[];             // Platforms to scan
  advancedOptions?: {
    includeScreenshotSimilarity?: boolean;
    includeAudioFingerprinting?: boolean;
    scanFullWeb?: boolean;
    enablePerceptualHash?: boolean;    // Default: true
    enableFrameSampling?: boolean;      // Default: true
    enableAIEmbeddings?: boolean;      // Default: true
    frameIntervals?: number[];         // Default: [1, 2, 5] seconds
  };
}
```

### Response
```typescript
{
  alerts: CopyrightScanAlert[];
  scanMetadata?: {
    totalPlatformsScanned: number;
    totalContentAnalyzed: number;
    analysisTime: number;          // milliseconds
    featuresUsed: string[];
  };
}
```

### CopyrightScanAlert
```typescript
{
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
  similarity_score?: number;       // Legacy 0-1 score
  advanced_similarity?: {          // PRO-level breakdown
    perceptualHash: number;
    audioFingerprint: number;
    frameSampling: number;
    aiEmbedding: number;
    overall: number;
    breakdown: {
      keyframes: number;
      ocr: number;
      faces: number;
      motion: number;
      audio: number;
      frames: number;
      semantic: number;
      commentary: number;
      remix: number;
    };
  };
  screenshot_url?: string;
  aiEmbedding?: {
    semantic: number[];
    commentary: number;
    remix: number;
    provider: 'gemini' | 'openai';
  };
}
```

## Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key

Optional (for AI features):
- `OPENAI_API_KEY`: For OpenAI embeddings and analysis
- `GEMINI_API_KEY`: For Google Gemini embeddings

## Similarity Score Calculation

The PRO-level similarity score uses weighted averages:

```
overall = (
  perceptualHash * 0.3 +
  audioFingerprint * 0.25 +
  frameSampling * 0.25 +
  aiEmbedding * 0.2
)
```

### Perceptual Hash Breakdown
```
perceptualHash = (
  keyframes * 0.4 +
  ocr * 0.2 +
  faces * 0.2 +
  motion * 0.2
)
```

### Audio Fingerprint Breakdown
```
audioFingerprint = (
  chromaprint * 0.5 +
  spectrogram * 0.3 +
  whisper * 0.2
)
```

## Implementation Status

### ✅ Implemented (Mock/Stub)
- All utility modules created with mock implementations
- Type definitions complete
- Main function integrates all features
- Response structure supports PRO features

### 🔄 TODO (Production Implementation)
1. **Perceptual Hash**:
   - Integrate FFmpeg for keyframe extraction
   - Add Tesseract.js or Google Vision API for OCR
   - Integrate face-api.js or Google Vision for face detection
   - Implement actual dHash algorithm

2. **Audio Fingerprinting**:
   - Integrate FFmpeg with chromaprint plugin
   - Implement FFT-based spectrogram generation
   - Integrate OpenAI Whisper API or local model

3. **Frame Sampling**:
   - Use FFmpeg to extract frames at intervals
   - Store frame thumbnails in Supabase Storage

4. **Platform Scrapers**:
   - Implement actual web scraping (respect robots.txt)
   - Add rate limiting and error handling
   - Handle authentication where required
   - Consider using official APIs where available

5. **AI Embeddings**:
   - Already integrated with OpenAI/Gemini APIs
   - Add caching for embeddings
   - Optimize API calls

## Deployment

```bash
npx supabase functions deploy perform-copyright-scan
```

## Testing

The function currently returns mock data for demonstration. To test with real data:

1. Set up environment variables
2. Implement actual scraping/analysis functions
3. Test with real video URLs

## Performance Considerations

- Frame sampling can be CPU-intensive
- AI embeddings require API calls (rate limits apply)
- Platform scraping should be rate-limited
- Consider caching results for repeated queries

## Legal & Ethical Considerations

- Respect platform Terms of Service
- Implement rate limiting
- Handle user privacy appropriately
- Consider fair use and transformative content
- Provide transparency in similarity scores

