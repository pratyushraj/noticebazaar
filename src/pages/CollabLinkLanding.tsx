"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Instagram, Youtube, YoutubeIcon, ExternalLink, Check, ChevronDown, Star, ShieldCheck, MessageCircleMore, X, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

interface CollabPackage { id: string; name: string; description: string; price: number; delivery_days: number; revisions: number; }
interface SocialStat { platform: 'instagram' | 'youtube' | 'twitter' | 'other'; handle: string; followers: number; }
interface PastWork { id: string; title: string; thumbnail_url?: string; url?: string; platform?: string; likes?: number; }
interface Testimonial { id: string; brand_name: string; text: string; avatar_url?: string; }
interface FAQItem { q: string; a: string; }
interface CreatorProfile {
  id: string; first_name: string; last_name: string; username: string; avatar_url?: string;
  intro_line?: string; bio?: string; instagram_handle?: string; instagram_followers?: number;
  youtube_handle?: string; youtube_subscribers?: number; twitter_handle?: string;
  packages?: CollabPackage[]; past_work?: PastWork[]; testimonials?: Testimonial[];
  faqs?: FAQItem[]; avg_rate_reel?: number; avg_rate_story?: number;
  verified?: boolean; brand_deal_count?: number; completed_deal_count?: number;
}

// ============================================
// UTILITIES
// ============================================

