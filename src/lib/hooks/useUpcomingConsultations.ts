import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Consultation } from '@/types';

interface UseUpcomingConsultationsOptions {
  enabled?: boolean;
  limit?: number;
}

export const useUpcomingConsultations = (options?: UseUpcomingConsultationsOptions) => {
  const { enabled = true, limit = 5 } = options || {};

  return useSupabaseQuery<Consultation[], Error>(
    ['upcomingConsultations', limit],
    async () => {
      const today = new Date();
      // Format today's date as YYYY-MM-DD in local time
      const todayDateString = today.getFullYear() + '-' + 
                              (today.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              today.getDate().toString().padStart(2, '0');

      const nextWeek = new Date(today); // Start from today's date
      nextWeek.setDate(today.getDate() + 7); // Add 7 days
      // Format next week's date as YYYY-MM-DD in local time
      const nextWeekDateString = nextWeek.getFullYear() + '-' + 
                                 (nextWeek.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                                 nextWeek.getDate().toString().padStart(2, '0');

      const { data, error } = await supabase
        .from('consultations')
        .select('*, profiles!client_id(first_name, last_name)')
        .in('status', ['Pending', 'Approved']) // Only show pending or approved
        .gte('preferred_date', todayDateString) // Use locally formatted date string
        .lte('preferred_date', nextWeekDateString) // Use locally formatted date string
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }
      return data as Consultation[];
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch upcoming consultations',
    }
  );
};