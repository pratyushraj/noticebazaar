import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useMemo, useCallback } from 'react';
import { useGenerateTaxFilings } from './useTaxFilings'; // NEW: Import the new hook
import { logger } from '@/lib/utils/logger';

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
    const fullSelectStatement = 'id, first_name, last_name, avatar_url, role, updated_at, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle';
    const basicSelectStatement = 'id, first_name, last_name, avatar_url, role, updated_at';

    let query = supabase
      .from('profiles')
      .select(fullSelectStatement, { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }
    if (firstName) {
      query = query.ilike('first_name', `%${firstName}%`);
    }
    if (lastName) {
      query = query.eq('last_name', lastName);
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
        query = query.eq('role', role);
      }
      if (firstName) {
        query = query.ilike('first_name', `%${firstName}%`);
      }
      if (lastName) {
        query = query.eq('last_name', lastName);
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
    const fullSelect = 'id, first_name, last_name, avatar_url, role, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle';
    const basicSelect = 'id, first_name, last_name, avatar_url, role';
    
    let { data, error } = await supabase
      .from('profiles')
      .select(fullSelect)
      .eq('id', profileId)
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
        .eq('id', profileId)
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
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role?: 'client' | 'admin' | 'chartered_accountant' | 'creator'; // Added role to the interface
  business_name?: string | null; // Added new field
  gstin?: string | null; // Added new field
  business_entity_type?: string | null; // Added new field
  onboarding_complete?: boolean; // Added new field
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
  // NEW: Profile fields
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  platforms?: string[] | null;
  goals?: string[] | null;
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
      // NEW: Profile fields
      phone,
      location,
      bio,
      platforms,
      goals,
    }) => {
      const updateData: { 
        first_name: string; 
        last_name: string; 
        avatar_url: string | null; 
        role?: 'client' | 'admin' | 'chartered_accountant' | 'creator'; 
        updated_at: string;
        business_name?: string | null;
        gstin?: string | null;
        business_entity_type?: string | null;
        onboarding_complete?: boolean;
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
      } = {
        first_name,
        last_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

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
      if (phone !== undefined) {
        updateData.phone = phone;
      }
      if (location !== undefined) {
        updateData.location = location;
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

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) {
        // Check if error is due to missing columns (migration not run)
        const isColumnError = error.code === '42703' || 
                            error.message?.includes('column') ||
                            error.message?.includes('does not exist') ||
                            String(error.message || '').toLowerCase().includes('schema cache');
        
        if (isColumnError) {
          // Remove fields that might not exist and retry
          const safeUpdateData: any = { ...updateData };
          
          // Remove onboarding fields that might not exist (from 2025_11_26_add_profile_fields.sql)
          delete safeUpdateData.platforms;
          delete safeUpdateData.goals;
          delete safeUpdateData.phone;
          delete safeUpdateData.location;
          delete safeUpdateData.bio;
          
          // Remove creator profile fields that might not exist (from 2025_11_21_add_creator_profile_fields.sql)
          delete safeUpdateData.creator_category;
          delete safeUpdateData.pricing_min;
          delete safeUpdateData.pricing_avg;
          delete safeUpdateData.pricing_max;
          delete safeUpdateData.bank_account_name;
          delete safeUpdateData.bank_account_number;
          delete safeUpdateData.bank_ifsc;
          delete safeUpdateData.bank_upi;
          delete safeUpdateData.gst_number;
          delete safeUpdateData.pan_number;
          delete safeUpdateData.referral_code;
          delete safeUpdateData.instagram_followers;
          delete safeUpdateData.youtube_subs;
          delete safeUpdateData.tiktok_followers;
          delete safeUpdateData.twitter_followers;
          delete safeUpdateData.facebook_followers;
          
          // Retry with safe fields only (core fields that should always exist)
          const { error: retryError } = await supabase
            .from('profiles')
            .update(safeUpdateData)
            .eq('id', id);
          
          if (retryError) {
            // If retry also fails, it's likely a different error - throw it
            throw new Error(retryError.message);
          }
          
          // Log warning about missing columns
          const missingFields = Object.keys(updateData).filter(k => !safeUpdateData.hasOwnProperty(k));
          if (missingFields.length > 0) {
            logger.warn('Profile updated without some fields - migrations may be needed', {
              profileId: id,
              missingFields
            });
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
              .eq('creator_id', id)
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
      successMessage: 'Profile updated successfully!',
      errorMessage: 'Failed to update profile',
    }
  );
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, string>(
    async (id) => {
      // First, delete the profile from the public.profiles table
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