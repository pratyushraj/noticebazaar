import { useState } from 'react';
import { toast } from 'sonner';

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

export const useNativeShare = () => {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (data: ShareData) => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(data.url);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
      return;
    }

    try {
      setIsSharing(true);
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      toast.success('Shared successfully!');
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing };
};

