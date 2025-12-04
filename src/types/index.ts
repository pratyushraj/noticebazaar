// src/types/index.ts
import { Tables } from './supabase';
import { LucideIcon } from 'lucide-react'; // Import LucideIcon for CreatorKpi

export type Profile = Tables<'profiles'> & {
  role: 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer'; // Override role to be specific string literals, added 'chartered_accountant', 'creator', and 'lawyer'
  business_name?: string | null; // New field
  gstin?: string | null; // New field
  business_entity_type?: string | null; // New field
  onboarding_complete?: boolean; // New field
  instagram_handle?: string | null; // NEW
  youtube_channel_id?: string | null; // NEW
  tiktok_handle?: string | null; // NEW
  facebook_profile_url?: string | null; // NEW
  twitter_handle?: string | null; // NEW
  pan?: string | null; // NEW: Added PAN field
  organization_id?: string | null; // NEW: Added organization_id
  is_trial?: boolean | null; // NEW: Trial fields
  trial_started_at?: string | null;
  trial_expires_at?: string | null;
  trial_locked?: boolean | null;
  // NEW: Creator profile fields
  creator_category?: string | null;
  pricing_min?: number | null;
  pricing_avg?: number | null;
  pricing_max?: number | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_upi?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  referral_code?: string | null;
  instagram_followers?: number | null;
  youtube_subs?: number | null;
  tiktok_followers?: number | null;
  twitter_followers?: number | null;
  facebook_followers?: number | null;
  // NEW: Profile fields for onboarding and settings
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  platforms?: string[] | null; // Array of platform IDs (youtube, instagram, etc.)
  goals?: string[] | null; // Array of goal IDs (protect, earnings, etc.)
};

export type Message = Tables<'messages'> & {
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  } | null;
  content: string | React.ReactNode; // Allow ReactNode for rich content display
};

export type Case = Tables<'cases'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type Category = Tables<'categories'> & {
  // Add any joined profiles or specific category-related fields here if needed
};

export type Document = Tables<'documents'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  cases?: { // Added for joining case details
    title: string;
  } | null;
  categories?: { // Added for joining category details
    name: string;
    is_system_category: boolean;
  } | null;
  is_favorite: boolean; // Added for document favorite feature
  status: 'Awaiting Review' | 'Approved' | 'Action Required' | 'Rejected'; // Added for document status
};

export type Activity = Tables<'activity_log'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type Subscription = Tables<'subscriptions'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  priceDisplay?: string; // Added for displaying custom price strings
  cases_limit?: number; // Placeholder for subscription usage stats
  documents_limit?: number; // Placeholder for subscription usage stats
  consultations_limit?: number; // Placeholder for subscription usage stats
};

export type Consultation = Tables<'consultations'> & {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'; // Override status to be specific string literals
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

// New type for Creator KPI cards
export interface CreatorKpi {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  changePercentage?: number; // Optional: e.g., 12 for +12%
  changeDirection?: 'up' | 'down' | 'neutral'; // Optional: for trend arrows
  statusDescription?: string; // Optional: e.g., "In Progress", "Requires Action", "Improving"
}

// New type for Brand Deals
export type BrandDeal = Tables<'brand_deals'> & {
  organization_id: string; // NEW: Added organization_id
  progress_percentage?: number | null; // Deal progress percentage (0-100)
};

// NEW: Payment Reminder Type
export type PaymentReminder = Tables<'payment_reminders'>;

// NEW: Copyright Scanner Types
export type OriginalContent = Tables<'original_content'>;
export type CopyrightScan = Tables<'copyright_scans'>;
export type CopyrightAction = Tables<'copyright_actions'>;

export type CopyrightMatch = Tables<'copyright_matches'> & {
  copyright_actions?: CopyrightAction[]; // Joined actions
};

// NEW: Type for Copyright Scan Alerts (kept for compatibility, but now using CopyrightMatch)
export interface CopyrightScanAlert {
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
}

// New type for Tax Filings
export type TaxFiling = Tables<'tax_filings'> & {
  status: 'Pending' | 'Filed' | 'Overdue';
};

// New type for Tax Settings
export type TaxSetting = Tables<'tax_settings'>;

// NEW: Type for Compliance Deadlines (used in dashboard)
export interface ComplianceDeadline {
  date: string;
  task: string;
  urgency: 'High' | 'Medium' | 'Low';
}

// Brand Directory Types
export type Brand = Tables<'brands'> & {
  // Computed fields from joins
  rating?: number;
  review_count?: number;
  active_opportunities_count?: number;
  is_bookmarked?: boolean;
};

export type Opportunity = Tables<'opportunities'> & {
  // Relations
  brand?: Brand;
  // Computed/derived fields
  apply_url?: string | null;
};

export type BrandReview = Tables<'brand_reviews'> & {
  // Relations
  creator?: Profile;
};