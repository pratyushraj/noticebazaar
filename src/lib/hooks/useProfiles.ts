import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useMemo, useCallback } from 'react';
import { useGenerateTaxFilings } from './useTaxFilings'; // NEW: Import the new hook

interface UseProfilesOptions {
  role?: 'client' | 'admin';
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
    // Reverting to original select statement
    const selectStatement = 'id, first_name, last_name, avatar_url, role, updated_at, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, pan'; // UPDATED: Include new social media fields and pan

    let query = supabase
      .from('profiles')
      .select(selectStatement, { count: 'exact' })
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

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data: data as Profile[], count };
  }, [role, page, pageSize, disablePagination, firstName, lastName]); // Dependencies for useCallback

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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, pan') // UPDATED: Include new social media fields and pan
      .eq('id', profileId)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Profile;
  }, [profileId]); // Dependency for useCallback

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
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const generateTaxFilingsMutation = useGenerateTaxFilings(); // NEW: Initialize the mutation

  return useSupabaseMutation<void, Error, UpdateProfileVariables>(
    async ({ id, first_name, last_name, avatar_url, role, business_name, gstin, business_entity_type, onboarding_complete, instagram_handle, youtube_channel_id, tiktok_handle, facebook_profile_url, twitter_handle, pan }) => {
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

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
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
        queryClient.invalidateQueries({ queryKey: ['userProfile', variables.id] });
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