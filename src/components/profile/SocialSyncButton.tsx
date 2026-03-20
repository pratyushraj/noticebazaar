"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchInstagramStats, fetchYouTubeStats, fetchTikTokStats, fetchTwitterStats, fetchFacebookStats } from '@/lib/utils/socialStats';
import { supabase } from '@/integrations/supabase/client';

interface SocialSyncButtonProps {
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'facebook';
  handle?: string | null;
  channelId?: string | null;
  url?: string | null;
  userId: string;
  onSuccess?: (count: number) => void;
}

const SocialSyncButton: React.FC<SocialSyncButtonProps> = ({
  platform,
  handle,
  channelId,
  url,
  userId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const handleSync = async () => {
    if (!handle && !channelId && !url) {
      toast.error(`Please enter your ${platform} handle first`);
      return;
    }

    setIsLoading(true);
    try {
      let stats;
      
      switch (platform) {
        case 'instagram':
          stats = await fetchInstagramStats(handle!.replace('@', ''));
          if (stats.followers) {
            await updateFollowerCount('instagram_followers', stats.followers);
            onSuccess?.(stats.followers);
          }
          break;
        case 'youtube':
          stats = await fetchYouTubeStats(channelId!);
          if (stats.subscribers) {
            await updateFollowerCount('youtube_subs', stats.subscribers);
            onSuccess?.(stats.subscribers);
          }
          break;
        case 'tiktok':
          stats = await fetchTikTokStats(handle!.replace('@', ''));
          if (stats.followers) {
            await updateFollowerCount('tiktok_followers', stats.followers);
            onSuccess?.(stats.followers);
          }
          break;
        case 'twitter':
          stats = await fetchTwitterStats(handle!.replace('@', ''));
          if (stats.followers) {
            await updateFollowerCount('twitter_followers', stats.followers);
            onSuccess?.(stats.followers);
          }
          break;
        case 'facebook':
          stats = await fetchFacebookStats(url!);
          if (stats.followers) {
            await updateFollowerCount('facebook_followers', stats.followers);
            onSuccess?.(stats.followers);
          }
          break;
      }

      setLastSynced(new Date());
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} stats updated!`);
    } catch (error: any) {
      console.error(`Error syncing ${platform}:`, error);
      toast.error(`Failed to sync ${platform} stats`, { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFollowerCount = async (field: string, count: number) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: count })
      .eq('id', userId);

    if (error) throw error;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isLoading || (!handle && !channelId && !url)}
        className="border-white/20 text-white hover:bg-white/10 h-8"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3 mr-1" />
        )}
        Sync
      </Button>
      {lastSynced && (
        <span className="text-xs text-white/40">Synced</span>
      )}
    </div>
  );
};

export default SocialSyncButton;

