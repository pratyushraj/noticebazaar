"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Instagram, Youtube, Facebook, Twitter, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { Profile } from '@/types';

interface SocialAccountLinkFormProps {
  initialData: Profile;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const SocialAccountLinkForm = ({ initialData, onSaveSuccess, onClose }: SocialAccountLinkFormProps) => {
  const { profile } = useSession();
  const [instagramHandle, setInstagramHandle] = useState(initialData.instagram_handle || '');
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialData.youtube_channel_id || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialData.tiktok_handle || '');
  const [facebookProfileUrl, setFacebookProfileUrl] = useState(initialData.facebook_profile_url || '');
  const [twitterHandle, setTwitterHandle] = useState(initialData.twitter_handle || '');

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setInstagramHandle(initialData.instagram_handle || '');
    setYoutubeChannelId(initialData.youtube_channel_id || '');
    setTiktokHandle(initialData.tiktok_handle || '');
    setFacebookProfileUrl(initialData.facebook_profile_url || '');
    setTwitterHandle(initialData.twitter_handle || '');
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot save social accounts.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: profile.first_name || '', // Keep existing fields
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || null,
        instagram_handle: instagramHandle.trim() || null,
        youtube_channel_id: youtubeChannelId.trim() || null,
        tiktok_handle: tiktokHandle.trim() || null,
        facebook_profile_url: facebookProfileUrl.trim() || null,
        twitter_handle: twitterHandle.trim() || null,
      });
      toast.success('Social accounts linked successfully!');
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to link social accounts', { description: error.message });
    }
  };

  const isSubmitting = updateProfileMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="instagramHandle">Instagram Handle (e.g., @yourusername)</Label>
        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="instagramHandle"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., @noticebazaar"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="youtubeChannelId">YouTube Channel ID (e.g., UC_x5XG1OV2P6wGrFgCPvr2w)</Label>
        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="youtubeChannelId"
            value={youtubeChannelId}
            onChange={(e) => setYoutubeChannelId(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., UC_x5XG1OV2P6wGrFgCPvr2w"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="tiktokHandle">TikTok Handle (e.g., @yourusername)</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> {/* Using Globe for TikTok */}
          <Input
            id="tiktokHandle"
            value={tiktokHandle}
            onChange={(e) => setTiktokHandle(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., @noticebazaar"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="facebookProfileUrl">Facebook Profile URL (Optional)</Label>
        <div className="relative">
          <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="facebookProfileUrl"
            type="url"
            value={facebookProfileUrl}
            onChange={(e) => setFacebookProfileUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., https://facebook.com/yourprofile"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="twitterHandle">Twitter Handle (Optional, e.g., @yourusername)</Label>
        <div className="relative">
          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="twitterHandle"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., @noticebazaar"
            className="pl-9"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Social Accounts'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SocialAccountLinkForm;