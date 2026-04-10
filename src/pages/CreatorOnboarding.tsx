"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Instagram, Link2, Loader2, MessageCircleMore } from 'lucide-react';
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

type ProgressiveStep = 'instagram' | 'linkReady';

const toTitleCaseName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export default function CreatorOnboarding() {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [step, setStep] = useState<ProgressiveStep>('instagram');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoCopiedLinkRef = useRef(false);
  const hasAttemptedAutoFinalizeRef = useRef(false);

  const fullName = useMemo(() => {
    const fromProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    return fromProfile || user?.user_metadata?.full_name || '';
  }, [profile, user]);

  const [name] = useState(fullName || 'Creator');
  const [instagramHandle, setInstagramHandle] = useState('');

  const isGeneratedUsername = useMemo(() => {
    const u = String(profile?.username || '').trim().toLowerCase();
    return !!u && /^creator-[a-z0-9]+$/i.test(u);
  }, [profile?.username]);

  const derivedHandle = useMemo(() => {
    const fromProfile = String(profile?.instagram_handle || '').replace(/^@+/, '').trim().toLowerCase();
    const fromMetadata = String(user?.user_metadata?.instagram_handle || '').replace(/^@+/, '').trim().toLowerCase();
    const fromUsername =
      !isGeneratedUsername
        ? String(profile?.username || '').replace(/^@+/, '').trim().toLowerCase()
        : '';
    return fromProfile || fromMetadata || fromUsername || '';
  }, [profile?.instagram_handle, profile?.username, user?.user_metadata?.instagram_handle, isGeneratedUsername]);

  const metadataHandle = useMemo(() => {
    return (user?.user_metadata?.instagram_handle || '')
      .toString()
      .replace(/^@+/, '')
      .trim()
      .toLowerCase();
  }, [user?.user_metadata?.instagram_handle]);

  const persistedHandle = useMemo(() => {
    const fromProfile = String(profile?.instagram_handle || '').replace(/^@+/, '').trim().toLowerCase();
    const fromUsername =
      !isGeneratedUsername ? String(profile?.username || '').replace(/^@+/, '').trim().toLowerCase() : '';
    return fromProfile || fromUsername || '';
  }, [profile?.instagram_handle, profile?.username, isGeneratedUsername]);

  useEffect(() => {
    if (derivedHandle && !instagramHandle) {
      setInstagramHandle(derivedHandle);
    }
  }, [derivedHandle, instagramHandle]);

  useEffect(() => {
    document.title = 'Get Your Collab Link | Creator Armour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', 'Get your collab link in 1 minute. Share it with brands to receive offers.');
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!profile || profile.role !== 'creator') {
      navigate('/login', { replace: true });
      return;
    }
    if (profile.onboarding_complete) {
      navigate('/creator-dashboard', { replace: true });
      return;
    }
    if (derivedHandle) {
      setStep('linkReady');
    }
  }, [sessionLoading, profile, navigate, derivedHandle]);

  const normalizedHandle = instagramHandle.replace(/^@+/, '').trim().toLowerCase();
  const collabUrl = normalizedHandle ? `${window.location.origin}/${normalizedHandle}` : '';

  const persistLink = async (cleanHandle: string) => {
    if (!profile?.id || !user?.id) return;

    if (!cleanHandle || cleanHandle.length < 3) {
      toast.error('Enter your Instagram username');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!profile.is_trial) {
        await startTrialOnSignup(user.id);
      }

      const normalizedFullName = toTitleCaseName(name || '');
      const [firstName, ...rest] = normalizedFullName.split(' ');
      const lastName = rest.join(' ') || '';

      const basePayload = {
        id: profile.id,
        first_name: firstName || profile.first_name || 'Creator',
        last_name: lastName || profile.last_name || '',
        username: cleanHandle,
        instagram_handle: cleanHandle,
        onboarding_complete: true,
        open_to_collabs: true,
      } as const;

      const progressPatch = getCreatorProgressPatch({ ...(profile as any), ...basePayload });

      await updateProfileMutation.mutateAsync({
        ...basePayload,
        ...progressPatch,
      } as any);

      await refetchProfile?.();
      trackEvent('creator_link_ready', { creator_id: profile.id, username: cleanHandle });
      toast.success('Your collab link is ready');
      navigate('/creator-link-ready', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Could not create your collab link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLink = async () => {
    await persistLink(normalizedHandle);
  };

  useEffect(() => {
    if (
      sessionLoading ||
      !profile ||
      profile.role !== 'creator' ||
      profile.onboarding_complete ||
      !metadataHandle ||
      isSubmitting ||
      hasAttemptedAutoFinalizeRef.current
    ) {
      return;
    }

    const isGeneratedUsername =
      typeof profile.username === 'string' &&
      /^creator-[a-z0-9]+$/i.test(profile.username);

    const needsProfileHandlePersistence =
      metadataHandle !== persistedHandle || !profile.instagram_handle || isGeneratedUsername;

    if (!needsProfileHandlePersistence) {
      return;
    }

    hasAttemptedAutoFinalizeRef.current = true;
    void persistLink(metadataHandle);
  }, [
    sessionLoading,
    profile,
    metadataHandle,
    persistedHandle,
    isSubmitting,
  ]);

  const handleCopyLink = async () => {
    if (!collabUrl) return;
    await navigator.clipboard.writeText(collabUrl);
    toast.success('Link copied');
    if (!profile?.link_shared_at && profile?.id) {
      try {
        const progressPatch = getCreatorProgressPatch({ ...(profile as any), link_shared_at: new Date().toISOString() });
        await updateProfileMutation.mutateAsync({
          id: profile.id,
          link_shared_at: new Date().toISOString(),
          ...progressPatch,
        } as any);
        await refetchProfile?.();
      } catch {
        // best effort only
      }
    }
  };

  const handleShareWhatsApp = async () => {
    if (!collabUrl) return;
    const message = `Hi, you can send your offer here: ${collabUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    await handleCopyLink();
  };

  useEffect(() => {
    if (step !== 'linkReady' || hasAutoCopiedLinkRef.current || !collabUrl) return;
    hasAutoCopiedLinkRef.current = true;
    void navigator.clipboard.writeText(collabUrl).then(() => {
      toast.success('Link copied. Paste it in your next brand DM.');
    }).catch(() => {
      // Ignore clipboard errors.
    });
  }, [step, collabUrl]);

  if (sessionLoading || !profile) {
    return (
      <OnboardingContainer theme="light" allowScroll>
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="light" allowScroll>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        {step === 'instagram' && (
          <div className="mx-auto w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-8">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Creator Armour</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Create your offer link</h1>
              <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                Just add your Instagram username. You can fill the rest only when a deal needs it.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="instagram-handle" className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Instagram username
                </Label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-slate-400" />
                    <Input
                      id="instagram-handle"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="sana.reels.delhi"
                      className="border-0 bg-transparent px-0 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 shadow-none focus-visible:ring-0"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">This becomes your public link: `creatorarmour.com/{normalizedHandle || 'yourname'}`</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-slate-900">You will not be asked for a long profile now.</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  <li>Price is asked when you accept your first paid offer.</li>
                  <li>Address is asked when you accept a product deal.</li>
                  <li>UPI is asked when payment is about to happen.</li>
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">What brands will see</p>
                <div className="mt-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfa_100%)] p-4">
                  <p className="text-xl font-black text-slate-900">{name || 'Creator Name'}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">@{normalizedHandle || 'yourusername'}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Brands open your link, choose a service, and send an offer here.
                  </p>
                  <div className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Choose a Service
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">What happens next</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    'Share this link when a brand asks to work with you',
                    'The first offer appears in your dashboard',
                    'We only ask for price, address, or UPI when needed',
                  ].map((item, index) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">0{index + 1}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveLink}
                disabled={isSubmitting}
                className="h-14 w-full rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Link2 className="mr-2 h-5 w-5" />}
                Create my link
              </Button>
            </div>
          </div>
        )}

        {step === 'linkReady' && (
          <div className="mx-auto w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Almost done</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Confirm your username</h1>
                <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                  We’ll generate your link now. You can change this later.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Your username</p>
              <p className="mt-2 text-lg font-black text-slate-900">@{normalizedHandle}</p>
              <p className="mt-1 text-xs text-slate-500">Link: {collabUrl.replace(/^https?:\/\//, '')}</p>
            </div>
            <Button
              type="button"
              onClick={handleSaveLink}
              disabled={isSubmitting}
              className="mt-6 h-14 w-full rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              Create my link
            </Button>
          </div>
        )}
      </div>
    </OnboardingContainer>
  );
}
