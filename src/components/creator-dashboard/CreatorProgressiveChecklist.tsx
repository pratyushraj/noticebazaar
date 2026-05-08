

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Circle, Copy, ExternalLink, Gauge, Link2, MessageCircleMore, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { trackEvent } from '@/lib/utils/analytics';
import type { Profile } from '@/types';
import {
  getCreatorCompletionMetrics,
  getCreatorLifecycleMetrics,
  getCreatorNudges,
  getCreatorProgressPatch,
  type CreatorChecklistItem,
} from '@/lib/creatorProfileCompletion';

interface CreatorProgressiveChecklistProps {
  profile: Profile | null | undefined;
  offersReceived?: number;
  offersAccepted?: number;
  totalDeals?: number;
  completedDeals?: number;
  totalEarnings?: number;
  storefrontViews?: number;
}

type ChecklistFormState = {
  bio: string;
  reelPrice: string;
  storyPrice: string;
  city: string;
  language: string;
  niche: string;
  followers: string;
  avgViews: string;
  audienceType: string;
  topCities: string;
  pastCollabs: string;
  brandLogos: string;
  upiId: string;
  takesAdvance: boolean;
  packageName: string;
  packagePrice: string;
  mediaKitUrl: string;
  testimonials: string;
};

const STAGE_LABELS: Record<string, string> = {
  new: 'New creator',
  priced: 'Priced',
  link_shared: 'Link shared',
  first_offer: 'First offer',
  first_deal: 'First deal',
  active: 'Active creator',
  power: 'Power creator',
};

const toLines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);