const formatFollowers = (n?: number) => {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

// ============================================
// SUB-COMPONENTS
// ============================================

// ── Hero Section ─────────────────────────────────────────────────────

const HeroSection = ({ creator, collabUrl }: { creator: CreatorProfile; collabUrl: string }) => {
  const navigate = useNavigate();
  const fullName = `${creator.first_name} ${creator.last_name}`.trim();
  const initials = `${creator.first_name?.[0] || ''}${creator.last_name?.[0] || ''}`.toUpperCase();

  return (
    <section className="text-center px-5 pt-12 pb-8">
      {/* Avatar */}
      <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden mb-5 bg-secondary flex items-center justify-center">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-semibold text-muted-foreground">{initials}</span>
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{fullName}</h1>
        {creator.verified && <ShieldCheck className="h-5 w-5 text-primary shrink-0" />}
      </div>

      {/* Tagline */}
      {creator.intro_line && (
        <p className="text-base text-foreground/70 max-w-sm mx-auto leading-relaxed">{creator.intro_line}</p>
      )}

      {/* Social links */}
      <div className="flex items-center justify-center gap-3 mt-4">
        {creator.instagram_handle && (
          <a
            href={`https://instagram.com/${creator.instagram_handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="h-4 w-4" />
            {formatFollowers(creator.instagram_followers)}
          </a>
        )}
        {creator.youtube_handle && (
          <a
            href={`https://youtube.com/@${creator.youtube_handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Youtube className="h-4 w-4" />
            {formatFollowers(creator.youtube_subscribers)}
          </a>
        )}
        {creator.brand_deal_count !== undefined && (
          <span className="text-xs text-muted-foreground">
            {creator.brand_deal_count} brand{creator.brand_deal_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Primary CTA */}
      <Button
        onClick={() => document.getElementById('offer-form')?.scrollIntoView({ behavior: 'smooth' })}
        className="mt-6 w-full sm:w-auto"
      >
        Send offer <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 mt-8 max-w-xs mx-auto">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or scroll to learn more</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </section>
  );
};

// ── Stats Section ─────────────────────────────────────────────────────

const StatsSection = ({ creator }: { creator: CreatorProfile }) => {
  const stats = [
    ...(creator.instagram_followers ? [{ label: 'Instagram followers', value: formatFollowers(creator.instagram_followers), icon: Instagram }] : []),
    ...(creator.youtube_subscribers ? [{ label: 'YouTube subscribers', value: formatFollowers(creator.youtube_subscribers), icon: Youtube }] : []),
    ...(creator.brand_deal_count !== undefined ? [{ label: 'Brand deals', value: String(creator.brand_deal_count), icon: Check }] : []),
    ...(creator.completed_deal_count !== undefined ? [{ label: 'Completed', value: String(creator.completed_deal_count), icon: Check }] : []),
  ];

  if (stats.length === 0) return null;

  return (
    <section className="px-5 py-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 mx-auto mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Packages Section ───────────────────────────────────────────────────

const PackagesSection = ({ packages }: { packages: CollabPackage[] }) => {
  if (!packages || packages.length === 0) return null;

  return (
    <section className="px-5 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Packages</h2>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{pkg.description}</p>
                )}
              </div>
              <p className="text-lg font-semibold text-foreground shrink-0">
                {pkg.price > 0 ? formatCurrency(pkg.price) : 'Free'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{pkg.delivery_days} day delivery</span>
              <span className="text-xs text-muted-foreground">{pkg.revisions} revisions</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Past Work Section ─────────────────────────────────────────────────

const PastWorkSection = ({ work }: { work: PastWork[] }) => {
  if (!work || work.length === 0) return null;

  return (
    <section className="px-5 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Past work</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {work.map((item) => (
          <a
            key={item.id}
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl overflow-hidden bg-secondary aspect-square flex items-center justify-center relative"
          >
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-3">{item.title}</span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

// ── Trust Section ─────────────────────────────────────────────────────

const TrustSection = ({ creator, testimonials }: { creator: CreatorProfile; testimonials?: Testimonial[] }) => (
  <section className="px-5 py-6">
    {/* Verified badge */}
    {creator.verified && (
      <div className="rounded-2xl border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Verified creator</p>
            <p className="text-xs text-muted-foreground">Identity and deal history confirmed</p>
          </div>
        </div>
      </div>
    )}

    {/* Testimonials */}
    {testimonials && testimonials.length > 0 && (
      <div className="space-y-3">
        {testimonials.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3 w-3 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
            <p className="text-xs text-muted-foreground mt-2">— {t.brand_name}</p>
          </div>
        ))}
      </div>
    )}
  </section>
);

// ── Offer Form ─────────────────────────────────────────────────────────

const OfferForm = ({ creator, collabUrl }: { creator: CreatorProfile; collabUrl: string }) => {
  const [step, setStep] = useState<'type' | 'details' | 'done'>('type');
  const [collabType, setCollabType] = useState<'paid' | 'barter' | ''>('');
  const [formData, setFormData] = useState({ brand_name: '', contact_email: '', budget: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabType) { toast.error('Select a deal type'); return; }
    if (!formData.brand_name || !formData.contact_email) { toast.error('Fill in required fields'); return; }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      const body: Record<string, unknown> = {
        brand_name: formData.brand_name,
        contact_email: formData.contact_email,
        collab_type: collabType,
        budget_range: formData.budget || null,
        message: formData.message || null,
        creator_id: creator.id,
      };
      if (sess?.access_token) {
        await fetch(`${getApiBaseUrl()}/api/collab-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.access_token}` },
          body: JSON.stringify(body),
        });
      }
      setStep('done');
    } catch { toast.error('Failed to send offer'); }
    finally { setLoading(false); }
  };

  if (step === 'done') {
    return (
      <section id="offer-form" className="px-5 py-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <p className="text-base font-semibold text-foreground">Offer sent!</p>
          <p className="text-sm text-muted-foreground mt-1">You'll hear back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="offer-form" className="px-5 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Send an offer</h2>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {/* Step 1: Type */}
        {step === 'type' && (
          <>
            <p className="text-sm text-muted-foreground">What kind of deal?</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'paid', label: 'Paid collaboration', desc: 'Cash payment' }, { id: 'barter', label: 'Product sent', desc: 'Free products' }].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setCollabType(opt.id as 'paid' | 'barter'); setStep('details'); }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    collabType === opt.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <>
            <button type="button" onClick={() => setStep('type')} className="text-xs text-muted-foreground hover:text-foreground">
              ← Change deal type
            </button>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Brand name *</label>
              <Input
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="Your brand"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email *</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@brand.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Budget (optional)</label>
              <Input
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. ₹5,000 – ₹15,000"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Message (optional)</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell them about your brand and what you have in mind..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all resize-none"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Send offer'}
            </Button>
          </>
        )}
      </form>
    </section>
  );
};

// ── FAQ Section ───────────────────────────────────────────────────────

const FAQSection = ({ faqs }: { faqs?: FAQItem[] }) => {
  const [open, setOpen] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="px-5 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">FAQ</h2>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div key={faq.q} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === faq.q ? null : faq.q)}
              className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left"
            >
              <span className="text-sm font-medium text-foreground">{faq.q}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open === faq.q && "rotate-180")} />
            </button>
            {open === faq.q && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Footer ─────────────────────────────────────────────────────────────

const Footer = ({ creator }: { creator: CreatorProfile }) => (
  <footer className="px-5 py-8 border-t border-border">
    <p className="text-xs text-muted-foreground text-center">
      Powered by <span className="font-medium text-foreground">Creator Armour</span>
    </p>
    <p className="text-xs text-muted-foreground/60 text-center mt-1">
      Safe brand collaborations
    </p>
  </footer>
);

// ── Loading Skeleton ───────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-xl mx-auto">
      <div className="text-center px-5 pt-12 pb-8">
        <div className="w-20 h-20 rounded-2xl bg-secondary mx-auto mb-5 animate-pulse" />
        <div className="h-7 w-40 bg-secondary rounded-xl mx-auto mb-3 animate-pulse" />
        <div className="h-4 w-64 bg-secondary rounded-lg mx-auto animate-pulse" />
        <div className="h-11 w-40 bg-secondary rounded-xl mx-auto mt-6 animate-pulse" />
      </div>
      <div className="px-5 py-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-secondary rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// ── Error State ────────────────────────────────────────────────────────

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-5">
    <div className="text-center">
      <p className="text-base font-medium text-foreground">Page not found</p>
      <p className="text-sm text-muted-foreground mt-1">This creator link may be invalid or expired.</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">Try again</Button>
    </div>
  </div>
);

