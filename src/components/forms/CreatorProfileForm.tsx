"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, MessageSquareText, Shapes, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import type { Profile } from '@/types';

interface CreatorProfileFormProps {
  initialProfile: Profile;
  onSaveSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Tech',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Education',
  'Finance',
  'Health',
  'Parenting',
];

const toLines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const CreatorProfileForm: React.FC<CreatorProfileFormProps> = ({ initialProfile, onSaveSuccess }) => {
  const { user, refetchProfile } = useSession();
  const updateProfileMutation = useUpdateProfile();

  const [bio, setBio] = useState(initialProfile.bio || initialProfile.collab_intro_line || '');
  const [category, setCategory] = useState(initialProfile.creator_category || '');
  const [city, setCity] = useState(initialProfile.city || initialProfile.collab_region_label || '');
  const [languages, setLanguages] = useState(initialProfile.language || initialProfile.primary_audience_language || '');
  const [pastBrandWork, setPastBrandWork] = useState(
    Array.isArray(initialProfile.past_collabs) ? initialProfile.past_collabs.join('\n') : '',
  );

  useEffect(() => {
    setBio(initialProfile.bio || initialProfile.collab_intro_line || '');
    setCategory(initialProfile.creator_category || '');
    setCity(initialProfile.city || initialProfile.collab_region_label || '');
    setLanguages(initialProfile.language || initialProfile.primary_audience_language || '');
    setPastBrandWork(Array.isArray(initialProfile.past_collabs) ? initialProfile.past_collabs.join('\n') : '');
  }, [initialProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!bio.trim() || !category.trim() || !city.trim() || !languages.trim()) {
      toast.error('Please complete bio, category, city, and languages.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: initialProfile.id,
        bio: bio.trim(),
        collab_intro_line: bio.trim(),
        creator_category: category.trim(),
        city: city.trim(),
        collab_region_label: city.trim(),
        language: languages.trim(),
        primary_audience_language: languages.trim(),
        past_collabs: pastBrandWork.trim() ? toLines(pastBrandWork) : null,
      } as any);

      // Silent save — no toast on every auto-save to avoid flooding the UI
      await refetchProfile?.();
      onSaveSuccess?.();
    } catch (error: any) {
      toast.error('Failed to update profile', { description: error?.message });
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Edit Profile
          </CardTitle>
          <p className="text-sm text-slate-600">
            Keep this simple. Brands only need the basics to understand your collab page.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="creator-bio" className="flex items-center gap-2 text-slate-800">
              <MessageSquareText className="h-4 w-4 text-emerald-500" />
              Bio
            </Label>
            <Textarea
              id="creator-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              placeholder="Tell brands what you create and the kind of collaborations that suit you."
              className="border-slate-200"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creator-category" className="flex items-center gap-2 text-slate-800">
                <Shapes className="h-4 w-4 text-emerald-500" />
                Category
              </Label>
              <select
                id="creator-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator-city" className="flex items-center gap-2 text-slate-800">
                <MapPin className="h-4 w-4 text-emerald-500" />
                City
              </Label>
              <Input
                id="creator-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Mumbai"
                className="border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator-languages" className="text-slate-800">Languages</Label>
            <Input
              id="creator-languages"
              value={languages}
              onChange={(event) => setLanguages(event.target.value)}
              placeholder="Hindi, English, Hinglish"
              className="border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="past-brand-work" className="text-slate-800">Past brand work (optional)</Label>
            <Textarea
              id="past-brand-work"
              value={pastBrandWork}
              onChange={(event) => setPastBrandWork(event.target.value)}
              rows={4}
              placeholder="Add one brand per line"
              className="border-slate-200"
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Advanced settings stay optional. Creators should be able to share their collab page without filling everything else first.
          </div>

          <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default CreatorProfileForm;
