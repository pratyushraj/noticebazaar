"use client";

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Instagram, Link2, Loader2, MessageCircleMore, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { startTrialOnSignup } from '@/lib/trial';
import { trackEvent } from '@/lib/utils/analytics';
import { getCreatorProgressPatch } from '@/lib/creatorProfileCompletion';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProgressiveStep = 'instagram' | 'pricing' | 'linkReady';

const toTitleCaseName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const getPricingSuggestion = (followers: number) => {
  if (followers >= 100000) return 'Creators with 100K followers typically charge ₹12,000 – ₹25,000 per reel.';
  if (followers >= 50000) return 'Creators with 50K followers typically charge ₹6,000 – ₹12,000 per reel.';
  if (followers >= 25000) return 'Creators with 25K followers typically charge ₹3,000 – ₹6,000 per reel.';
  if (followers >= 10000) return 'Creators with 10K followers typically charge ₹1,500 – ₹3,500 per reel.';
  return 'Creators in your follower range typically charge ₹1,000 – ₹3,000 per reel.';
};

export default function CreatorOnboarding() {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [step, setStep] = useState<ProgressiveStep>('instagram');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullName = useMemo(() => {
    const fromProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    return fromProfile || user?.user_metadata?.full_name || '';
  }, [profile, user]);

  const [name] = useState(fullName || 'Creator');
  const [instagramHandle, setInstagramHandle] = useState(() => {
    return (
      (profile?.instagram_handle || profile?.username || user?.user_metadata?.instagram_handle || '')
        .toString()
        .replace(/^@+/, '')
        .trim()
        .toLowerCase()
    );
  });
  const [reelPrice, setReelPrice] = useState(String((profile as any)?.reel_price || profile?.avg_rate_reel || ''));
  const [storyPrice, setStoryPrice] = useState(String((profile as any)?.story_price || profile?.typical_story_rate || ''));
  const [acceptsBarter, setAcceptsBarter] = useState(Boolean((profile as any)?.barter_min_value || profile?.suggested_barter_value_min));
  const [deliveryDays, setDeliveryDays] = useState(String((profile as any)?.delivery_days || profile?.min_lead_time_days || 3));

  useEffect(() => {
    document.title = 'Creator Onboarding | Creator Armour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', 'Get your collab link live, set your starting rates, and start sharing Creator Armour with brands.');
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!profile || profile.role !== 'creator') {
      navigate('/login', { replace: true });
      return;
    }
    if (profile.onboarding_complete) {
      navigate('/creator-dashboard', { replace: true });
    }
  }, [sessionLoading, profile, navigate]);

  const collabLink = instagramHandle ? `creatorarmour.com/@${instagramHandle}` : 'creatorarmour.com/@yourhandle';
  const publicLink = instagramHandle ? `${window.location.origin}/${instagramHandle}` : null;
  const followersForSuggestion = Number((profile as any)?.followers_count || profile?.instagram_followers || 25000);
  const pricingSuggestion = getPricingSuggestion(followersForSuggestion);

  const persistCreatorSetup = async (markComplete: boolean, extras?: Record<string, unknown>) => {
    if (!profile?.id || !instagramHandle) return;

    const normalizedFullName = toTitleCaseName(name);
    const nameParts = normalizedFullName.split(' ');
    const basePayload = {
      first_name: nameParts[0] || profile.first_name || 'Creator',
      last_name: nameParts.slice(1).join(' ') || profile.last_name || null,
      instagram_handle: instagramHandle,
      username: instagramHandle,
      avg_rate_reel: Number(reelPrice) || null,
      reel_price: Number(reelPrice) || null,
      story_price: Number(storyPrice) || null,
      typical_story_rate: Number(storyPrice) || null,
      delivery_days: Number(deliveryDays) || 3,
      min_lead_time_days: Number(deliveryDays) || 3,
      barter_min_value: acceptsBarter ? Math.max(Number((profile as any)?.barter_min_value || 2500), 2500) : null,
      suggested_barter_value_min: acceptsBarter ? Math.max(Number((profile as any)?.barter_min_value || 2500), 2500) : null,
      onboarding_complete: markComplete,
      ...extras,
    };
    const progressPatch = getCreatorProgressPatch({ ...(profile as any), ...basePayload });

    await updateProfileMutation.mutateAsync({
      id: profile.id,
      ...basePayload,
      ...progressPatch,
    } as any);

    if (markComplete && !profile.is_trial && user?.id) {
      await startTrialOnSignup(user.id);
    }
    refetchProfile();
  };

  const handleShareLink = async (mode: 'copy' | 'whatsapp') => {
    if (!publicLink) return;

    if (mode === 'copy') {
      await navigator.clipboard.writeText(publicLink);
      toast.success('Collab link copied');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check my Creator Armour collab link: ${publicLink}`)}`, '_blank', 'noopener,noreferrer');
    }

    await persistCreatorSetup(false, {
      link_shared_at: profile?.link_shared_at || new Date().toISOString(),
    });
    void trackEvent('creators_shared_link', { creator_id: profile?.id, mode });
  };

  const completeOnboarding = async (withRates: boolean) => {
    if (!instagramHandle) {
      toast.error('Instagram handle is required to create your collab link');
      return;
    }

    if (withRates && !Number(reelPrice)) {
      toast.error('Add your starting reel price to continue');
      return;
    }

    setIsSubmitting(true);
    try {
      await persistCreatorSetup(true);
      if (withRates) {
        void trackEvent('creators_set_price', {
          creator_id: profile.id,
          has_story_price: Number(storyPrice) > 0,
        });
      }
      void trackEvent('creator_progressive_onboarding_completed', {
        has_story_price: Number(storyPrice) > 0,
        accepts_barter: acceptsBarter,
      });
      navigate('/creator-dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to finish onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionLoading || !profile) {
    return (
      <OnboardingContainer theme="light">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
            <p className="text-slate-600">Preparing your collab link...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="light">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center gap-6 p-6 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Creator Armour</p>
          <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {step === 'instagram'
              ? 'Add Your Instagram Handle'
              : step === 'pricing'
                ? 'Set Your Reel Price'
                : 'Your Collab Link Is Ready'}
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            {step === 'instagram'
              ? 'This creates your collab page link so brands know where to send offers.'
              : step === 'pricing'
                ? 'Start simple. Add the reel price you already quote in DMs. You can improve the rest later.'
                : 'Share this link with brands instead of explaining everything again in Instagram DMs.'}
          </p>
          <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-5 shadow-[0_22px_60px_rgba(16,185,129,0.12)]">
            {step === 'instagram' ? (
              <div className="space-y-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                  <Instagram className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-handle">Instagram handle</Label>
                  <Input
                    id="instagram-handle"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value.replace(/^@+/, '').trim().toLowerCase())}
                    placeholder="yourhandle"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  <p className="text-xs text-slate-500">Your collab page will look like `creatorarmour.com/@{instagramHandle || 'yourhandle'}`</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setStep('pricing')}
                    disabled={!instagramHandle}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : step === 'linkReady' ? (
              <div className="space-y-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                  <Link2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live Collab Link</p>
                  <p className="mt-2 break-all text-2xl font-black text-slate-900">{collabLink}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void handleShareLink('copy')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button type="button" variant="outline" className="border-slate-200 bg-white hover:bg-slate-50" onClick={() => void handleShareLink('whatsapp')}>
                    <MessageCircleMore className="mr-2 h-4 w-4" />
                    Share on WhatsApp
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => void completeOnboarding(true)}>
                    Go To Your Deals
                  </Button>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Your collab page is live. You can now share it and manage deals from one place.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {pricingSuggestion}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reel-price">Reel price</Label>
                    <Input id="reel-price" value={reelPrice} onChange={(e) => setReelPrice(e.target.value)} inputMode="numeric" placeholder="5000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story-price">Story price (optional)</Label>
                    <Input id="story-price" value={storyPrice} onChange={(e) => setStoryPrice(e.target.value)} inputMode="numeric" placeholder="2000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-days">Days to make content</Label>
                    <Input id="delivery-days" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} inputMode="numeric" placeholder="7" />
                    <p className="text-xs text-slate-500">Brands will see this timeline</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Accept free products as payment?</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={acceptsBarter ? 'default' : 'outline'} className={acceptsBarter ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border-slate-200 bg-white'} onClick={() => setAcceptsBarter(true)}>Yes</Button>
                      <Button type="button" variant={!acceptsBarter ? 'default' : 'outline'} className={!acceptsBarter ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border-slate-200 bg-white'} onClick={() => setAcceptsBarter(false)}>No</Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setStep('linkReady')}
                    disabled={isSubmitting || !Number(reelPrice)}
                  >
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => setStep('instagram')}>
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
          <div className="rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">What Brands Will See</p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-2xl font-black">{name}</p>
                <p className="text-sm text-emerald-200">@{instagramHandle || 'yourhandle'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">Starting Rates</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Reel</span>
                    <span className="font-bold">{Number(reelPrice) > 0 ? `₹${Number(reelPrice).toLocaleString('en-IN')}` : 'Add rate'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Story</span>
                    <span className="font-bold">{Number(storyPrice) > 0 ? `₹${Number(storyPrice).toLocaleString('en-IN')}` : 'Optional'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Days to make content</span>
                    <span className="font-bold">{deliveryDays || '3'} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Free products as payment</span>
                    <span className="font-bold">{acceptsBarter ? 'Accepted' : 'Not now'}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                You will add bio, category, city, languages, and past brand work later from Edit Profile if you need it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
