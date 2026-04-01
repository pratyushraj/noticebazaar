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
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    // Transform to CreatorProfile
    const profile: CreatorProfile = {
      id: data.id,
      email: data.email || '',
      first_name: data.first_name,
      last_name: data.last_name,
      avatar_url: data.avatar_url,
      username: data.username,
      bio: data.bio,
      location: data.location,
      phone: data.phone,
      instagram_handle: data.instagram_handle,
      youtube_channel_id: data.youtube_channel_id,
      tiktok_handle: data.tiktok_handle,
      twitter_handle: data.twitter_handle,
      facebook_profile_url: data.facebook_profile_url,
      instagram_followers: data.instagram_followers,
      youtube_subs: data.youtube_subs,
      tiktok_followers: data.tiktok_followers,
      twitter_followers: data.twitter_followers,
      facebook_followers: data.facebook_followers,
      pricing_min: data.pricing_min,
      pricing_avg: data.pricing_avg,
      pricing_max: data.pricing_max,
      avg_rate_reel: data.avg_rate_reel,
      typical_story_rate: data.typical_story_rate,
      typical_post_rate: data.typical_post_rate,
      creator_category: data.creator_category,
      content_niches: data.content_niches,
      platforms: data.platforms,
      goals: data.goals,
      open_to_collabs: data.open_to_collabs,
      bank_account_name: data.bank_account_name,
      bank_account_number: data.bank_account_number,
      bank_ifsc: data.bank_ifsc,
      bank_upi: data.bank_upi,
      gst_number: data.gst_number,
      pan_number: data.pan_number,
      onboarding_complete: data.onboarding_complete,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return ok(profile);
  }

  async getByUsername(username: string): Promise<ServiceResult<CreatorProfile>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('role', 'creator')
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    // Reuse getById transformation logic
    return this.getById(data.id);
  }

  async update(userId: string, input: UpdateCreatorInput): Promise<ServiceResult<CreatorProfile>> {
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
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
      .eq('creator_id', userId);

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    const stats: CreatorStats = {
      totalDeals: deals?.length || 0,
      completedDeals: deals?.filter(d => d.status === 'Completed').length || 0,
      totalRevenue: deals
        ?.filter(d => d.status === 'Completed')
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0) || 0,
      pendingPayments: deals
        ?.filter(d => !d.payment_received_date)
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0) || 0,
      averageDealValue: 0,
      completionRate: 0,
    };

    stats.averageDealValue = stats.totalDeals > 0
      ? Math.round((deals?.reduce((sum, d) => sum + (d.deal_amount || 0), 0) || 0) / stats.totalDeals)
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
