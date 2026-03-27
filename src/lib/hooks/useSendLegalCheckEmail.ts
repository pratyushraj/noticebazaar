import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface LegalCheckFormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyType: string; // Select your business type
  businessStage: string; // New
  entityType: string; // New: Registered Entity Type
  hasGst: string; // New: Do you have a registered GST number?
  hasClientVendorAgreements: string; // New
  hasEmployeeAgreements: string; // New
  hasFiledAnnualReturns: string; // New
  ongoingDisputes: string; // New
  debtRecoveryChallenge: string; // New
  preferredContactMethod: string; // New
  wantsConsultation: string; // New
}

export const useSendLegalCheckEmail = () => {
  return useSupabaseMutation<void, Error, LegalCheckFormData>(
    async (formData) => {
      // Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('send-legal-check-email', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
    },
    {
      errorMessage: 'Failed to submit form data',
    }
  );
};