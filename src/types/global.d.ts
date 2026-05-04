// ============================================================
// GLOBAL TYPE DEFINITIONS
// Fixes TypeScript errors across the Creator Armour project
// ============================================================

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    FRONTEND_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    [key: string]: string | undefined;
  }
}

// Fix for fetchPriority (React 18 types)
interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  fetchPriority?: 'high' | 'low' | 'auto';
}

interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
  fetchpriority?: 'high' | 'low' | 'auto';
}

// Fix for Web Crypto API (biometric auth)
interface AuthenticatorResponse {
  userHandle?: ArrayBuffer;
}

// Fix for Date constructor with null
interface DateConstructor {
  new (value: string | number | Date | null): Date;
}

// Fix for Supabase query results
type SupabaseResult<T> = {
  data: T | null;
  error: any;
};

// Fix for common React patterns
type Optional<T> = T | undefined | null;
type MaybeArray<T> = T | T[];
type StringOrNumber = string | number;

// Generic type for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic type for Supabase queries
type SupabaseQuery<T> = {
  [K in keyof T]?: T[K] | null;
};

// ============================================================
// MODULE AUGMENTATIONS
// ============================================================

declare module '*.svg' {
  const content: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Type for API response with unknown type (better than any)
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generic callback type
type Callback<T = unknown> = (data: T) => void;
