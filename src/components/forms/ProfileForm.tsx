"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Instagram, Youtube, Facebook, Twitter, Globe } from 'lucide-react'; // NEW: Import social media icons
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar'; // Import DEFAULT_AVATAR_URL
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileFormProps {
  initialProfile: Profile;
  onSaveSuccess?: () => void;
  isAdminView?: boolean;
}

const ProfileForm = ({ initialProfile, onSaveSuccess, isAdminView = false }: ProfileFormProps) => {
  const [firstName, setFirstName] = useState(initialProfile.first_name || '');
  const [lastName, setLastName] = useState(initialProfile.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');
  const [role, setRole] = useState<'client' | 'admin' | 'chartered_accountant' | 'creator'>(initialProfile.role); // Updated role type
  // NEW: Social media states
  const [instagramHandle, setInstagramHandle] = useState(initialProfile.instagram_handle || '');
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialProfile.youtube_channel_id || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialProfile.tiktok_handle || '');
  const [facebookProfileUrl, setFacebookProfileUrl] = useState(initialProfile.facebook_profile_url || '');
  const [twitterHandle, setTwitterHandle] = useState(initialProfile.twitter_handle || '');

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setFirstName(initialProfile.first_name || '');
    setLastName(initialProfile.last_name || '');
    setAvatarUrl(initialProfile.avatar_url || '');
    setRole(initialProfile.role);
    // NEW: Set social media states from initialProfile
    setInstagramHandle(initialProfile.instagram_handle || '');
    setYoutubeChannelId(initialProfile.youtube_channel_id || '');
    setTiktokHandle(initialProfile.tiktok_handle || '');
    setFacebookProfileUrl(initialProfile.facebook_profile_url || '');
    setTwitterHandle(initialProfile.twitter_handle || '');
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: initialProfile.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUrl.trim() || null,
        role: role, // Include role in the update
        // NEW: Include social media handles in the update
        instagram_handle: instagramHandle.trim() || null,
        youtube_channel_id: youtubeChannelId.trim() || null,
        tiktok_handle: tiktokHandle.trim() || null,
        facebook_profile_url: facebookProfileUrl.trim() || null,
        twitter_handle: twitterHandle.trim() || null,
      });
      toast.success('Profile updated successfully!');
      onSaveSuccess?.();
    } catch (error: any) {
      toast.error('Failed to update profile', { description: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || DEFAULT_AVATAR_URL} alt={`${firstName} ${lastName}`} />
          <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
            {getInitials(firstName, lastName)}
          </AvatarFallback>
        </Avatar>
        {isAdminView && <p className="text-sm text-muted-foreground">Email: {initialProfile.email}</p>} {/* Display email for admin view */}
        {isAdminView && <p className="text-sm text-muted-foreground">Current Role: {initialProfile.role}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-foreground">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={updateProfileMutation.isPending}
            className="bg-input text-foreground border-border"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={updateProfileMutation.isPending}
            className="bg-input text-foreground border-border"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="avatarUrl" className="text-foreground">Avatar URL (Optional)</Label>
        <Input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="Enter URL for your profile picture"
          className="bg-input text-foreground border-border"
          disabled={updateProfileMutation.isPending}
        />
      </div>
      {isAdminView && (
        <div>
          <Label htmlFor="role" className="text-foreground">Role</Label>
          <Select onValueChange={(value: 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer') => setRole(value)} value={role} disabled={updateProfileMutation.isPending}>
            <SelectTrigger id="role" className="bg-input text-foreground border-border">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="chartered_accountant">Chartered Accountant</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
              <SelectItem value="lawyer">Lawyer</SelectItem> {/* New: Lawyer role */}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* NEW: Social Media Fields (only for Creator role or if isAdminView) */}
      {(initialProfile.role === 'creator' || isAdminView) && (
        <div className="space-y-4 border-t border-border pt-4 mt-4">
          <h3 className="text-lg font-semibold text-foreground">Social Accounts</h3>
          <div>
            <Label htmlFor="instagramHandle">Instagram Handle</Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="instagramHandle"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., @yourusername"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="youtubeChannelId">YouTube Channel ID</Label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="youtubeChannelId"
                value={youtubeChannelId}
                onChange={(e) => setYoutubeChannelId(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., UC_x5XG1OV2P6wGrFgCPvr2w"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tiktokHandle">TikTok Handle</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tiktokHandle"
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., @yourusername"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="facebookProfileUrl">Facebook Profile URL</Label>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="facebookProfileUrl"
                type="url"
                value={facebookProfileUrl}
                onChange={(e) => setFacebookProfileUrl(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., https://facebook.com/yourprofile"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="twitterHandle">Twitter Handle</Label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="twitterHandle"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., @yourusername"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={updateProfileMutation.isPending}>
        {updateProfileMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
};

export default ProfileForm;