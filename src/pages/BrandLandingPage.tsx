import React, { lazy, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, Clock, Crown, FileText, Handshake, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

const ThreeDIllustration = lazy(() =>
  import('@/components/ui/ThreeDIllustration').then(m => ({ default: m.default }))
);

const metricCards = [
  {
    title: 'Structured offers',
    body: 'Compare packages, deliverables, and timelines before you pay a rupee.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Faster replies',
    body: 'Creators see response speed and availability, so your briefs move quickly.',
    icon: Clock,
  },
  {
    title: 'Safer deals',
    body: 'Use contracts and deal tracking instead of losing details in DMs.',
    icon: ShieldCheck,
  },
];

const brandFlowCards = [
  {
    eyebrow: 'Discovery',
    title: 'Find creators who fit the brief',
    description: 'Browse curated creator pages with audience fit, rates, and proof of performance.',
    accent: 'emerald',
    icon: Handshake,
  },
  {
    eyebrow: 'Campaign Control',
    title: 'Send offers that feel premium',
    description: 'Choose a ready package or propose a custom collaboration in one clean flow.',
    accent: 'teal',
    icon: FileText,
  },
  {
    eyebrow: 'Trust Layer',
    title: 'Track deliverables and approvals',
    description: 'Keep content review, payment milestones, and legal safety in one place.',
    accent: 'blue',
    icon: BadgeCheck,
  },
];

const BrandLandingPage = () => {
  const navigate = useNavigate();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <SEOHead
        title="Creator Armour for Brands"
        description="Discover creators, send structured offers, and manage collaborations in one premium workflow."
        keywords={['brand collaboration platform', 'creator discovery', 'influencer marketing india', 'send offers to creators']}
        canonical="https://creatorarmour.com/brands"
      />

      <div className="min-h-screen bg-[#05110E] text-white overflow-hidden">
        <header
          className={cn(
            'sticky top-0 z-50 border-b transition-all duration-300 backdrop-blur-xl',
            hasScrolled
              ? 'bg-[#071511]/90 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
              : 'bg-transparent border-transparent'
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300/80">Brand mode</p>
                <h1 className="text-lg font-black tracking-tight">Creator Armour</h1>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#proof" className="hover:text-white transition-colors">Proof</a>
              <a href="#cta" className="hover:text-white transition-colors">Get started</a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(v => !v)}
                className="md:hidden w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/brand-dashboard')}
                className="hidden md:inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-emerald-500 text-slate-950 font-black"
              >
                Brand Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#071511]/95 px-4 py-4 space-y-3">
              <a href="#how-it-works" className="block text-sm font-semibold text-white/80">How it works</a>
              <a href="#proof" className="block text-sm font-semibold text-white/80">Proof</a>
              <a href="#cta" className="block text-sm font-semibold text-white/80">Get started</a>
            </div>
          )}
        </header>

        <main>
          <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-10 top-8 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>

            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center relative">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
                  <Crown className="w-3.5 h-3.5" />
                  Built for brands
                </div>

                <div className="space-y-5">
                  <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.94]">
                    Send better offers.
                    <span className="block text-emerald-300">Close faster.</span>
                  </h2>
                  <p className="max-w-2xl text-base sm:text-lg text-white/68 leading-relaxed">
                    Borrowing the same premium motion and structure as the creator page, but tuned for brands:
                    discover creators, compare packages, and launch campaigns without messy DMs.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(HapticPatterns.success);
                      navigate('/brand-dashboard');
                    }}
                    className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-[1.2rem] bg-emerald-500 text-slate-950 font-black shadow-[0_18px_40px_rgba(16,185,129,0.25)]"
                  >
                    Open Brand Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      navigate('/brand-directory');
                    }}
                    className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-[1.2rem] border border-white/10 bg-white/5 font-black text-white"
                  >
                    Discover Creators
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {metricCards.map((card) => (
                    <div key={card.title} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                      <card.icon className="w-5 h-5 text-emerald-300" />
                      <p className="mt-3 text-sm font-black">{card.title}</p>
                      <p className="mt-1 text-sm text-white/60 leading-relaxed">{card.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-emerald-500/15 to-cyan-500/10 blur-2xl" />
                <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0A1713]/90 p-5 sm:p-6 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300/70">Campaign view</p>
                      <h3 className="text-xl font-black mt-1">See what the brand sees</h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Offer preview</p>
                        <p className="mt-1 text-lg font-black">Growth Campaign</p>
                      </div>
                      <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-200">
                        Most chosen
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl bg-[#09110F] border border-white/10 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white/70">1 Reel + 2 Stories</span>
                          <span className="text-sm font-black text-emerald-300">₹4,000</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/6 overflow-hidden">
                          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#09110F] border border-white/10 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white/70">Usage rights, delivery, deadlines</span>
                          <span className="text-sm font-black text-white">All in one place</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-3 gap-5">
              {brandFlowCards.map((card, idx) => (
                <article
                  key={card.title}
                  className={cn(
                    'rounded-[2rem] border p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1',
                    idx === 0
                      ? 'border-emerald-400/20 bg-emerald-500/10'
                      : idx === 1
                        ? 'border-cyan-400/20 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5'
                  )}
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <card.icon className="w-5 h-5 text-emerald-200" />
                  </div>
                  <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{card.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight">{card.title}</h3>
                  <p className="mt-3 text-sm text-white/66 leading-relaxed">{card.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="proof" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 items-center rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300/70">Why brands stay</p>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Same premium vibe as the creator page, but with brand-first proof.
                </h3>
                <p className="text-white/68 leading-relaxed">
                  The brand page should feel like a polished control room. The creator page keeps its current
                  tone, while this side focuses on choosing creators, approving campaigns, and tracking results.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-[#08110F] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Average response</p>
                  <p className="mt-2 text-4xl font-black text-emerald-300">3h</p>
                  <p className="mt-1 text-sm text-white/60">Brands can see who replies fast before sending the brief.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-[#08110F] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Campaigns launched</p>
                  <p className="mt-2 text-4xl font-black text-cyan-300">50+</p>
                  <p className="mt-1 text-sm text-white/60">Structured offers replace scattered DMs and spreadsheets.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="cta" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
            <div className="rounded-[2.5rem] border border-emerald-400/15 bg-gradient-to-r from-emerald-500/12 via-white/5 to-cyan-500/10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80">Ready to start</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight">Bring brands into a cleaner deal flow.</h3>
                <p className="mt-2 text-white/66 max-w-2xl">
                  Use the same visual polish, but give brands the tools they need to discover creators and send offers quickly.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/brand-dashboard')}
                  className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-[1.2rem] bg-white text-slate-950 font-black"
                >
                  Open dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/brand-directory')}
                  className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-[1.2rem] border border-white/10 bg-white/5 font-black text-white"
                >
                  Browse creators
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default BrandLandingPage;
