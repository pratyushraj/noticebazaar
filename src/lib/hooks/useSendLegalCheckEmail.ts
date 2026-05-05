import { useSupabaseMutation } from './useSupabaseMutation';
import { getApiBaseUrl } from '@/lib/utils/api';

export const useSendLegalCheckEmail = () => {
  const apiBaseUrl = getApiBaseUrl();

  return useSupabaseMutation(
    async (formData: any) => {
      const response = await fetch(`${apiBaseUrl}/api/collab/legal-check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send legal check email');
      }

      return result;
    },
    {
      errorMessage: 'Failed to notify our legal experts. Please try again.',
    }
  );
};
