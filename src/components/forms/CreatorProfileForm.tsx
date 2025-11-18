"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Instagram, Youtube, Facebook, Twitter, Globe, DollarSign, Building2, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import AvatarUploader from '@/components/profile/AvatarUploader';
import ProfileCompletionMeter from '@/components/profile/ProfileCompletionMeter';
import CategorySelect from '@/components/profile/CategorySelect';
import ReferralCard from '@/components/profile/ReferralCard';
import SocialSyncButton from '@/components/profile/SocialSyncButton';
import { useSession } from '@/contexts/SessionContext';

interface CreatorProfileFormProps {
  initialProfile: Profile;
  onSaveSuccess?: () => void;
}

const CreatorProfileForm: React.FC<CreatorProfileFormProps> = ({ initialProfile, onSaveSuccess }) => {
  const { user, refetchProfile } = useSession();
  
  // Personal Information
  const [firstName, setFirstName] = useState(initialProfile.first_name || '');
  const [lastName, setLastName] = useState(initialProfile.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');
  
  // Creator Category
  const [creatorCategory, setCreatorCategory] = useState(initialProfile.creator_category || '');
  
  // Pricing
  const [pricingMin, setPricingMin] = useState(initialProfile.pricing_min?.toString() || '');
  const [pricingAvg, setPricingAvg] = useState(initialProfile.pricing_avg?.toString() || '');
  const [pricingMax, setPricingMax] = useState(initialProfile.pricing_max?.toString() || '');
  
  // Social Accounts
  const [instagramHandle, setInstagramHandle] = useState(initialProfile.instagram_handle || '');
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialProfile.youtube_channel_id || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialProfile.tiktok_handle || '');
  const [facebookProfileUrl, setFacebookProfileUrl] = useState(initialProfile.facebook_profile_url || '');
  const [twitterHandle, setTwitterHandle] = useState(initialProfile.twitter_handle || '');
  
  // Bank Details
  const [bankAccountName, setBankAccountName] = useState(initialProfile.bank_account_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initialProfile.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(initialProfile.bank_ifsc || '');
  const [bankUpi, setBankUpi] = useState(initialProfile.bank_upi || '');
  
  // GST & PAN
  const [gstNumber, setGstNumber] = useState(initialProfile.gst_number || '');
  const [panNumber, setPanNumber] = useState(initialProfile.pan_number || '');
  
  // Follower counts (display only, updated via sync)
  const [instagramFollowers, setInstagramFollowers] = useState(initialProfile.instagram_followers || 0);
  const [youtubeSubs, setYoutubeSubs] = useState(initialProfile.youtube_subs || 0);
  const [tiktokFollowers, setTiktokFollowers] = useState(initialProfile.tiktok_followers || 0);
  const [twitterFollowers, setTwitterFollowers] = useState(initialProfile.twitter_followers || 0);
  const [facebookFollowers, setFacebookFollowers] = useState(initialProfile.facebook_followers || 0);

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    setFirstName(initialProfile.first_name || '');
    setLastName(initialProfile.last_name || '');
    setAvatarUrl(initialProfile.avatar_url || '');
    setCreatorCategory(initialProfile.creator_category || '');
    setPricingMin(initialProfile.pricing_min?.toString() || '');
    setPricingAvg(initialProfile.pricing_avg?.toString() || '');
    setPricingMax(initialProfile.pricing_max?.toString() || '');
    setInstagramHandle(initialProfile.instagram_handle || '');
    setYoutubeChannelId(initialProfile.youtube_channel_id || '');
    setTiktokHandle(initialProfile.tiktok_handle || '');
    setFacebookProfileUrl(initialProfile.facebook_profile_url || '');
    setTwitterHandle(initialProfile.twitter_handle || '');
    setBankAccountName(initialProfile.bank_account_name || '');
    setBankAccountNumber(initialProfile.bank_account_number || '');
    setBankIfsc(initialProfile.bank_ifsc || '');
    setBankUpi(initialProfile.bank_upi || '');
    setGstNumber(initialProfile.gst_number || '');
    setPanNumber(initialProfile.pan_number || '');
    setInstagramFollowers(initialProfile.instagram_followers || 0);
    setYoutubeSubs(initialProfile.youtube_subs || 0);
    setTiktokFollowers(initialProfile.tiktok_followers || 0);
    setTwitterFollowers(initialProfile.twitter_followers || 0);
    setFacebookFollowers(initialProfile.facebook_followers || 0);
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
        creator_category: creatorCategory || null,
        pricing_min: pricingMin ? parseInt(pricingMin) : null,
        pricing_avg: pricingAvg ? parseInt(pricingAvg) : null,
        pricing_max: pricingMax ? parseInt(pricingMax) : null,
        instagram_handle: instagramHandle.trim() || null,
        youtube_channel_id: youtubeChannelId.trim() || null,
        tiktok_handle: tiktokHandle.trim() || null,
        facebook_profile_url: facebookProfileUrl.trim() || null,
        twitter_handle: twitterHandle.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_ifsc: bankIfsc.trim() || null,
        bank_upi: bankUpi.trim() || null,
        gst_number: gstNumber.trim() || null,
        pan_number: panNumber.trim() || null,
      });
      toast.success('Profile updated successfully!');
      refetchProfile?.();
      onSaveSuccess?.();
    } catch (error: any) {
      toast.error('Failed to update profile', { description: error.message });
    }
  };

  if (!user) {
    return null;
  }

  // Create updated profile for completion meter
  const currentProfile: Profile = {
    ...initialProfile,
    first_name: firstName,
    last_name: lastName,
    avatar_url: avatarUrl,
    creator_category: creatorCategory,
    pricing_avg: pricingAvg ? parseInt(pricingAvg) : null,
    instagram_handle: instagramHandle,
    youtube_channel_id: youtubeChannelId,
    bank_account_number: bankAccountNumber,
    pan_number: panNumber,
    gst_number: gstNumber,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Completion Meter */}
      <ProfileCompletionMeter profile={currentProfile} />

      {/* Personal Information */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4 pb-4 border-b border-white/10">
            <AvatarUploader
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              firstName={firstName}
              lastName={lastName}
              onUploadSuccess={(url) => {
                setAvatarUrl(url);
                // Auto-save avatar URL
                updateProfileMutation.mutate({
                  id: initialProfile.id,
                  avatar_url: url,
                });
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-white">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={updateProfileMutation.isPending}
                className="bg-[#0F121A] text-white border-white/10"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-white">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={updateProfileMutation.isPending}
                className="bg-[#0F121A] text-white border-white/10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              value={initialProfile.email || ''}
              disabled
              className="bg-[#0F121A]/50 text-white/60 border-white/10 cursor-not-allowed"
            />
            <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="role" className="text-white">Role</Label>
            <Input
              id="role"
              value={initialProfile.role || ''}
              disabled
              className="bg-[#0F121A]/50 text-white/60 border-white/10 cursor-not-allowed capitalize"
            />
            <p className="text-xs text-white/40 mt-1">Role cannot be changed</p>
          </div>

          <CategorySelect
            value={creatorCategory}
            onChange={setCreatorCategory}
            disabled={updateProfileMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Pricing Preferences */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Pricing Preferences
          </CardTitle>
          <p className="text-sm text-white/60 mt-1">Set your brand deal rates (in ₹)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pricingMin" className="text-white">Minimum Rate</Label>
              <Input
                id="pricingMin"
                type="number"
                value={pricingMin}
                onChange={(e) => setPricingMin(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., 5000"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="pricingAvg" className="text-white">Average Rate</Label>
              <Input
                id="pricingAvg"
                type="number"
                value={pricingAvg}
                onChange={(e) => setPricingAvg(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., 25000"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="pricingMax" className="text-white">Maximum Rate</Label>
              <Input
                id="pricingMax"
                type="number"
                value={pricingMax}
                onChange={(e) => setPricingMax(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., 100000"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Accounts */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Social Accounts
          </CardTitle>
          <p className="text-sm text-white/60 mt-1">Connect your social media accounts and sync follower counts</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="instagramHandle" className="text-white flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-500" />
                Instagram Handle
              </Label>
              <SocialSyncButton
                platform="instagram"
                handle={instagramHandle}
                userId={user.id}
                onSuccess={(count) => setInstagramFollowers(count)}
              />
            </div>
            <Input
              id="instagramHandle"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              disabled={updateProfileMutation.isPending}
              placeholder="e.g., @yourusername"
              className="bg-[#0F121A] text-white border-white/10"
            />
            {instagramFollowers > 0 && (
              <p className="text-xs text-white/60 mt-1">{instagramFollowers.toLocaleString()} followers</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="youtubeChannelId" className="text-white flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube Channel ID
              </Label>
              <SocialSyncButton
                platform="youtube"
                channelId={youtubeChannelId}
                userId={user.id}
                onSuccess={(count) => setYoutubeSubs(count)}
              />
            </div>
            <Input
              id="youtubeChannelId"
              value={youtubeChannelId}
              onChange={(e) => setYoutubeChannelId(e.target.value)}
              disabled={updateProfileMutation.isPending}
              placeholder="e.g., UC_x5XG1OV2P6wGrFgCPvr2w"
              className="bg-[#0F121A] text-white border-white/10"
            />
            {youtubeSubs > 0 && (
              <p className="text-xs text-white/60 mt-1">{youtubeSubs.toLocaleString()} subscribers</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="tiktokHandle" className="text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-white" />
                TikTok Handle
              </Label>
              <SocialSyncButton
                platform="tiktok"
                handle={tiktokHandle}
                userId={user.id}
                onSuccess={(count) => setTiktokFollowers(count)}
              />
            </div>
            <Input
              id="tiktokHandle"
              value={tiktokHandle}
              onChange={(e) => setTiktokHandle(e.target.value)}
              disabled={updateProfileMutation.isPending}
              placeholder="e.g., @yourusername"
              className="bg-[#0F121A] text-white border-white/10"
            />
            {tiktokFollowers > 0 && (
              <p className="text-xs text-white/60 mt-1">{tiktokFollowers.toLocaleString()} followers</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="facebookProfileUrl" className="text-white flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-500" />
                Facebook Profile URL
              </Label>
              <SocialSyncButton
                platform="facebook"
                url={facebookProfileUrl}
                userId={user.id}
                onSuccess={(count) => setFacebookFollowers(count)}
              />
            </div>
            <Input
              id="facebookProfileUrl"
              type="url"
              value={facebookProfileUrl}
              onChange={(e) => setFacebookProfileUrl(e.target.value)}
              disabled={updateProfileMutation.isPending}
              placeholder="e.g., https://facebook.com/yourprofile"
              className="bg-[#0F121A] text-white border-white/10"
            />
            {facebookFollowers > 0 && (
              <p className="text-xs text-white/60 mt-1">{facebookFollowers.toLocaleString()} followers</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="twitterHandle" className="text-white flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter Handle
              </Label>
              <SocialSyncButton
                platform="twitter"
                handle={twitterHandle}
                userId={user.id}
                onSuccess={(count) => setTwitterFollowers(count)}
              />
            </div>
            <Input
              id="twitterHandle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              disabled={updateProfileMutation.isPending}
              placeholder="e.g., @yourusername"
              className="bg-[#0F121A] text-white border-white/10"
            />
            {twitterFollowers > 0 && (
              <p className="text-xs text-white/60 mt-1">{twitterFollowers.toLocaleString()} followers</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-400" />
            Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccountName" className="text-white">Account Holder Name</Label>
              <Input
                id="bankAccountName"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., John Doe"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountNumber" className="text-white">Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., 1234567890"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankIfsc" className="text-white">IFSC Code</Label>
              <Input
                id="bankIfsc"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., SBIN0001234"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="bankUpi" className="text-white">UPI ID (Optional)</Label>
              <Input
                id="bankUpi"
                value={bankUpi}
                onChange={(e) => setBankUpi(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., yourname@paytm"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST & PAN */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-400" />
            GST & PAN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gstNumber" className="text-white">GST Number (Optional)</Label>
              <Input
                id="gstNumber"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., 29ABCDE1234F1Z5"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="panNumber" className="text-white">PAN Number (Optional)</Label>
              <Input
                id="panNumber"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                disabled={updateProfileMutation.isPending}
                placeholder="e.g., ABCDE1234F"
                className="bg-[#0F121A] text-white border-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral System */}
      <ReferralCard profile={initialProfile} />

      {/* Save Button */}
      <Button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold" 
        disabled={updateProfileMutation.isPending}
      >
        {updateProfileMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
};

export default CreatorProfileForm;

