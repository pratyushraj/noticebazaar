import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useMemo, useCallback } from 'react';
import { useGenerateTaxFilings } from './useTaxFilings'; // NEW: Import the new hook
import { logger } from '@/lib/utils/logger';
import { getApiBaseUrl } from '@/lib/utils/api';
import type { PortfolioItem } from '@/types';

const unsupportedProfileColumns = new Set<string>();

const UNSUPPORTED_PROFILE_COLUMNS_STORAGE_KEY = 'nb_unsupported_profile_columns_v2';
const REQUIRED_CREATOR_PROFILE_COLUMNS = new Set([
  'content_niches',
  'content_vibes',
  'audience_gender_split',
  'audience_age_range',
  'top_cities',
  'collab_region_label',
]);

const OPTIONAL_PROFILE_FALLBACK_COLUMNS = new Set([
  'shipping_address',
  'pincode',
]);

const loadUnsupportedProfileColumns = () => {
  // Avoid crashing in non-browser contexts/tests.
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(UNSUPPORTED_PROFILE_COLUMNS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const col of parsed) {
      if (typeof col === 'string' && col && !REQUIRED_CREATOR_PROFILE_COLUMNS.has(col)) {
        unsupportedProfileColumns.add(col);
      }
    }
  } catch {
    // Ignore bad storage state.
  }
};

const persistUnsupportedProfileColumns = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      UNSUPPORTED_PROFILE_COLUMNS_STORAGE_KEY,
      JSON.stringify(Array.from(unsupportedProfileColumns))
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc).
  }
};

// Populate the cache once per page load so we don't repeatedly fire failing PATCHes on refresh.
loadUnsupportedProfileColumns();

const omitUnsupportedProfileColumns = (payload: Record<string, unknown>) => {
  const nextPayload = { ...payload };
  for (const column of unsupportedProfileColumns) {
    if (REQUIRED_CREATOR_PROFILE_COLUMNS.has(column)) continue;
    delete nextPayload[column];
  }
  return nextPayload;
};

interface UseProfilesOptions {
  role?: 'client' | 'admin' | 'chartered_accountant' | 'creator';
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  disablePagination?: boolean;
  firstName?: string;
  lastName?: string;
}

