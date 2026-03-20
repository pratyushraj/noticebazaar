/**
 * TypeScript types for scan-copyright Edge Function
 */

export interface OriginalContent {
  id: string;
  user_id: string;
  platform: string;
  original_url: string;
  watermark_text: string | null;
  created_at: string;
}

export interface CopyrightMatch {
  id: string;
  scan_id: string;
  matched_url: string;
  platform: string;
  similarity_score: number;
  screenshot_url: string | null;
  created_at: string;
}

export interface CopyrightScan {
  id: string;
  content_id: string;
  scan_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface SearchResult {
  url: string;
  platform: string;
  hash_similarity: number;
  caption_similarity: number;
  screenshot?: Uint8Array;
}

export interface ScanCopyrightResponse {
  found: number;
  matches: CopyrightMatch[];
}

export interface ScanCopyrightError {
  error: string;
  message?: string;
}

