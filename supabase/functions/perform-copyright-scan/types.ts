// Advanced Copyright Scanner Types

export interface PerceptualHash {
  keyframes: string[]; // pHash for each keyframe
  ocrText: string[]; // Extracted text from frames
  faceRecognition: FaceMatch[]; // Detected faces
  motionVectors: MotionVector[]; // Motion analysis
}

export interface FaceMatch {
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  embedding?: number[]; // Face embedding vector
}

export interface MotionVector {
  frameIndex: number;
  direction: number; // Angle in degrees
  magnitude: number;
}

export interface AudioFingerprint {
  chromaprint: string; // Chromaprint hash
  spectrogram: number[][]; // Spectrogram data
  whisperEmbedding: number[]; // Whisper audio embedding
  duration: number;
}

export interface FrameSample {
  timestamp: number; // Seconds
  frameHash: string; // pHash
  thumbnail: Uint8Array; // Frame image data
}

export interface VideoAnalysis {
  frameSamples: FrameSample[]; // Sampled at 1s, 2s, 5s intervals
  audioFingerprint?: AudioFingerprint;
  perceptualHash: PerceptualHash;
}

export interface AIEmbedding {
  semantic: number[]; // Semantic similarity embedding
  commentary: number; // Commentary detection score (0-1)
  remix: number; // Remix detection score (0-1)
  provider: 'gemini' | 'openai';
}

export interface AdvancedSimilarityScore {
  perceptualHash: number; // 0-1
  audioFingerprint: number; // 0-1 (if audio available)
  frameSampling: number; // 0-1
  aiEmbedding: number; // 0-1
  overall: number; // Weighted overall score
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
}

export interface PlatformScraperResult {
  url: string;
  platform: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
  audioUrl?: string;
  uploader: string;
  uploadDate: string;
  viewCount?: number;
  metadata: Record<string, any>;
}

export interface CopyrightScanAlert {
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
  similarity_score?: number; // 0-1 scale (legacy)
  advanced_similarity?: AdvancedSimilarityScore; // PRO-level analysis
  screenshot_url?: string | null;
  videoAnalysis?: VideoAnalysis;
  aiEmbedding?: AIEmbedding;
}

export interface PerformCopyrightScanRequest {
  query: string;
  platforms: string[];
  advancedOptions?: {
    includeScreenshotSimilarity?: boolean;
    includeAudioFingerprinting?: boolean;
    scanFullWeb?: boolean;
    enablePerceptualHash?: boolean;
    enableFrameSampling?: boolean;
    enableAIEmbeddings?: boolean;
    frameIntervals?: number[]; // [1, 2, 5] seconds
  };
}

export interface PerformCopyrightScanResponse {
  alerts: CopyrightScanAlert[];
  scanMetadata?: {
    totalPlatformsScanned: number;
    totalContentAnalyzed: number;
    analysisTime: number; // milliseconds
    featuresUsed: string[];
  };
}

