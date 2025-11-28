/**
 * useNotificationPreferences Hook
 * 
 * Manages user notification preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { NotificationPreferences, CategoryPreference } from '@/types/notifications';
import { toast } from 'sonner';

export const useNotificationPreferences = () => {
  const { profile, user } = useSession();
  const queryClient = useQueryClient();
  const userId = profile?.id || user?.id;

  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<NotificationPreferences | null>({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        throw error;
      }

      // If no preferences exist, create default
      if (!data) {
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            preferences: {},
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating notification preferences:', createError);
          throw createError;
        }

        return newPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update preference
  const updatePreferenceMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update preferences', { description: error.message });
    },
  });

  // Update category preference
  const updateCategoryPreferenceMutation = useMutation({
    mutationFn: async ({
      category,
      preference,
    }: {
      category: string;
      preference: CategoryPreference;
    }) => {
      if (!userId || !preferences) throw new Error('User not authenticated or preferences not loaded');

      const updatedPreferences = {
        ...preferences.preferences,
        [category]: preference,
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    },
    onError: (error: any) => {
      toast.error('Failed to update category preference', { description: error.message });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreference: updatePreferenceMutation.mutate,
    updateCategoryPreference: updateCategoryPreferenceMutation.mutate,
    isUpdating: updatePreferenceMutation.isPending || updateCategoryPreferenceMutation.isPending,
  };
};

