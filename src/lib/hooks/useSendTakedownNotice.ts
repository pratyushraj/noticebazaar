import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface SendTakedownNoticeVariables {
  contentUrl: string;
  platform: string;
  infringingUrl: string;
  infringingUser?: string;
}

export const useSendTakedownNotice = () => {
  return useSupabaseMutation<void, Error, SendTakedownNoticeVariables>(
    async ({ contentUrl, platform, infringingUrl, infringingUser }) => {
      const { data, error } = await supabase.functions.invoke('send-takedown-notice', {
        body: { contentUrl, platform, infringingUrl, infringingUser },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
    },
    {
      successMessage: 'Takedown notice sent successfully!',
      errorMessage: 'Failed to send takedown notice',
    }
  );
};