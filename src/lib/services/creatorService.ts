/**
 * Creator Service
 *
 * Handles all business logic related to creators including:
 * - Profile management
 * - Platform connections
 * - Creator settings
 * - Onboarding
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

import {
  ServiceResult,
  ok,
  fail,
  handleResult,
  handleListResult,
  mapSupabaseError,
} from './types';

// ============================================
// Types
// ============================================

export interface CreatorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;

  // Platform handles
  instagram_handle: string | null;
  youtube_channel_id: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  facebook_profile_url: string | null;

  // Platform metrics
  instagram_followers: number | null;
  youtube_subs: number | null;
  tiktok_followers: number | null;
  twitter_followers: number | null;
  facebook_followers: number | null;
  last_instagram_sync: string | null;

  // Pricing
  pricing_min: number | null;
  pricing_avg: number | null;
  pricing_max: number | null;
  avg_rate_reel: number | null;
  typical_story_rate: number | null;
  typical_post_rate: number | null;

  // Creator info
  creator_category: string | null;
  content_niches: string[] | null;
  platforms: string[] | null;
  goals: string[] | null;
  open_to_collabs: boolean | null;

  // Banking
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_upi: string | null;

  // Tax info
  gst_number: string | null;
  pan_number: string | null;
  portfolio_links: string[] | null;
  bio_screenshot_url: string | null;
  follower_range: string | null;

  // Metadata
  onboarding_complete: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface UpdateCreatorInput {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  username?: string;
  bio?: string;
  location?: string;
  phone?: string;

  // Platform handles
  instagram_handle?: string;
  youtube_channel_id?: string;
  tiktok_handle?: string;
  twitter_handle?: string;
  facebook_profile_url?: string;

  // Pricing
  pricing_min?: number;
  pricing_avg?: number;
  pricing_max?: number;
  avg_rate_reel?: number;
  typical_story_rate?: number;
  typical_post_rate?: number;

  // Creator info
  creator_category?: string;
  content_niches?: string[];
  platforms?: string[];
  goals?: string[];
  open_to_collabs?: boolean;

  // Banking
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_upi?: string;

  // Tax info
  gst_number?: string;
  pan_number?: string;
  portfolio_links?: string[];
  bio_screenshot_url?: string;
  follower_range?: string;
}

export interface CreatorStats {
  totalDeals: number;
  completedDeals: number;
  totalRevenue: number;
  pendingPayments: number;
  averageDealValue: number;
  completionRate: number;
}

export interface PlatformConnection {
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'facebook';
  handle: string;
  followers?: number;
  connected: boolean;
  lastSync?: string;
}

// ============================================
// Creator Service Interface
// ============================================

export interface ICreatorService {
  // Profile Management
  getById(userId: string): Promise<ServiceResult<CreatorProfile>>;
  getByUsername(username: string): Promise<ServiceResult<CreatorProfile>>;
  update(userId: string, input: UpdateCreatorInput): Promise<ServiceResult<CreatorProfile>>;

  // Onboarding
  completeOnboarding(userId: string, input: UpdateCreatorInput): Promise<ServiceResult<CreatorProfile>>;
  isOnboardingComplete(userId: string): Promise<ServiceResult<boolean>>;

  // Platform Connections
  getPlatformConnections(userId: string): Promise<ServiceResult<PlatformConnection[]>>;
  updatePlatformHandle(
    userId: string,
    platform: PlatformConnection['platform'],
    handle: string
  ): Promise<ServiceResult<void>>;

  // Stats
  getStats(userId: string): Promise<ServiceResult<CreatorStats>>;

  // Avatar
  uploadAvatar(userId: string, file: File): Promise<ServiceResult<string>>;
}

// ============================================
// Creator Service Implementation
// ============================================

export class CreatorService implements ICreatorService {
  private supabase;

  constructor(supabaseClient?: typeof supabase) {
    this.supabase = supabaseClient ?? supabase;
  }

  // ----------------------------------------
  // Profile Management
  // ----------------------------------------

  async getById(userId: string): Promise<ServiceResult<CreatorProfile>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId as any)
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    // Transform to CreatorProfile (data is typed as error result by Supabase - cast to access fields)
    const d = data as any;
    const profile: CreatorProfile = {
      id: d.id,
      email: d.email || '',
      first_name: d.first_name,
      last_name: d.last_name,
      avatar_url: d.avatar_url,
      username: d.username,
      bio: d.bio,
      location: d.location,
      phone: d.phone,
      instagram_handle: d.instagram_handle,
      youtube_channel_id: d.youtube_channel_id,
      tiktok_handle: d.tiktok_handle,
      twitter_handle: d.twitter_handle,
      facebook_profile_url: d.facebook_profile_url,
      instagram_followers: d.instagram_followers,
      last_instagram_sync: d.last_instagram_sync,
      youtube_subs: d.youtube_subs,
      tiktok_followers: d.tiktok_followers,
      twitter_followers: d.twitter_followers,
      facebook_followers: d.facebook_followers,
      pricing_min: d.pricing_min,
      pricing_avg: d.pricing_avg,
      pricing_max: d.pricing_max,
      avg_rate_reel: d.avg_rate_reel,
      typical_story_rate: d.typical_story_rate,
      typical_post_rate: d.typical_post_rate,
      creator_category: d.creator_category,
      content_niches: d.content_niches,
      platforms: d.platforms,
      goals: d.goals,
      open_to_collabs: d.open_to_collabs,
      bank_account_name: d.bank_account_name,
      bank_account_number: d.bank_account_number,
      bank_ifsc: d.bank_ifsc,
      bank_upi: d.bank_upi,
      gst_number: d.gst_number,
      pan_number: d.pan_number,
      portfolio_links: d.portfolio_links,
      bio_screenshot_url: d.bio_screenshot_url,
      follower_range: d.follower_range,
      onboarding_complete: d.onboarding_complete,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };

    return ok(profile);
  }

  async getByUsername(username: string): Promise<ServiceResult<CreatorProfile>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username as any)
      .eq('role', 'creator' as any)
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    // Reuse getById transformation logic
    const d = data as any;
    return this.getById(d.id);
  }

  async update(userId: string, input: UpdateCreatorInput): Promise<ServiceResult<CreatorProfile>> {
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updatePayload as any)
      .eq('id', userId as any)
      .select()
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return this.getById(userId);
  }

  // ----------------------------------------
  // Onboarding
  // ----------------------------------------

  async completeOnboarding(
    userId: string,
    input: UpdateCreatorInput
  ): Promise<ServiceResult<CreatorProfile>> {
    const updatePayload: UpdateCreatorInput & { onboarding_complete?: boolean } = {
      ...input,
      onboarding_complete: true,
    };

    return this.update(userId, updatePayload);
  }

  async isOnboardingComplete(userId: string): Promise<ServiceResult<boolean>> {
    const result = await this.getById(userId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return ok(result.data.onboarding_complete === true);
  }

  // ----------------------------------------
  // Platform Connections
  // ----------------------------------------

  async getPlatformConnections(userId: string): Promise<ServiceResult<PlatformConnection[]>> {
    const result = await this.getById(userId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const profile = result.data;
    const connections: PlatformConnection[] = [
      {
        platform: 'instagram',
        handle: profile.instagram_handle || '',
        followers: profile.instagram_followers || undefined,
        connected: !!profile.instagram_handle,
        lastSync: profile.last_instagram_sync || undefined,
      },
      {
        platform: 'youtube',
        handle: profile.youtube_channel_id || '',
        followers: profile.youtube_subs || undefined,
        connected: !!profile.youtube_channel_id,
      },
      {
        platform: 'tiktok',
        handle: profile.tiktok_handle || '',
        followers: profile.tiktok_followers || undefined,
        connected: !!profile.tiktok_handle,
      },
      {
        platform: 'twitter',
        handle: profile.twitter_handle || '',
        followers: profile.twitter_followers || undefined,
        connected: !!profile.twitter_handle,
      },
      {
        platform: 'facebook',
        handle: profile.facebook_profile_url || '',
        followers: profile.facebook_followers || undefined,
        connected: !!profile.facebook_profile_url,
      },
    ];

    return ok(connections);
  }

  async updatePlatformHandle(
    userId: string,
    platform: PlatformConnection['platform'],
    handle: string
  ): Promise<ServiceResult<void>> {
    const fieldMap: Record<PlatformConnection['platform'], string> = {
      instagram: 'instagram_handle',
      youtube: 'youtube_channel_id',
      tiktok: 'tiktok_handle',
      twitter: 'twitter_handle',
      facebook: 'facebook_profile_url',
    };

    const field = fieldMap[platform];
    const updatePayload = { [field]: handle };

    const result = await this.update(userId, updatePayload);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return ok(undefined);
  }

  // ----------------------------------------
  // Stats
  // ----------------------------------------

  async getStats(userId: string): Promise<ServiceResult<CreatorStats>> {
    // Get deals for stats calculation
    const { data: deals, error } = await this.supabase
      .from('brand_deals')
      .select('deal_amount, status, payment_received_date')
      .eq('creator_id', userId as any);

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    const typedDeals = deals as any as Array<{ status?: string; deal_amount?: number; payment_received_date?: string }> || [];
    const stats: CreatorStats = {
      totalDeals: typedDeals.length,
      completedDeals: typedDeals.filter(d => d.status === 'Completed').length,
      totalRevenue: typedDeals
        .filter(d => d.status === 'Completed')
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      pendingPayments: typedDeals
        .filter(d => !d.payment_received_date)
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      averageDealValue: 0,
      completionRate: 0,
    };

    stats.averageDealValue = stats.totalDeals > 0
      ? Math.round((typedDeals.reduce((sum, d) => sum + (d.deal_amount || 0), 0)) / stats.totalDeals)
      : 0;

    stats.completionRate = stats.totalDeals > 0
      ? Math.round((stats.completedDeals / stats.totalDeals) * 100)
      : 0;

    return ok(stats);
  }

  // ----------------------------------------
  // Avatar
  // ----------------------------------------

  async uploadAvatar(userId: string, file: File): Promise<ServiceResult<string>> {
    const fileExtension = file.name.split('.').pop();
    const filePath = `${userId}/avatars/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('creator-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing avatar
      });

    if (uploadError) {
      return fail('STORAGE_ERROR', `Failed to upload avatar: ${uploadError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('creator-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return fail('STORAGE_ERROR', 'Failed to get avatar URL');
    }

    // Update profile with new avatar URL
    await this.update(userId, { avatar_url: urlData.publicUrl });

    return ok(urlData.publicUrl);
  }
}

// ============================================
// Singleton Instance
// ============================================

export const creatorService = new CreatorService();
