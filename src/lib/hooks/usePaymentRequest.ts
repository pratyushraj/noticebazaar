/**
 * usePaymentRequest Hook
 * 
 * Handles payment request creation and sending
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { BrandDeal } from '@/types';
import { generateInvoicePDF, uploadInvoiceToStorage, generateInvoiceNumber, InvoiceData } from '@/lib/services/invoiceService';

interface SendPaymentRequestVariables {
  dealId: string;
  deal: BrandDeal;
  customMessage?: string;
  generateInvoice?: boolean;
  invoiceNotes?: string;
}

interface PaymentRequestResult {
  success: boolean;
  invoiceUrl?: string;
  reminderId?: string;
  error?: string;
}

export function usePaymentRequest() {
  const { profile, user } = useSession();

  const sendPaymentRequestMutation = useMutation<
    PaymentRequestResult,
    Error,
    SendPaymentRequestVariables
  >({
    mutationFn: async ({ dealId, deal, customMessage, generateInvoice = true, invoiceNotes }) => {
      if (!user || !profile) {
        throw new Error('User not authenticated');
      }

      let invoiceUrl = deal.invoice_file_url || null;

      // Generate and upload invoice if needed
      if (generateInvoice && !invoiceUrl) {
        try {
          const invoiceDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const dueDate = new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const invoiceData: InvoiceData = {
            deal,
            creatorName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
            creatorEmail: user.email,
            creatorPhone: profile.phone || undefined,
            creatorAddress: profile.location || undefined,
            invoiceNumber: generateInvoiceNumber(dealId),
            invoiceDate,
            dueDate,
            notes: invoiceNotes,
          };

          // Generate PDF
          const pdfBlob = await generateInvoicePDF(invoiceData);

          // Upload to storage
          invoiceUrl = await uploadInvoiceToStorage(pdfBlob, dealId, profile.id, supabase);

          // Update deal with invoice URL
          const { error: updateError } = await supabase
            .from('brand_deals')
            .update({ invoice_file_url: invoiceUrl } as any)
            .eq('id', dealId)
            .eq('creator_id', profile.id);

          if (updateError) {
            logger.error('Failed to update deal with invoice URL', updateError);
            // Continue anyway - invoice is uploaded
          }
        } catch (error: any) {
          logger.error('Failed to generate invoice', error);
          // Continue without invoice if generation fails
        }
      }

      // Send payment reminder via backend
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      if (!authToken) {
        throw new Error('Failed to get authentication token');
      }

      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          brandDealId: dealId,
          messageType: 'email',
          customMessage,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send payment reminder');
      }

      // Check for application-level errors
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }

      return {
        success: true,
        invoiceUrl: invoiceUrl || undefined,
      };
    },
    onSuccess: (result) => {
      toast.success('Payment request sent successfully!', {
        description: result.invoiceUrl ? 'Invoice generated and attached.' : 'Reminder sent to brand.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to send payment request', {
        description: error.message,
      });
    },
  });

  return {
    sendPaymentRequest: sendPaymentRequestMutation.mutateAsync,
    isSending: sendPaymentRequestMutation.isPending,
    error: sendPaymentRequestMutation.error,
  };
}