// ============================================
// MAIN PAGE
// ============================================

const CollabLinkLanding = () => {
  const { handle } = useParams<{ handle: string }>();
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get('preview') === '1';
  const navigate = useNavigate();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCreator = useCallback(async () => {
    if (!handle) { setLoading(false); return; }
    setLoading(true); setError(false);
    try {
      const cleanHandle = handle.replace('@', '');
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sess?.access_token) headers['Authorization'] = `Bearer ${sess.access_token}`;

      const res = await fetch(`${getApiBaseUrl()}/api/creator-profile/${cleanHandle}`, { headers });
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      if (!data.success) { setError(true); setLoading(false); return; }
      setCreator(data.profile as CreatorProfile);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [handle]);

  useEffect(() => { void fetchCreator(); }, [fetchCreator]);

  const collabUrl = useMemo(() =>
    creator ? `${window.location.origin}/${creator.username}` : '',
  [creator?.username]);

  if (loading) return <LoadingSkeleton />;
  if (error || !creator) return <ErrorState onRetry={() => void fetchCreator()} />;

  const testimonialData: Testimonial[] = creator.testimonials || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4 md:hidden">
        <Button
          onClick={() => document.getElementById('offer-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full"
        >
          Send offer <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-xl mx-auto pb-24 md:pb-0">
        {/* Hero — always first, above fold */}
        <HeroSection creator={creator} collabUrl={collabUrl} />

        {/* Stats */}
        <StatsSection creator={creator} />

        {/* Packages */}
        <PackagesSection packages={creator.packages || []} />

        {/* Past work */}
        <PastWorkSection work={creator.past_work || []} />

        {/* Trust */}
        <TrustSection creator={creator} testimonials={testimonialData} />

        {/* Offer form */}
        <OfferForm creator={creator} collabUrl={collabUrl} />

        {/* FAQ */}
        <FAQSection faqs={creator.faqs} />

        {/* Footer */}
        <Footer creator={creator} />
      </div>
    </div>
  );
};

export default CollabLinkLanding;
