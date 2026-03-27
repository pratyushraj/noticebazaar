import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface SendPaymentReminderVariables {
  brandDealId: string;
  messageType?: 'email' | 'whatsapp'; // NEW
  customMessage?: string; // NEW
}

export const useSendPaymentReminder = () => {
  return useSupabaseMutation<void, Error, SendPaymentReminderVariables>(
    async ({ brandDealId, messageType = 'email', customMessage }) => { // Updated variables
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: { brandDealId, messageType, customMessage }, // Pass all variables
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
    },
    {
      successMessage: 'Payment reminder sent successfully!',
      errorMessage: 'Failed to send payment reminder',
    }
  );
};