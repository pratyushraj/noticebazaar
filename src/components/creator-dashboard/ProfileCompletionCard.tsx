"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { uploadFile } from '@/lib/services/fileService';
import { Progress } from '@/components/ui/progress'; // Import Progress component

const ProfileCompletionCard: React.FC = () => {
  const { user, profile, refetchProfile } = useSession();
  const updateProfileMutation = useUpdateProfile();

  const [creatorCategory, setCreatorCategory] = useState(profile?.creator_category || '');
  const [followerRange, setFollowerRange] = useState(profile?.follower_range || '');
  const [contentNiches, setContentNiches] = useState(profile?.content_niches?.join(', ') || '');
  const [bioScreenshot, setBioScreenshot] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate profile completion percentage
  const totalFields = 5; // Niche, Follower Range, Content Niches, Bio Screenshot, Portfolio Links
  let completedFields = 0;
  if (profile?.creator_category) completedFields++;
  if (profile?.follower_range) completedFields++;
  if (profile?.content_niches && profile.content_niches.length > 0) completedFields++;
  if (profile?.bio_screenshot_url) completedFields++;
  if (profile?.portfolio_links && profile.portfolio_links.length > 0) completedFields++;
  const completionPercentage = (completedFields / totalFields) * 100;

  const handleUpdateProfile = async () => {
    if (!user?.id || !profile?.id) {
      toast.error('User not logged in.');
      return;
    }

    setIsSubmitting(true);
    let bioScreenshotUrl: string | null = profile?.bio_screenshot_url || null;
    const currentPortfolioLinks: string[] = profile?.portfolio_links || [];
    const newPortfolioLinks: string[] = [];

    try {
      // Upload bio screenshot if a new one is selected
      if (bioScreenshot) {
        const uploadResult = await uploadFile(bioScreenshot, {
          category: 'document',
          userId: user.id,
          fileName: `bio-screenshot-${profile.username || user.id}`,
          folder: 'verification',
        });
        bioScreenshotUrl = uploadResult.url;
      }

      // Upload new portfolio files
      for (const file of portfolioFiles) {
        const uploadResult = await uploadFile(file, {
          category: 'document',
          userId: user.id,
          fileName: `portfolio-${file.name}`,
          folder: 'portfolio',
        });
        newPortfolioLinks.push(uploadResult.url);
      }

      const finalPayload = {
        id: profile.id,
        creator_category: creatorCategory || null,
        follower_range: followerRange || null,
        content_niches: contentNiches ? contentNiches.split(',').map((n) => n.trim()) : null,
        bio_screenshot_url: bioScreenshotUrl,
        portfolio_links: [...currentPortfolioLinks, ...newPortfolioLinks],
      };

      await updateProfileMutation.mutateAsync(finalPayload as any);
      await refetchProfile?.();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProfileComplete = completionPercentage === 100;

  if (isProfileComplete) {
    return null; // Don't show if profile is already complete
  }

  return (
    <Card className="bg-secondary/[0.06] backdrop-blur-[40px] border-border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-12">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Complete Your Profile</h2>
        <p className="text-foreground/70 mb-4">
          A <strong>100% complete profile</strong> attracts <strong className="text-info">5x more brand deals</strong> and helps you stand out!
        </p>
        <div className="flex items-center gap-2 mb-6">
          <Progress value={completionPercentage} className="h-2 flex-1" />
          <span className="text-sm font-medium text-foreground">{Math.round(completionPercentage)}% Complete</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="creator-category" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Your Niche (e.g., Fashion, Beauty, Food)
            </Label>
            <p className="text-xs text-foreground/60 mb-1">Brands search by niche to find relevant creators like you.</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
              <Input
                id="creator-category"
                value={creatorCategory}
                onChange={(e) => setCreatorCategory(e.target.value)}
                placeholder="Fashion"
                className="border-0 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
                autoCapitalize="words"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="follower-range" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Follower Range (e.g., 1K-10K, 10K-100K)
            </Label>
            <p className="text-xs text-foreground/60 mb-1">Helps brands quickly identify creators within their budget and reach.</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
              <Input
                id="follower-range"
                value={followerRange}
                onChange={(e) => setFollowerRange(e.target.value)}
                placeholder="10K-100K"
                className="border-0 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-niches" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Content Categories (comma-separated, e.g., Lifestyle, Travel)
            </Label>
            <p className="text-xs text-foreground/60 mb-1">More categories mean more ways for brands to discover your content.</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
              <Input
                id="content-niches"
                value={contentNiches}
                onChange={(e) => setContentNiches(e.target.value)}
                placeholder="Lifestyle, Travel"
                className="border-0 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
                autoCapitalize="words"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio-screenshot" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Upload Bio Screenshot (for verification)
            </Label>
            <p className="text-xs text-foreground/60 mb-1">Verifies your Instagram account and builds trust with brands.</p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
              <Input
                id="bio-screenshot"
                type="file"
                accept="image/*"
                onChange={(e) => setBioScreenshot(e.target.files ? e.target.files[0] : null)}
                className="border-0 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
              />
              {profile?.bio_screenshot_url && (
                <img src={profile.bio_screenshot_url} alt="Current Bio Screenshot" className="h-10 w-10 rounded-full object-cover" />
              )}
              {bioScreenshot && (
                <img src={URL.createObjectURL(bioScreenshot)} alt="New Bio Screenshot Preview" className="h-10 w-10 rounded-full object-cover" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio-files" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Upload Portfolio Images (Best Posts)
            </Label>
            <p className="text-xs text-foreground/60 mb-1">Showcase your best work to impress brands and land more deals.</p>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
              <Input
                id="portfolio-files"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPortfolioFiles(Array.from(e.target.files || []))}
                className="border-0 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {profile?.portfolio_links?.map((link, index) => (
                <img key={index} src={link} alt={`Portfolio ${index}`} className="h-20 w-full object-cover rounded-lg" />
              ))}
              {portfolioFiles.map((file, index) => (
                <img key={index} src={URL.createObjectURL(file)} alt={`New Portfolio ${index}`} className="h-20 w-full object-cover rounded-lg" />
              ))}
            </div>
          </div>

          <Button onClick={handleUpdateProfile} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Profile...
              </>
            ) : (
              'Save Profile Details'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCard;