export function CreatorProgressiveChecklist({
  profile,
  offersReceived = 0,
  offersAccepted = 0,
  totalDeals = 0,
  completedDeals = 0,
  totalEarnings = 0,
  storefrontViews = 0,
}: CreatorProgressiveChecklistProps) {
  const updateProfileMutation = useUpdateProfile();
  const [selectedItem, setSelectedItem] = useState<CreatorChecklistItem | null>(null);
  const context = useMemo(() => ({
    offersReceived,
    offersAccepted,
    totalDeals,
    completedDeals,
    totalEarnings,
    storefrontViews,
  }), [offersReceived, offersAccepted, totalDeals, completedDeals, totalEarnings, storefrontViews]);

  const completion = useMemo(() => getCreatorCompletionMetrics(profile), [profile]);
  const lifecycle = useMemo(() => getCreatorLifecycleMetrics(profile, context), [profile, context]);
  const nudges = useMemo(() => getCreatorNudges(profile, context), [profile, context]);
  const pendingItems = completion.items.filter((item) => !item.complete);
  const showCompactChecklist = ['new', 'priced', 'link_shared'].includes(lifecycle.creatorStage);
  const visiblePendingItems = showCompactChecklist ? pendingItems.slice(0, 3) : pendingItems;

  const [formState, setFormState] = useState<ChecklistFormState>(() => ({
    bio: profile?.bio || profile?.collab_intro_line || '',
    reelPrice: String((profile as any)?.reel_price || profile?.avg_rate_reel || ''),
    storyPrice: String((profile as any)?.story_price || profile?.typical_story_rate || ''),
    city: (profile as any)?.city || profile?.collab_region_label || (Array.isArray(profile?.top_cities) ? profile.top_cities[0] : '') || '',
    language: (profile as any)?.language || profile?.primary_audience_language || '',
    niche: (profile as any)?.niche || (Array.isArray(profile?.content_niches) ? profile.content_niches.join(', ') : ''),
    followers: String((profile as any)?.followers_count || profile?.instagram_followers || ''),
    avgViews: String((profile as any)?.avg_views || profile?.avg_reel_views_manual || ''),
    audienceType: (profile as any)?.audience_type || '',
    topCities: Array.isArray(profile?.top_cities) ? profile.top_cities.join(', ') : '',
    pastCollabs: Array.isArray((profile as any)?.past_collabs) ? (profile as any).past_collabs.join('\n') : '',
    brandLogos: Array.isArray((profile as any)?.brand_logos) ? (profile as any).brand_logos.join('\n') : '',
    upiId: (profile as any)?.upi_id || profile?.bank_upi || '',
    takesAdvance: Boolean((profile as any)?.takes_advance),
    packageName: profile?.deal_templates?.[0]?.name || '',
    packagePrice: String(profile?.deal_templates?.[0]?.rate || ''),
    mediaKitUrl: profile?.media_kit_url || '',
    testimonials: Array.isArray((profile as any)?.testimonials)
      ? (profile as any).testimonials.join('\n')
      : Array.isArray((profile as any)?.case_studies)
        ? (profile as any).case_studies.join('\n')
        : '',
  }));

  const collabHandle = (profile?.instagram_handle || profile?.username || '').replace(/^@/, '').trim();
  const collabUrl = collabHandle ? `${window.location.origin}/${collabHandle}` : null;

  const setField = (key: keyof ChecklistFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = async (payload: Record<string, unknown>) => {
    if (!profile?.id) return;

    const nextProfile = { ...(profile as any), ...payload };
    const progressPatch = getCreatorProgressPatch(nextProfile, context);

    await updateProfileMutation.mutateAsync({
      id: profile.id,
      ...payload,
      ...progressPatch,
      last_active_at: new Date().toISOString(),
    } as any);
  };

  const handleShareLink = async (mode: 'copy' | 'whatsapp' | 'open') => {
    if (!collabUrl || !profile?.id) return;

    if (mode === 'copy') {
      await navigator.clipboard.writeText(collabUrl);
      toast.success('Collab link copied');
    }

    if (mode === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check my Creator Armour collab page: ${collabUrl}`)}`, '_blank', 'noopener,noreferrer');
    }

    if (mode === 'open') {
      window.open(collabUrl, '_blank', 'noopener,noreferrer');
    }

    if (!profile.link_shared_at || profile.creator_stage === 'new' || profile.creator_stage === 'priced') {
      await saveProfile({
        link_shared_at: profile.link_shared_at || new Date().toISOString(),
      });
      void trackEvent('creators_shared_link', { mode, creator_id: profile.id });
    }
  };

  const handleSave = async () => {
    if (!profile?.id || !selectedItem) return;

    const payload: Record<string, unknown> = {};

    switch (selectedItem.id) {
      case 'pricing':
        payload.avg_rate_reel = Number(formState.reelPrice) || null;
        payload.reel_price = Number(formState.reelPrice) || null;
        payload.story_price = Number(formState.storyPrice) || null;
        payload.typical_story_rate = Number(formState.storyPrice) || null;
        break;
      case 'intro':
        payload.bio = formState.bio.trim() || null;
        payload.collab_intro_line = formState.bio.trim() || null;
        break;
      case 'audience':
        payload.collab_region_label = formState.city.trim() || null;
        payload.primary_audience_language = formState.language.trim() || null;
        payload.content_niches = toLines(formState.niche.replace(/,/g, '\n'));
        payload.top_cities = toLines(formState.topCities.replace(/,/g, '\n'));
        payload.instagram_followers = Number(formState.followers) || null;
        payload.followers_count = Number(formState.followers) || null;
        payload.avg_reel_views_manual = Number(formState.avgViews) || null;
        payload.avg_views = Number(formState.avgViews) || null;
        payload.audience_type = formState.audienceType.trim() || null;
        payload.city = formState.city.trim() || null;
        payload.language = formState.language.trim() || null;
        payload.niche = formState.niche.split(',')[0]?.trim() || null;
        break;
      case 'past_work':
        payload.past_collabs = toLines(formState.pastCollabs);
        payload.brand_logos = toLines(formState.brandLogos);
        break;
      case 'payout':
        payload.bank_upi = formState.upiId.trim() || null;
        payload.upi_id = formState.upiId.trim() || null;
        payload.takes_advance = formState.takesAdvance;
        break;
      case 'packages':
        payload.deal_templates = formState.packageName.trim()
          ? [{
              id: 'starter-package',
              name: formState.packageName.trim(),
              rate: Number(formState.packagePrice) || null,
              turnaround_days: (profile as any)?.delivery_days || 3,
            }]
          : [];
        break;
      case 'media_kit':
        payload.media_kit_url = formState.mediaKitUrl.trim() || null;
        break;
      case 'testimonials':
        payload.testimonials = toLines(formState.testimonials);
        break;
      default:
        break;
    }

    await saveProfile(payload);

    if (selectedItem.id === 'pricing') {
      void trackEvent('creators_set_price', {
        creator_id: profile.id,
        has_story_price: Number(formState.storyPrice) > 0,
      });
    }

    toast.success(`${selectedItem.title} saved`);
    setSelectedItem(null);
  };

  const renderFields = () => {
    switch (selectedItem?.id) {
      case 'pricing':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reel-price">Reel price</Label>
              <Input id="reel-price" value={formState.reelPrice} onChange={(e) => setField('reelPrice', e.target.value)} inputMode="numeric" placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story-price">Story price</Label>
              <Input id="story-price" value={formState.storyPrice} onChange={(e) => setField('storyPrice', e.target.value)} inputMode="numeric" placeholder="2000" />
            </div>
          </div>
        );
      case 'intro':
        return (
          <div className="space-y-2">
            <Label htmlFor="creator-intro">Short intro</Label>
            <Textarea id="creator-intro" value={formState.bio} onChange={(e) => setField('bio', e.target.value)} rows={4} placeholder="Fashion creator sharing high-conversion reels and stories for beauty, lifestyle, and launch campaigns." />
          </div>
        );
      case 'audience':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formState.city} onChange={(e) => setField('city', e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" value={formState.language} onChange={(e) => setField('language', e.target.value)} placeholder="English / Hinglish" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" value={formState.niche} onChange={(e) => setField('niche', e.target.value)} placeholder="Fashion, Lifestyle" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience-type">Audience type</Label>
              <Input id="audience-type" value={formState.audienceType} onChange={(e) => setField('audienceType', e.target.value)} placeholder="Women 18-30 in metro cities" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followers">Followers</Label>
              <Input id="followers" value={formState.followers} onChange={(e) => setField('followers', e.target.value)} inputMode="numeric" placeholder="25000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg-views">Average views</Label>
              <Input id="avg-views" value={formState.avgViews} onChange={(e) => setField('avgViews', e.target.value)} inputMode="numeric" placeholder="12000" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="top-cities">Top cities</Label>
              <Input id="top-cities" value={formState.topCities} onChange={(e) => setField('topCities', e.target.value)} placeholder="Mumbai, Delhi, Bengaluru" />
            </div>
          </div>
        );
      case 'past_work':
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="past-collabs">Past collaborations</Label>
              <Textarea id="past-collabs" value={formState.pastCollabs} onChange={(e) => setField('pastCollabs', e.target.value)} rows={4} placeholder="Nykaa\nMamaearth\nSugar Cosmetics" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logos">Brand logo URLs</Label>
              <Textarea id="brand-logos" value={formState.brandLogos} onChange={(e) => setField('brandLogos', e.target.value)} rows={3} placeholder="https://..." />
            </div>
          </div>
        );
      case 'payout':
        return (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input id="upi-id" value={formState.upiId} onChange={(e) => setField('upiId', e.target.value)} placeholder="yourname@oksbi" autoComplete="off" />
            </div>
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input type="checkbox" checked={formState.takesAdvance} onChange={(e) => setField('takesAdvance', e.target.checked)} />
              I usually take an advance before posting.
            </label>
          </div>
        );
      case 'packages':
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Package name</Label>
              <Input id="pkg-name" value={formState.packageName} onChange={(e) => setField('packageName', e.target.value)} placeholder="1 Reel + 3 Stories" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Package price</Label>
              <Input id="pkg-price" value={formState.packagePrice} onChange={(e) => setField('packagePrice', e.target.value)} inputMode="numeric" placeholder="9000" />
            </div>
          </div>
        );
      case 'media_kit':
        return (
          <div className="space-y-2">
            <Label htmlFor="media-kit">Media kit URL</Label>
            <Input id="media-kit" value={formState.mediaKitUrl} onChange={(e) => setField('mediaKitUrl', e.target.value)} placeholder="https://notion.site/... or Drive link" />
          </div>
        );
      case 'testimonials':
        return (
          <div className="space-y-2">
            <Label htmlFor="testimonials">Testimonials or case studies</Label>
            <Textarea id="testimonials" value={formState.testimonials} onChange={(e) => setField('testimonials', e.target.value)} rows={4} placeholder="Great turnaround and strong conversions.\nEasy to work with and delivered on time." />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-border bg-[#111827]/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">Creator Lifecycle</p>
            <div>
              <h2 className="text-2xl font-black text-foreground">Your collab page is {completion.profileCompletion}% complete.</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Get your link live first. Add proof and profile details over time as more brands start sending offers.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                {STAGE_LABELS[lifecycle.creatorStage]}
              </div>
              {collabUrl && (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  {collabUrl.replace(/^https?:\/\//, '')}
                </div>
              )}
            </div>

            {collabUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={() => void handleShareLink('copy')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={() => void handleShareLink('whatsapp')}>
                  <MessageCircleMore className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={() => void handleShareLink('open')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Link
                </Button>
              </div>
            )}
          </div>

          <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Profile Completion</span>
                <span className="text-lg font-black text-foreground">{completion.profileCompletion}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completion.profileCompletion}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Storefront Strength</span>
                <span className="text-lg font-black text-foreground">{completion.storefrontCompletion}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-info" style={{ width: `${completion.storefrontCompletion}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-secondary/[0.04] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Offers received</p>
            <p className="mt-2 text-2xl font-black text-foreground">{lifecycle.offersReceived}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/[0.04] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Completed deals</p>
            <p className="mt-2 text-2xl font-black text-foreground">{lifecycle.completedDeals}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/[0.04] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Total earnings</p>
            <p className="mt-2 text-2xl font-black text-foreground">₹{lifecycle.totalEarnings.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/[0.04] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Storefront conversion</p>
            <p className="mt-2 text-2xl font-black text-foreground">{lifecycle.conversionRate}%</p>
          </div>
        </div>

        {nudges.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {nudges.map((nudge) => (
              <button
                key={nudge.id}
                type="button"
                onClick={() => {
                  if (nudge.checklistItemId) {
                    const item = completion.items.find((entry) => entry.id === nudge.checklistItemId);
                    if (item) setSelectedItem(item);
                  } else if (nudge.id === 'no-offers-yet') {
                    void handleShareLink('copy');
                  }
                }}
                className="rounded-2xl border border-border bg-secondary/[0.04] p-4 text-left transition hover:border-border hover:bg-secondary/[0.08]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{nudge.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{nudge.description}</p>
                  </div>
                  <TrendingUp className={`h-5 w-5 flex-shrink-0 ${nudge.tone === 'success' ? 'text-primary' : nudge.tone === 'warning' ? 'text-warning' : 'text-info'}`} />
                </div>
                {nudge.cta && (
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {nudge.cta}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{showCompactChecklist ? 'Your 3 most important next steps' : 'Progressive checklist'}</p>
              <p className="text-xs text-muted-foreground">
                {showCompactChecklist
                  ? 'Do these first. We will ask for the rest only when it actually helps you win deals.'
                  : `${pendingItems.length} items left before your storefront feels complete.`}
              </p>
            </div>
          </div>

          {pendingItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visiblePendingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="rounded-2xl border border-border bg-secondary/[0.04] p-4 text-left transition hover:border-border hover:bg-secondary/[0.08]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground">
                      <Gauge className="h-3.5 w-3.5" />
                      {item.weight}% impact
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Add now
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold">Your core collab page checklist is complete.</p>
                  <p className="mt-1 text-sm text-primary/80">Keep sharing your link and adding fresh deal proof as new campaigns close.</p>
                </div>
              </div>
            </div>
          )}

          {showCompactChecklist && pendingItems.length > visiblePendingItems.length && (
            <p className="mt-3 text-xs text-muted-foreground">
              {pendingItems.length - visiblePendingItems.length} more optional improvements can wait until you start getting offers.
            </p>
          )}
        </div>
      </section>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="border-border bg-[#111827] text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedItem?.prompt}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {renderFields()}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={() => setSelectedItem(null)}>
              Later
            </Button>
            <Button type="button" className="bg-primary text-black hover:bg-primary" onClick={handleSave} disabled={updateProfileMutation.isPending}>
              Save Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
