import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useSession } from '@/contexts/SessionContext';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { logger } from '@/lib/utils/logger';

interface SendBrandMessageVariables {
  brandName: string;
  brandEmail?: string;
  dealId?: string;
  text: string;
  attachments?: File[];
  type?: 'brand_message' | 'deliverable_question' | 'payment_question' | 'general';
}

export const useSendBrandMessage = () => {
  const queryClient = useQueryClient();
  const { profile } = useSession();

  return useSupabaseMutation<void, Error, SendBrandMessageVariables>(
    async ({ brandName, brandEmail, dealId, text, attachments = [], type = 'brand_message' }) => {
      if (!profile?.id) {
        throw new Error('Creator profile not found. Please sign in again.');
      }

      // Upload attachments to Supabase Storage
      const attachmentUrls: Array<{ url: string; name: string; type: string }> = [];

      for (const file of attachments) {
        try {
          const fileExtension = file.name.split('.').pop();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `${profile.id}/brand_messages/${Date.now()}-${sanitizedName}`;

          const { error: uploadError } = await supabase.storage
            .from(CREATOR_ASSETS_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            logger.error('Failed to upload attachment', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabase.storage
            .from(CREATOR_ASSETS_BUCKET)
            .getPublicUrl(filePath);

          if (!publicUrlData?.publicUrl) {
            throw new Error(`Failed to get public URL for ${file.name}`);
          }

          attachmentUrls.push({
            url: publicUrlData.publicUrl,
            name: file.name,
            type: file.type,
          });
        } catch (error: any) {
          logger.error('Error uploading attachment', error);
          throw error;
        }
      }

      // Insert message into brand_messages table
      const { error: insertError } = await supabase
        .from('brand_messages')
        .insert({
          creator_id: profile.id,
          deal_id: dealId || null,
          text,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : [],
          brand_name: brandName,
          brand_email: brandEmail || null,
          source: 'creator',
          status: 'pending',
          type,
          email_sent: false, // Will be set to true by backend trigger or webhook
        });

      if (insertError) {
        logger.error('Failed to insert brand message', insertError);
        throw new Error(`Failed to send message: ${insertError.message}`);
      }

      // TODO: Trigger email notification to brand
      // This can be done via:
      // 1. Supabase Edge Function (recommended)
      // 2. Database trigger + pg_notify
      // 3. External webhook (Zapier, Make.com, etc.)
      
      logger.info('Brand message sent successfully', {
        brandName,
        dealId,
        hasAttachments: attachmentUrls.length > 0,
      });
    },
    {
      onSuccess: () => {
        // Invalidate messages queries to refresh the messages page
        queryClient.invalidateQueries({ queryKey: ['brand_messages'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      },
      successMessage: 'Message sent successfully!',
      errorMessage: 'Failed to send message',
    }
  );
};

