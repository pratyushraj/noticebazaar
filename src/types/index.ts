// src/types/index.ts
import { Tables } from './supabase';
import { LucideIcon } from 'lucide-react'; // Import LucideIcon for CreatorKpi

export interface PortfolioItem {
  id: string;
  sourceUrl?: string | null;
  posterUrl?: string | null;
  title?: string | null;
  mediaType?: 'video' | 'link' | null;
  platform?: string | null;
  brand?: string;
  campaignType?: string;
  outcome?: string;
  proofLabel?: string | null;
}

// Deal Template for creator collaboration packages
export interface DealTemplate {
  id: string;
  name: string;
  description?: string | null;
  deliverables?: string[] | null;
  rate?: number | null;
  revision_count?: number | null;
  turnaround_days?: number | null;
  terms?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type Profile = Tables<'profiles'> & {
  role: 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand'; // Override role to be specific string literals
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
  instagram_profile_photo?: string | null;
  last_instagram_sync?: string | null;
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
  username?: string | null; // Unique username for creator collab links
  // Creator readiness for brands (open to collabs, niches, media kit)
  open_to_collabs?: boolean | null;
  content_niches?: string[] | null;
  content_vibes?: string[] | null;
  media_kit_url?: string | null;
  // NEW: Creator Rate fields
  avg_rate_reel?: number | null;
  reel_price?: number | null;
  story_price?: number | null;
  post_price?: number | null;
  barter_min_value?: number | null;
  delivery_days?: number | null;
  revisions?: number | null;
  learned_avg_rate_reel?: number | null;
  learned_deal_count?: number | null;
  avg_reel_views_manual?: number | null;
  avg_views?: number | null;
  followers_count?: number | null;
  avg_likes_manual?: number | null;
  audience_type?: string | null;
  audience_gender_split?: string | null;
  top_cities?: string[] | null;
  audience_age_range?: string | null;
  primary_audience_language?: string | null;
  city?: string | null;
  language?: string | null;
  niche?: string | null;
  posting_frequency?: string | null;
  active_brand_collabs_month?: number | null;
  campaign_slot_note?: string | null;
  collab_brands_count_override?: number | null;
  collab_response_hours_override?: number | null;
  collab_cancellations_percent_override?: number | null;
  collab_region_label?: string | null;
  collab_intro_line?: string | null;
  collab_audience_fit_note?: string | null;
  collab_recent_activity_note?: string | null;
  collab_audience_relevance_note?: string | null;
  collab_delivery_reliability_note?: string | null;
  collab_engagement_confidence_note?: string | null;
  collab_response_behavior_note?: string | null;
  collab_cta_trust_note?: string | null;
  collab_cta_dm_note?: string | null;
  collab_cta_platform_note?: string | null;
  collab_show_packages?: boolean | null;
  collab_show_trust_signals?: boolean | null;
  collab_show_audience_snapshot?: boolean | null;
  collab_show_past_work?: boolean | null;
  collab_past_work_items?: PortfolioItem[] | null;
  // NEW: Qualification & Deal Rules
  min_deal_value?: number | null;
  min_lead_time_days?: number | null;
  typical_story_rate?: number | null;
  typical_post_rate?: number | null;
  premium_production_multiplier?: number | null;
  brand_type_preferences?: string[] | null;
  campaign_type_support?: string[] | null;
  revision_policy?: string | null;
  allow_negotiation?: boolean | null;
  allow_counter_offer?: boolean | null;
  deal_templates?: DealTemplate[] | null; // Customized collaboration packages
  past_collabs?: string[] | null;
  brand_logos?: string[] | null;
  testimonials?: string[] | null;
  case_studies?: string[] | null;
  portfolio_links?: string[] | null;
  portfolio_items?: PortfolioItem[] | null;
  upi_id?: string | null;
  takes_advance?: boolean | null;
  completed_deals?: number | null;
  reliability_score?: number | null;
  response_hours?: number | null;
  availability_status?: string | null;
  last_active_at?: string | null;
  repeat_brands?: number | null;
  on_time_delivery_rate?: number | null;
  conversion_rate?: number | null;
  creator_stage?: 'new' | 'priced' | 'link_shared' | 'first_offer' | 'first_deal' | 'active' | 'power' | null;
  link_shared_at?: string | null;
  first_offer_at?: string | null;
  first_deal_at?: string | null;
  total_deals?: number | null;
  total_earnings?: number | null;
  offers_received?: number | null;
  offers_accepted?: number | null;
  storefront_views?: number | null;
  profile_completion?: number | null;
  storefront_completion?: number | null;
  manual_badge?: string | null;
  is_verified?: boolean | null;
  auto_pricing_enabled?: boolean | null;
  full_name?: string | null;
  pincode?: string | null;
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
  // Additional dynamic fields potentially from migrations not yet synced to types
  contract_file_url?: string | null;
  barter_product_image_url?: string | null;
  delivery_name?: string | null;
  delivery_address?: string | null;
  delivery_phone?: string | null;
  shipping_status?: string | null;
  utr_number?: string | null;
  payment_released_at?: string | null;
  content_url?: string | null;
  content_notes?: string | null;
  brand_approval_status?: string | null;
  contract_file_path?: string | null;
  signed_contract_url?: string | null;
  signed_contract_path?: string | null;
  deal_type?: 'paid' | 'barter' | null;
  brand_phone?: string | null;
  brand_address?: string | null;
  brand_submission_details?: any | null;
  delivery_address?: string | null;
  delivery_name?: string | null;
  delivery_phone?: string | null;
  delivery_notes?: string | null;
  shipping_required?: boolean | null;
  shipping_status?: string | null;
  escrow_receipt_url?: string | null;
  escrow_receipt_path?: string | null;
};

// NEW: Payment Reminder Type
export interface PaymentReminder {
  id: string;
  brand_deal_id: string;
  creator_id: string;
  reminder_date: string;
  amount?: number | null;
  status?: 'pending' | 'sent' | 'acknowledged' | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

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