export const useProfiles = (options?: UseProfilesOptions) => {
  const { role, enabled = true, page = 1, pageSize = 10, disablePagination = false, firstName, lastName } = options || {};

  // Memoize the queryKey to ensure referential stability
  const queryKey = useMemo(() =>
    ['profiles', role, page, pageSize, disablePagination, firstName, lastName],
    [role, page, pageSize, disablePagination, firstName, lastName]
  );

  // Memoize the queryFn to ensure referential stability
  const queryFn = useCallback(async () => {
    // Try with full select statement first, fallback to basic fields if columns don't exist
    // Removed 'pan' as it may not exist in all database schemas
    const fullSelectStatement = 'id, first_name, last_name, avatar_url, role, updated_at, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, avg_rate_reel, learned_avg_rate_reel, learned_deal_count, instagram_followers, instagram_profile_photo, last_instagram_sync, discovery_video_url, payout_upi, content_niches, content_vibes, audience_gender_split, top_cities, audience_age_range, primary_audience_language, collab_region_label';
    const basicSelectStatement = 'id, first_name, last_name, avatar_url, role, updated_at';

    let query = supabase
      .from('profiles')
      .select(fullSelectStatement, { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (role) {
      query = query.eq('role' as any, role);
    }
    if (firstName) {
      query = query.ilike('first_name' as any, `%${firstName}%`);
    }
    if (lastName) {
      query = query.eq('last_name' as any, lastName);
    }

    if (!disablePagination) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    let { data, error, count } = await query;

    // If error is due to missing columns (400, 42703, or column-related messages), retry with basic select
    // Also handle role filter errors gracefully
    const isColumnError = error && (
      (error as any).code === '42703' ||
      (error as any).status === 400 ||
      (error as any).statusCode === 400 ||
      (error as any).code === 'PGRST116' || // PostgREST column error
      (error as any).code === 'PGRST202' || // PostgREST function error
      error.message?.includes('column') ||
      error.message?.includes('does not exist') ||
      error.message?.includes('Could not find') ||
      error.message?.includes('role') || // Role column might not exist
      String(error.message || '').toLowerCase().includes('bad request') ||
      String(error.message || '').toLowerCase().includes('invalid')
    );

    if (isColumnError) {
      // Retry with basic select statement (only essential columns)
      query = supabase
        .from('profiles')
        .select(basicSelectStatement, { count: 'exact' })
        .order('updated_at', { ascending: false });

      if (role) {
        query = query.eq('role' as any, role);
      }
      if (firstName) {
        query = query.ilike('first_name' as any, `%${firstName}%`);
      }
      if (lastName) {
        query = query.eq('last_name' as any, lastName);
      }

      if (!disablePagination) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const retryResult = await query;
      data = retryResult.data;
      error = retryResult.error;
      count = retryResult.count;
    }

    // If still error, check if it's an RLS policy issue or other non-critical error
    if (error) {
      // Suppress expected errors (role filter issues, RLS blocking, etc.)
      const isExpectedError = (
        (error as any).status === 400 ||
        (error as any).status === 403 ||
        (error as any).code === 'PGRST301' ||
        error.message?.includes('role') ||
        error.message?.includes('permission denied') ||
        error.message?.includes('RLS') ||
        error.message?.includes('policy')
      );

      if (!isExpectedError) {
        // Only log unexpected errors
        console.warn('Error fetching profiles:', {
          role,
          error: error.message,
          code: (error as any).code,
          status: (error as any).status,
        });
      }

      // Return empty data instead of throwing to prevent UI crashes
      // This allows the UI to gracefully handle missing data
      return { data: [] as Profile[], count: 0 };
    }
    // Type assertion needed because fallback query may not include all fields
    return { data: (data || []) as Profile[], count };
  }, [role, page, pageSize, disablePagination, firstName, lastName]);

  return useSupabaseQuery<{ data: Profile[], count: number | null }, Error>(
    queryKey,
    queryFn, // Pass the memoized queryFn
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch profiles',
    }
  );
};

export const useProfileById = (profileId: string | undefined, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  const queryFn = useCallback(async () => { // Memoize queryFn here too
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Removed 'pan' as it may not exist in all database schemas
    const fullSelect = 'id, first_name, last_name, avatar_url, role, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, avg_rate_reel, learned_avg_rate_reel, learned_deal_count, instagram_followers, discovery_video_url, payout_upi, content_niches, content_vibes, audience_gender_split, top_cities, audience_age_range, primary_audience_language, collab_region_label';
    const basicSelect = 'id, first_name, last_name, avatar_url, role';

    let { data, error } = await supabase
      .from('profiles')
      .select(fullSelect)
      .eq('id' as any, profileId)
      .single();

    // If error is due to missing columns (400, 42703, or column-related messages), retry with basic select
    const isColumnError = error && (
      (error as any).code === '42703' ||
      (error as any).status === 400 ||
      (error as any).statusCode === 400 ||
      error.message?.includes('column') ||
      error.message?.includes('does not exist') ||
      String(error.message || '').toLowerCase().includes('bad request')
    );

    if (isColumnError) {
      const retryResult = await supabase
        .from('profiles')
        .select(basicSelect)
        .eq('id' as any, profileId)
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error(error.message);
    }
    // Type assertion needed because fallback query may not include all fields
    // Profile type allows missing optional fields
    return (data || null) as Profile;
  }, [profileId]);

  return useSupabaseQuery<Profile, Error>(
    ['profile', profileId],
    queryFn, // Pass memoized queryFn
    {
      enabled: enabled && !!profileId,
      errorMessage: 'Failed to fetch profile details',
    }
  );
};

interface UpdateProfileVariables {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  role?: 'client' | 'admin' | 'chartered_accountant' | 'creator'; // Added role to the interface
  business_name?: string | null; // Added new field
  gstin?: string | null; // Added new field
  business_entity_type?: string | null; // Added new field
  onboarding_complete?: boolean; // Added new field
  username?: string | null; // For collab link slug (same as instagram_handle when set)
  instagram_handle?: string | null; // NEW
  youtube_channel_id?: string | null; // NEW
  tiktok_handle?: string | null; // NEW
  facebook_profile_url?: string | null; // NEW
  twitter_handle?: string | null; // NEW
  pan?: string | null; // NEW: Added PAN field
  // Creator profile fields
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
  discovery_video_url?: string | null;
  payout_upi?: string | null;
  address?: string | null;
  shipping_address?: string | null;
  pincode?: string | null;
  // NEW: Profile fields
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  platforms?: string[] | null;
  goals?: string[] | null;
  // Creator readiness for brands
  open_to_collabs?: boolean | null;
  content_niches?: string[] | null;
  media_kit_url?: string | null;
  // NEW: Rate fields
  avg_rate_reel?: number | null;
  suggested_barter_value_min?: number | null;
  suggested_barter_value_max?: number | null;
  learned_avg_rate_reel?: number | null;
  learned_deal_count?: number | null;
  avg_reel_views_manual?: number | null;
  avg_likes_manual?: number | null;
  audience_gender_split?: string | null;
  top_cities?: string[] | null;
  audience_age_range?: string | null;
  primary_audience_language?: string | null;
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
  auto_pricing_enabled?: boolean | null;
  deal_templates?: any[] | null;
  reel_price?: number | null;
  story_price?: number | null;
  post_price?: number | null;
  barter_min_value?: number | null;
  delivery_days?: number | null;
  revisions?: number | null;
  avg_views?: number | null;
  followers_count?: number | null;
  audience_type?: string | null;
  city?: string | null;
  language?: string | null;
  niche?: string | null;
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
  creator_stage?: string | null;
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
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const generateTaxFilingsMutation = useGenerateTaxFilings(); // NEW: Initialize the mutation

  return useSupabaseMutation<void, Error, UpdateProfileVariables>(
    async ({
      id,
      first_name,
      last_name,
      avatar_url,
      role,
      business_name,
      gstin,
      business_entity_type,
      onboarding_complete,
      username,
      instagram_handle,
      youtube_channel_id,
      tiktok_handle,
      facebook_profile_url,
      twitter_handle,
      pan,
      // Creator profile fields
      creator_category,
      pricing_min,
      pricing_avg,
      pricing_max,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
      bank_upi,
      gst_number,
      pan_number,
      referral_code,
      instagram_followers,
      youtube_subs,
      tiktok_followers,
      twitter_followers,
      facebook_followers,
      discovery_video_url,
      payout_upi,
      shipping_address,
      pincode,
      // NEW: Profile fields
      phone,
      location,
      bio,
      platforms,
      goals,
      open_to_collabs,
      content_niches,
      content_vibes,
      media_kit_url,
      // NEW: Rate fields
      avg_rate_reel,
      suggested_barter_value_min,
      suggested_barter_value_max,
      learned_avg_rate_reel,
      learned_deal_count,
      avg_reel_views_manual,
      avg_likes_manual,
      audience_gender_split,
      top_cities,
      audience_age_range,
      primary_audience_language,
      posting_frequency,
      active_brand_collabs_month,
      campaign_slot_note,
      collab_brands_count_override,
      collab_response_hours_override,
      collab_cancellations_percent_override,
      collab_region_label,
      collab_intro_line,
      collab_audience_fit_note,
      collab_recent_activity_note,
      collab_audience_relevance_note,
      collab_delivery_reliability_note,
      collab_engagement_confidence_note,
      collab_response_behavior_note,
      collab_cta_trust_note,
      collab_cta_dm_note,
      collab_cta_platform_note,
      collab_past_work_items,
      auto_pricing_enabled,
      deal_templates,
      reel_price,
      story_price,
      post_price,
      barter_min_value,
      delivery_days,
      revisions,
      avg_views,
      followers_count,
      audience_type,
      city,
      language,
      niche,
      past_collabs,
      brand_logos,
      testimonials,
      case_studies,
      portfolio_links,
      upi_id,
      takes_advance,
      completed_deals,
      reliability_score,
      response_hours,
      availability_status,
      last_active_at,
      repeat_brands,
      on_time_delivery_rate,
      conversion_rate,
      creator_stage,
      link_shared_at,
      first_offer_at,
      first_deal_at,
      total_deals,
      total_earnings,
      offers_received,
      offers_accepted,
      storefront_views,
      profile_completion,
      storefront_completion,
    }) => {
      const updateData: {
        first_name?: string;
        last_name?: string;
        avatar_url?: string | null;
        role?: 'client' | 'admin' | 'chartered_accountant' | 'creator';
        updated_at: string;
        business_name?: string | null;
        gstin?: string | null;
        business_entity_type?: string | null;
        onboarding_complete?: boolean;
        username?: string | null;
        instagram_handle?: string | null;
        youtube_channel_id?: string | null;
        tiktok_handle?: string | null;
        facebook_profile_url?: string | null;
        twitter_handle?: string | null;
        pan?: string | null;
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
        phone?: string | null;
        location?: string | null;
        bio?: string | null;
        platforms?: string[] | null;
        goals?: string[] | null;
        open_to_collabs?: boolean | null;
        content_niches?: string[] | null;
        content_vibes?: string[] | null;
        media_kit_url?: string | null;
        avg_rate_reel?: number | null;
        suggested_barter_value_min?: number | null;
        suggested_barter_value_max?: number | null;
        learned_avg_rate_reel?: number | null;
        learned_deal_count?: number | null;
        avg_reel_views_manual?: number | null;
        avg_likes_manual?: number | null;
        audience_gender_split?: string | null;
        top_cities?: string[] | null;
        audience_age_range?: string | null;
        primary_audience_language?: string | null;
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
        collab_past_work_items?: PortfolioItem[] | null;
        auto_pricing_enabled?: boolean | null;
        deal_templates?: any[] | null;
        reel_price?: number | null;
        story_price?: number | null;
        post_price?: number | null;
        barter_min_value?: number | null;
        delivery_days?: number | null;
        revisions?: number | null;
        avg_views?: number | null;
        followers_count?: number | null;
        audience_type?: string | null;
        city?: string | null;
        language?: string | null;
        niche?: string | null;
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
        creator_stage?: string | null;
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
        discovery_video_url?: string | null;
        payout_upi?: string | null;
        shipping_address?: string | null;
        pincode?: string | null;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (first_name !== undefined) {
        updateData.first_name = first_name;
      }
      if (last_name !== undefined) {
        updateData.last_name = last_name;
      }
      if (avatar_url !== undefined) {
        updateData.avatar_url = avatar_url;
      }

      if (role) {
        updateData.role = role;
      }
      if (business_name !== undefined) {
        updateData.business_name = business_name;
      }
      if (gstin !== undefined) {
        updateData.gstin = gstin;
      }
      if (business_entity_type !== undefined) {
        updateData.business_entity_type = business_entity_type;
      }
      if (onboarding_complete !== undefined) {
        updateData.onboarding_complete = onboarding_complete;
      }
      if (username !== undefined) {
        updateData.username = username;
      }
      if (instagram_handle !== undefined) {
        updateData.instagram_handle = instagram_handle;
      }
      if (youtube_channel_id !== undefined) {
        updateData.youtube_channel_id = youtube_channel_id;
      }
      if (tiktok_handle !== undefined) {
        updateData.tiktok_handle = tiktok_handle;
      }
      if (facebook_profile_url !== undefined) {
        updateData.facebook_profile_url = facebook_profile_url;
      }
      if (twitter_handle !== undefined) {
        updateData.twitter_handle = twitter_handle;
      }
      if (pan !== undefined) {
        updateData.pan = pan;
      }
      if (creator_category !== undefined) {
        updateData.creator_category = creator_category;
      }
      if (pricing_min !== undefined) {
        updateData.pricing_min = pricing_min;
      }
      if (pricing_avg !== undefined) {
        updateData.pricing_avg = pricing_avg;
      }
      if (pricing_max !== undefined) {
        updateData.pricing_max = pricing_max;
      }
      if (bank_account_name !== undefined) {
        updateData.bank_account_name = bank_account_name;
      }
      if (bank_account_number !== undefined) {
        updateData.bank_account_number = bank_account_number;
      }
      if (bank_ifsc !== undefined) {
        updateData.bank_ifsc = bank_ifsc;
      }
      if (bank_upi !== undefined) {
        updateData.bank_upi = bank_upi;
      }
      if (gst_number !== undefined) {
        updateData.gst_number = gst_number;
      }
      if (pan_number !== undefined) {
        updateData.pan_number = pan_number;
      }
      if (referral_code !== undefined) {
        updateData.referral_code = referral_code;
      }
      if (instagram_followers !== undefined) {
        updateData.instagram_followers = instagram_followers;
      }
      if (youtube_subs !== undefined) {
        updateData.youtube_subs = youtube_subs;
      }
      if (tiktok_followers !== undefined) {
        updateData.tiktok_followers = tiktok_followers;
      }
      if (twitter_followers !== undefined) {
        updateData.twitter_followers = twitter_followers;
      }
      if (facebook_followers !== undefined) {
        updateData.facebook_followers = facebook_followers;
      }
      if (discovery_video_url !== undefined) {
        updateData.discovery_video_url = discovery_video_url;
      }
      if (payout_upi !== undefined) {
        updateData.payout_upi = payout_upi;
      }
      if (shipping_address !== undefined) {
        updateData.shipping_address = shipping_address;
      }
      if (pincode !== undefined) {
        updateData.pincode = pincode;
      }
      if (phone !== undefined) {
        // Only include phone if it's not null or empty (null is valid to clear the field)
        updateData.phone = phone;
      }
      if (location !== undefined) {
        updateData.location = typeof location === 'string' ? location.trim() : location;
      }
      if (bio !== undefined) {
        updateData.bio = bio;
      }
      if (platforms !== undefined) {
        updateData.platforms = platforms;
      }
      if (goals !== undefined) {
        updateData.goals = goals;
      }
      if (open_to_collabs !== undefined) {
        updateData.open_to_collabs = open_to_collabs;
      }
      if (content_niches !== undefined) {
        updateData.content_niches = content_niches;
      }
      if (content_vibes !== undefined) {
        updateData.content_vibes = content_vibes;
      }
      if (media_kit_url !== undefined) {
        updateData.media_kit_url = media_kit_url;
      }
      if (avg_rate_reel !== undefined) {
        updateData.avg_rate_reel = avg_rate_reel;
      }
      if (suggested_barter_value_min !== undefined) {
        updateData.suggested_barter_value_min = suggested_barter_value_min;
      }
      if (suggested_barter_value_max !== undefined) {
        updateData.suggested_barter_value_max = suggested_barter_value_max;
      }
      if (learned_avg_rate_reel !== undefined) {
        updateData.learned_avg_rate_reel = learned_avg_rate_reel;
      }
      if (learned_deal_count !== undefined) {
        updateData.learned_deal_count = learned_deal_count;
      }
      if (avg_reel_views_manual !== undefined) {
        updateData.avg_reel_views_manual = avg_reel_views_manual;
      }
      if (avg_likes_manual !== undefined) {
        updateData.avg_likes_manual = avg_likes_manual;
      }
      if (audience_gender_split !== undefined) {
        updateData.audience_gender_split = audience_gender_split;
      }
      if (top_cities !== undefined) {
        updateData.top_cities = top_cities;
      }
      if (audience_age_range !== undefined) {
        updateData.audience_age_range = audience_age_range;
      }
      if (primary_audience_language !== undefined) {
        updateData.primary_audience_language = primary_audience_language;
      }
      if (posting_frequency !== undefined) {
        updateData.posting_frequency = posting_frequency;
      }
      if (active_brand_collabs_month !== undefined) {
        updateData.active_brand_collabs_month = active_brand_collabs_month;
      }
      if (campaign_slot_note !== undefined) {
        updateData.campaign_slot_note = campaign_slot_note;
      }
      if (collab_brands_count_override !== undefined) {
        updateData.collab_brands_count_override = collab_brands_count_override;
      }
      if (collab_response_hours_override !== undefined) {
        updateData.collab_response_hours_override = collab_response_hours_override;
      }
      if (collab_cancellations_percent_override !== undefined) {
        updateData.collab_cancellations_percent_override = collab_cancellations_percent_override;
      }
      if (collab_region_label !== undefined) {
        updateData.collab_region_label = collab_region_label;
      }
      if (collab_intro_line !== undefined) {
        updateData.collab_intro_line = collab_intro_line;
      }
      if (collab_audience_fit_note !== undefined) {
        updateData.collab_audience_fit_note = collab_audience_fit_note;
      }
      if (collab_recent_activity_note !== undefined) {
        updateData.collab_recent_activity_note = collab_recent_activity_note;
      }
      if (collab_audience_relevance_note !== undefined) {
        updateData.collab_audience_relevance_note = collab_audience_relevance_note;
      }
      if (collab_delivery_reliability_note !== undefined) {
        updateData.collab_delivery_reliability_note = collab_delivery_reliability_note;
      }
      if (collab_engagement_confidence_note !== undefined) {
        updateData.collab_engagement_confidence_note = collab_engagement_confidence_note;
      }
      if (collab_response_behavior_note !== undefined) {
        updateData.collab_response_behavior_note = collab_response_behavior_note;
      }
      if (collab_cta_trust_note !== undefined) {
        updateData.collab_cta_trust_note = collab_cta_trust_note;
      }
      if (collab_cta_dm_note !== undefined) {
        updateData.collab_cta_dm_note = collab_cta_dm_note;
      }
      if (collab_cta_platform_note !== undefined) {
        updateData.collab_cta_platform_note = collab_cta_platform_note;
      }
      if (collab_past_work_items !== undefined) {
        updateData.collab_past_work_items = collab_past_work_items;
      }
      if (auto_pricing_enabled !== undefined) {
        updateData.auto_pricing_enabled = auto_pricing_enabled;
      }
      if (deal_templates !== undefined) {
        updateData.deal_templates = deal_templates;
      }
      if (reel_price !== undefined) {
        updateData.reel_price = reel_price;
      }
      if (story_price !== undefined) {
        updateData.story_price = story_price;
      }
      if (post_price !== undefined) {
        updateData.post_price = post_price;
      }
      if (barter_min_value !== undefined) {
        updateData.barter_min_value = barter_min_value;
      }
      if (delivery_days !== undefined) {
        updateData.delivery_days = delivery_days;
      }
      if (revisions !== undefined) {
        updateData.revisions = revisions;
      }
      if (avg_views !== undefined) {
        updateData.avg_views = avg_views;
      }
      if (followers_count !== undefined) {
        updateData.followers_count = followers_count;
      }
      if (audience_type !== undefined) {
        updateData.audience_type = audience_type;
      }
      if (city !== undefined) {
        updateData.city = city;
      }
      if (language !== undefined) {
        updateData.language = language;
      }
      if (niche !== undefined) {
        updateData.niche = niche;
      }
      if (past_collabs !== undefined) {
        updateData.past_collabs = past_collabs;
      }
      if (brand_logos !== undefined) {
        updateData.brand_logos = brand_logos;
      }
      if (testimonials !== undefined) {
        updateData.testimonials = testimonials;
      }
      if (case_studies !== undefined) {
        updateData.case_studies = case_studies;
      }
      if (portfolio_links !== undefined) {
        updateData.portfolio_links = portfolio_links;
      }
      if (upi_id !== undefined) {
        updateData.upi_id = upi_id;
      }
      if (takes_advance !== undefined) {
        updateData.takes_advance = takes_advance;
      }
      if (completed_deals !== undefined) {
        updateData.completed_deals = completed_deals;
      }
      if (reliability_score !== undefined) {
        updateData.reliability_score = reliability_score;
      }
      if (response_hours !== undefined) {
        updateData.response_hours = response_hours;
      }
      if (availability_status !== undefined) {
        updateData.availability_status = availability_status;
      }
      if (last_active_at !== undefined) {
        updateData.last_active_at = last_active_at;
      }
      if (repeat_brands !== undefined) {
        updateData.repeat_brands = repeat_brands;
      }
      if (on_time_delivery_rate !== undefined) {
        updateData.on_time_delivery_rate = on_time_delivery_rate;
      }
      if (conversion_rate !== undefined) {
        updateData.conversion_rate = conversion_rate;
      }
      if (creator_stage !== undefined) {
        updateData.creator_stage = creator_stage;
      }
      if (link_shared_at !== undefined) {
        updateData.link_shared_at = link_shared_at;
      }
      if (first_offer_at !== undefined) {
        updateData.first_offer_at = first_offer_at;
      }
      if (first_deal_at !== undefined) {
        updateData.first_deal_at = first_deal_at;
      }
      if (total_deals !== undefined) {
        updateData.total_deals = total_deals;
      }
      if (total_earnings !== undefined) {
        updateData.total_earnings = total_earnings;
      }
      if (offers_received !== undefined) {
        updateData.offers_received = offers_received;
      }
      if (offers_accepted !== undefined) {
        updateData.offers_accepted = offers_accepted;
      }
      if (storefront_views !== undefined) {
        updateData.storefront_views = storefront_views;
      }
      if (profile_completion !== undefined) {
        updateData.profile_completion = profile_completion;
      }
      if (storefront_completion !== undefined) {
        updateData.storefront_completion = storefront_completion;
      }

      const filteredUpdateData = omitUnsupportedProfileColumns(updateData as Record<string, unknown>);

      // Include id for upsert
      filteredUpdateData.id = id;

      const { error } = await supabase
        .from('profiles')
        .upsert(filteredUpdateData as any, { onConflict: 'id' });

      if (error) {
        // Check if error is due to missing columns (migration not run)
        const errorMessage = String(error.message || '').toLowerCase();
        const isColumnError = error.code === '42703' ||
          (error as any).code === 'PGRST116' ||
          (error as any).code === 'PGRST202' ||
          errorMessage.includes('column') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('schema cache') ||
          errorMessage.includes('could not find');

        if (isColumnError) {
          // Remove only truly missing columns one-by-one so available optional fields still persist.
          const safeUpdateData: Record<string, any> = { ...filteredUpdateData };
          const droppedFields = new Set<string>();
          const optionalExtensionFields = new Set([
            'platforms',
            'goals',
            'creator_category',
            'pricing_min',
            'pricing_avg',
            'pricing_max',
            'bank_account_name',
            'bank_account_number',
            'bank_ifsc',
            'bank_upi',
            'gst_number',
            'pan_number',
            'referral_code',
            'instagram_followers',
            'youtube_subs',
            'tiktok_followers',
            'twitter_followers',
            'facebook_followers',
            'open_to_collabs',
            'media_kit_url',
            'avg_rate_reel',
            'learned_avg_rate_reel',
            'learned_deal_count',
            'suggested_barter_value_min',
            'suggested_barter_value_max',
            'avg_reel_views_manual',
            'avg_likes_manual',
            'audience_gender_split',
            'top_cities',
            'audience_age_range',
            'primary_audience_language',
            'posting_frequency',
            'active_brand_collabs_month',
            'campaign_slot_note',
            'collab_brands_count_override',
            'collab_response_hours_override',
            'collab_cancellations_percent_override',
            'collab_region_label',
            'collab_intro_line',
            'collab_audience_fit_note',
            'collab_recent_activity_note',
            'collab_audience_relevance_note',
            'collab_delivery_reliability_note',
            'collab_engagement_confidence_note',
            'collab_response_behavior_note',
            'collab_cta_trust_note',
            'collab_cta_dm_note',
            'collab_cta_platform_note',
            'collab_past_work_items',
            'auto_pricing_enabled',
            'deal_templates',
            'reel_price',
            'story_price',
            'post_price',
            'barter_min_value',
            'delivery_days',
            'revisions',
            'avg_views',
            'followers_count',
            'audience_type',
            'city',
            'language',
            'niche',
            'past_collabs',
            'brand_logos',
            'testimonials',
            'case_studies',
            'portfolio_links',
            'upi_id',
            'takes_advance',
            'completed_deals',
            'reliability_score',
            'response_hours',
            'availability_status',
            'last_active_at',
            'repeat_brands',
            'on_time_delivery_rate',
            'conversion_rate',
            'pincode',
            'shipping_address',
            'creator_stage',
            'link_shared_at',
            'first_offer_at',
            'first_deal_at',
            'total_deals',
            'total_earnings',
            'offers_received',
            'offers_accepted',
            'storefront_views',
            'profile_completion',
            'storefront_completion',
          ]);

          const extractMissingColumn = (message: string): string | null => {
            if (!message) return null;
            const quoted = message.match(/column\s+"([^"]+)"/i);
            if (quoted?.[1]) return quoted[1];
            const unquoted = message.match(/column\s+([a-z_][a-z0-9_]*)/i);
            if (unquoted?.[1]) return unquoted[1];
            return null;
          };

          let retryError: any = error;
          const maxRetries = 10;

          for (let i = 0; i < maxRetries; i++) {
            const missingColumn = extractMissingColumn(String(retryError?.message || ''));

            if (missingColumn && OPTIONAL_PROFILE_FALLBACK_COLUMNS.has(missingColumn) && missingColumn in safeUpdateData) {
              delete safeUpdateData[missingColumn];
              droppedFields.add(missingColumn);
              if (!unsupportedProfileColumns.has(missingColumn)) {
                unsupportedProfileColumns.add(missingColumn);
                persistUnsupportedProfileColumns();
              }
            } else
            if (missingColumn && optionalExtensionFields.has(missingColumn) && missingColumn in safeUpdateData) {
              delete safeUpdateData[missingColumn];
              droppedFields.add(missingColumn);
              if (!unsupportedProfileColumns.has(missingColumn)) {
                unsupportedProfileColumns.add(missingColumn);
                persistUnsupportedProfileColumns();
              }
            } else if (i === 0) {
              // If we couldn't identify the exact missing column, fallback to minimal known-safe core payload.
              for (const field of Array.from(optionalExtensionFields)) {
                if (field in safeUpdateData) {
                  delete safeUpdateData[field];
                  droppedFields.add(field);
                  if (!unsupportedProfileColumns.has(field)) {
                    unsupportedProfileColumns.add(field);
                  }
                }
              }
              // Persist after the bulk add to avoid repeated failing writes on refresh.
              persistUnsupportedProfileColumns();
            }

            // Include id for upsert
            safeUpdateData.id = id;

            const result = await (supabase
              .from('profiles')
              .upsert(safeUpdateData as any, { onConflict: 'id' }) as any);

            if (!result.error) {
              if (droppedFields.size > 0 && import.meta.env.DEV) {
                logger.warn('Profile updated without some fields - migrations may be needed', {
                  profileId: id,
                  missingFields: Array.from(droppedFields),
                });
              }
              retryError = null;
              break;
            }

            retryError = result.error;
            const stillColumnError =
              retryError.code === '42703' ||
              String(retryError.message || '').toLowerCase().includes('column') ||
              String(retryError.message || '').toLowerCase().includes('does not exist') ||
              String(retryError.message || '').toLowerCase().includes('schema cache');

            if (!stillColumnError) break;
          }

          if (retryError) {
            throw new Error(retryError.message);
          }
        } else {
          throw new Error(error.message);
        }
      }

      // --- NEW LOGIC: Check for Creator Onboarding Completion ---
      if (onboarding_complete === true && role === 'creator') {
        // Check if tax filings already exist for this user (to prevent duplicates if the profile is updated later)
        const { count: existingFilingsCount, error: checkError } = await supabase
          .from('tax_filings')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id' as any, id)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing tax filings:', checkError);
          // Continue without throwing, as the profile update succeeded
        } else if (existingFilingsCount === 0) {
          // Only generate if no filings exist
          await generateTaxFilingsMutation.mutateAsync({ creator_id: id });
        }
      }
      // --- END NEW LOGIC ---

      // Instagram auto-sync removed per user request
      // Manual updates are the only source of truth now.
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate and refetch the specific profile query
        queryClient.invalidateQueries({ queryKey: ['profile', variables.id] });
        // Also invalidate the general profiles query if the role might change (which it now can)
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        // Invalidate the userProfile query in SessionContext to ensure it picks up the latest data
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        // Also invalidate by ID pattern for SessionContext
        queryClient.invalidateQueries({
          queryKey: ['userProfile', variables.id],
          exact: false
        });
      },
      errorMessage: 'Failed to update profile',
    }
  );
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, string>(
    async (id) => {
      // First, delete associated tax filings
      const { error: deletionError } = await (supabase
        .from('tax_filings')
        .delete()
        .eq('creator_id' as any, id) as any);

      if (deletionError) {
        throw new Error(`Failed to delete tax filings: ${deletionError.message}`);
      }

      // Then, delete the profile from the public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      // The auth.users entry should be automatically deleted due to RLS and foreign key cascade.
      // If not, you would explicitly delete it here:
      // const { error: userError } = await supabase.auth.admin.deleteUser(id);
      // if (userError) {
      //   throw new Error(`Failed to delete user from auth: ${user_id_error.message}`);
      // }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      errorMessage: 'Failed to delete profile',
    }
  );
};
