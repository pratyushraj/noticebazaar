"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Link as LinkIcon, ExternalLink, Instagram, Linkedin, Twitter, Menu, X, IndianRupee, FileText, BriefcaseBusiness, Clock3 } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

const AANYA_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&h=500&q=80";
const PRIYA_IMG = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&h=500&q=80";
const ARJUN_IMG = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&h=500&q=80";
const NEHA_IMG = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&h=500&q=80";
const ROHAN_IMG = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&h=500&q=80";

const dashboardShowcase = [
  {
    eyebrow: 'Incoming Offers',
    title: 'Know which brand is offering what',
    description: 'Creators see live offer value, deliverables, and due dates instead of re-reading old chats.',
    icon: BriefcaseBusiness,
    accent: 'emerald',
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-black text-[#0F172A]">Nykaa Summer Drop</p>
              <p className="mt-1 text-xs font-bold text-[#64748B]">1 Reel + 3 stories • due in 4 days</p>
            </div>
            <span className="rounded-full bg-[#16A34A] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#16A34A]">Pending</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3">
            <span className="text-xs font-bold text-[#64748B]">Offer value</span>
            <span className="text-lg font-black text-[#0F172A]">₹18,000</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-[#E5E7EB] px-4 py-3 text-[#0F172A]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Awaiting reply</p>
            <p className="mt-2 text-2xl font-black">03</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Best-fit brand</p>
            <p className="mt-2 text-sm font-black text-[#0F172A]">Beauty / D2C</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Contract Clarity',
    title: 'See risky deal terms before accepting',
    description: 'Important clauses are highlighted so a creator who has only used DMs can still understand what matters.',
    icon: FileText,
    accent: 'blue',
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-[#0F172A]">Campaign agreement scan</p>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-700 border border-amber-200">2 flags</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
              Unlimited usage rights detected
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              No payment due date mentioned
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Suggested fix</p>
          <p className="mt-2 text-sm font-bold text-[#64748B]">Add 50% advance, 30-day usage cap, and final payment within 7 days of posting.</p>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Payout Tracking',
    title: 'Track what is paid, late, or at risk',
    description: 'The payout side should feel as visible as the storefront so creators know what to follow up on fast.',
    icon: IndianRupee,
    accent: 'teal',
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] p-4 text-white shadow-lg shadow-[#16A34A]/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A]">This month</p>
          <p className="mt-2 text-3xl font-black">₹42,500</p>
          <p className="mt-1 text-sm font-medium text-[#16A34A]">2 paid deals, 1 overdue payout</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#0F172A]">Myntra festive edit</p>
              <p className="mt-1 text-xs font-bold text-[#64748B]">Final payment pending</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-rose-700">4 days late</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3">
            <span className="text-xs font-bold text-[#64748B]">Amount due</span>
            <span className="text-lg font-black text-[#0F172A]">₹12,000</span>
          </div>
        </div>
      </div>
    ),
  },
];

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();

  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const canonicalUrl = 'https://creatorarmour.com/';
  const seoTitle = 'Creator Armour - Close Brand Deals Without Instagram DMs';
  const seoDescription = 'Creator Armour gives you a professional collaboration page where brands send structured offers, contracts are generated automatically, and deals are tracked in your dashboard.';
  const seoKeywords = [
    'creator collab link',
    'brand deal management',
    'influencer collaboration platform',
    'creator marketplace india',
    'instagram creator brand deals',
    'creator portfolio for brands',
    'structured brand offers for creators',
  ];

  useEffect(() => {
    if (loading) return;
    if (session && profile) {
      if (profile.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/creator-dashboard', { replace: true });
      }
    }
  }, [session, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F172A] font-sans selection:bg-[#16A34A]/20 overflow-x-hidden">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'Creator Armour',
              url: 'https://creatorarmour.com',
              description: seoDescription,
            },
            {
              '@type': 'SoftwareApplication',
              name: 'Creator Armour',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: seoDescription,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
              },
            },
          ],
        }}
      />

      {/* Modern Top Nav */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b pt-[max(env(safe-area-inset-top),0px)]",
        hasScrolled
          ? "bg-white/92 backdrop-blur-xl border-[#E5E7EB] shadow-sm"
          : "bg-white border-[#E5E7EB] shadow-sm md:bg-white/70 md:border-transparent md:shadow-none md:backdrop-blur-md"
      )}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-lg shadow-[#16A34A]/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[17px] font-black tracking-tight text-[#0F172A] whitespace-nowrap">
              Creator Armour
            </h1>
          </Link>

          <div className="hidden lg:flex items-center gap-6 bg-white/95 backdrop-blur-md px-6 py-2 rounded-full border border-[#E5E7EB] shadow-sm">
            <a href="#how-it-works" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">How it Works</a>
            <a href="#marketplace" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">Packages</a>
            <a href="#social-proof" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">Creators</a>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link to="/login" className="hidden md:block px-3 py-2 text-[14px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors rounded-full hover:bg-[#F8FAF9] whitespace-nowrap shrink-0">
              Log In
            </Link>
            <Link
              to="/signup?mode=brand"
              onClick={() => triggerHaptic(HapticPatterns.light)}
              className="hidden lg:inline-flex items-center px-4 py-2 text-[14px] font-black text-[#0F172A] hover:text-[#16A34A] transition-colors rounded-full bg-[#F8FAF9] hover:bg-[#E5E7EB] border border-[#E5E7EB] shadow-sm whitespace-nowrap shrink-0"
            >
              Brand Console
            </Link>
            <Link
              to="/signup?mode=creator"
              onClick={() => triggerHaptic(HapticPatterns.success)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-[14px] sm:text-[15px] font-black shadow-lg shadow-[#16A34A]/25 hover:shadow-[#16A34A]/40 hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0 min-h-[44px]"
            >
              Create Collab Link
            </Link>
            {/* Mobile menu button */}
            <button type="button"
              className="lg:hidden p-2 rounded-xl hover:bg-[#F8FAF9] transition-colors shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#64748B]" /> : <Menu className="w-5 h-5 text-[#64748B]" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 space-y-1 shadow-lg">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-[15px] font-bold text-[#0F172A] hover:bg-[#F8FAF9] rounded-xl transition-colors">How it Works</a>
            <a href="#marketplace" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-[15px] font-bold text-[#0F172A] hover:bg-[#F8FAF9] rounded-xl transition-colors">Packages</a>
            <a href="#social-proof" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-[15px] font-bold text-[#0F172A] hover:bg-[#F8FAF9] rounded-xl transition-colors">Creators</a>
            <div className="pt-2 border-t border-[#E5E7EB] space-y-1">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block md:hidden px-4 py-3 text-[15px] font-bold text-[#0F172A] hover:bg-[#F8FAF9] rounded-xl transition-colors">Log In</Link>
              <Link to="/signup?mode=brand" onClick={() => setMobileMenuOpen(false)} className="block lg:hidden px-4 py-3 text-[15px] font-bold text-[#0F172A] hover:bg-[#F8FAF9] rounded-xl transition-colors">Brand Console</Link>
            </div>
          </div>
        )}

      </nav>
      <main className="relative z-10 pt-24 sm:pt-28 lg:pt-40 pb-24 space-y-12 lg:space-y-20">
        {/* 1. HERO SECTION */}
        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto relative scroll-mt-24 py-20 lg:py-28">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-[#DCFCE7]/40 via-[#DCFCE7]/40 to-transparent blur-[100px] rounded-full -z-10" />

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-24 w-full">
            <div className="flex-1 text-center lg:text-left pt-2 lg:pt-10">
              <h1 className="text-[48px] md:text-[72px] lg:text-[84px] font-black tracking-tight leading-[1.05] mb-6 text-[#0F172A] drop-shadow-sm">
                Get brand deals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16A34A] to-[#15803D] inline-block mt-2">
                  without DMs
                </span>
              </h1>

              <p className="text-[20px] md:text-[24px] text-[#64748B] font-medium mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Send one link. Brands send offers.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link
                    to="/signup?mode=creator"
                    className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-5 rounded-full font-black text-[18px] shadow-xl shadow-[#16A34A]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 border border-[#16A34A]"
                  >
                    Create my link <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/pratyush"
                    className="w-full sm:w-auto bg-white hover:bg-[#F8FAF9] border shadow-sm border-[#E5E7EB] text-[#64748B] px-8 py-5 rounded-full font-black text-[16px] transition-all flex items-center justify-center gap-2"
                  >
                    See how it works
                  </Link>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="flex-1 w-full max-w-[420px] lg:max-w-none relative">
              {/* Floating Creator Profile Badge */}
              <div className="hidden md:flex absolute -left-16 md:-left-24 top-20 bg-white p-4 rounded-3xl shadow-2xl border border-[#E5E7EB] z-20 items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 hover:scale-105 transition-transform">
                <img src={AANYA_IMG} alt="Aanya Kapoor" className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-black text-[#0F172A]">Aanya Kapoor</h3>
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] fill-[#DCFCE7]" />
                  </div>
                  <p className="text-[12px] font-bold text-[#64748B] leading-tight">Lifestyle Creator • 42K followers</p>
                </div>
              </div>

              {/* Floating Offer Notification */}
              <div className="hidden md:flex absolute -right-8 md:-right-16 top-64 bg-white p-4 rounded-3xl shadow-2xl border border-[#E5E7EB] z-30 items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-1000 delay-700 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-[#16A34A] flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">New Offer Received</p>
                  <p className="text-base font-black text-[#0F172A]">₹4,000 from Myntra</p>
                </div>
              </div>

              <div className="hidden lg:flex absolute -left-8 bottom-10 z-30 rounded-3xl border border-[#E5E7EB] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-sm items-center gap-4 animate-in fade-in slide-in-from-left-8 duration-1000 delay-500 hover:scale-105 transition-transform">
                <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Contract check</p>
                  <p className="text-sm font-black text-[#0F172A]">2 risky clauses flagged</p>
                </div>
              </div>

              <div className="hidden xl:flex absolute -right-20 bottom-28 z-30 rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-[#0F172A] shadow-2xl items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-900 hover:scale-105 transition-transform">
                <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7]/50 flex items-center justify-center text-[#16A34A]">
                  <Clock3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Payment follow-up</p>
                  <p className="text-sm font-black text-[#0F172A]">₹12,000 overdue by 4 days</p>
                </div>
              </div>

              {/* Phone Mockup Screen */}
              <div className="bg-white rounded-[40px] md:rounded-[48px] shadow-2xl border-[10px] md:border-[14px] border-[#E5E7EB] overflow-hidden w-full max-w-[360px] md:max-w-[380px] mx-auto relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 ring-1 ring-[#0F172A]/5">
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#F8FAF9] rounded-full z-20" />

                <div className="px-5 md:px-6 pt-14 md:pt-16 pb-8 bg-white h-auto relative">
                  {/* Decorative background blur */}
                  <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-[#DCFCE7] to-white" />

                  <div className="relative z-10 flex flex-col items-center mb-6">
                    <img src={AANYA_IMG} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" alt="Creator" />
                    <h2 className="text-2xl font-black text-[#0F172A] flex items-center gap-1">Aanya Kapoor <CheckCircle2 className="w-6 h-6 text-[#16A34A] fill-[#DCFCE7]" /></h2>
                    <p className="text-[13px] font-bold text-[#64748B] mb-4">@aanyakapoor</p>

                    <div className="bg-[#F8FAF9] border border-[#E5E7EB] rounded-2xl p-4 w-full shadow-sm text-center">
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Typical Collab Rate</p>
                      <p className="text-xl font-black text-[#0F172A]">₹2K–₹4K</p>
                    </div>
                  </div>

                  {/* Packages */}
                  <div className="space-y-4 relative z-10">
                    <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white shadow-sm hover:border-[#16A34A] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-[15px] text-[#0F172A]">Reel Deal</h5>
                        <div className="w-8 h-8 rounded-full bg-[#F8FAF9] flex items-center justify-center">
                          <span className="text-xl">🎬</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-[#64748B] mb-4 line-clamp-2">1 High-quality Instagram Reel with professional hooks and brand tagging.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                        <span className="text-lg font-black text-[#0F172A]">₹2,499</span>
                        <div className="bg-[#F8FAF9] text-[#64748B] px-4 py-1.5 rounded-xl text-xs font-black">Select</div>
                      </div>
                    </div>

                    <div className="border-2 border-[#16A34A] bg-white rounded-2xl p-5 relative shadow-lg shadow-[#16A34A]/10">
                      <div className="absolute -top-3 left-4 bg-[#16A34A] text-white text-[11px] uppercase font-black px-3 py-1 rounded-full tracking-wide">Most Popular</div>
                      <div className="flex justify-between items-start mb-2 mt-1">
                        <h5 className="font-black text-[15px] text-[#0F172A]">Engagement Package</h5>
                        <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                          <span className="text-xl">🔥</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-[#64748B] mb-4">1 Reel + 2 Engagement Stories to maximize reach and drive action.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-[#16A34A]">
                        <span className="text-lg font-black text-[#16A34A]">₹3,999</span>
                        <div className="bg-[#16A34A] text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Select</div>
                      </div>
                    </div>

                    <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white shadow-sm hover:border-[#16A34A] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-[15px] text-[#0F172A]">Product Review</h5>
                        <div className="w-8 h-8 rounded-full bg-[#F8FAF9] flex items-center justify-center">
                          <span className="text-xl">📦</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-[#64748B] mb-4">In-depth product unboxing and review with 1 story mention.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                        <span className="text-lg font-black text-[#0F172A]">Barter</span>
                        <div className="bg-[#F8FAF9] text-[#64748B] px-4 py-1.5 rounded-xl text-xs font-black">Select</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Logos Section - moved above "More than a collab page" */}
        <section className="border-y border-[#E5E7EB] bg-[#F8FAF9] py-10 md:py-12">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-widest mb-8">Example brands creators collaborate with</p>
            <div className="flex justify-center items-center gap-10 sm:gap-14 md:gap-20 opacity-50 hover:opacity-80 transition-all duration-500 overflow-hidden flex-wrap">
              {/* NYKAA */}
              <svg className="h-6 md:h-8 shrink-0" viewBox="0 0 120 28" fill="none">
                <text x="0" y="22" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#fc2779" letterSpacing="-0.5">NYKAA</text>
              </svg>
              {/* boAt */}
              <svg className="h-6 md:h-8 shrink-0" viewBox="0 0 70 28" fill="none">
                <text x="0" y="22" fontFamily="Impact, sans-serif" fontSize="24" fontWeight="400" fill="#1a1a1a" letterSpacing="1">boAt</text>
              </svg>
              {/* mamaearth */}
              <svg className="h-6 md:h-8 shrink-0" viewBox="0 0 140 28" fill="none">
                <text x="0" y="21" fontFamily="Georgia, serif" fontSize="18" fontWeight="400" fill="#2d6a4f" letterSpacing="0.5">mamaearth</text>
              </svg>
              {/* Myntra */}
              <svg className="h-6 md:h-8 shrink-0" viewBox="0 0 90 28" fill="none">
                <text x="0" y="22" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#ff3f6c" letterSpacing="-0.5">Myntra</text>
              </svg>
              {/* SUGAR */}
              <svg className="h-6 md:h-8 shrink-0" viewBox="0 0 90 28" fill="none">
                <text x="0" y="22" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#e91e8c" letterSpacing="4">SUGAR</text>
              </svg>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto py-16 lg:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-[42px] font-black tracking-tight text-[#0F172A]">
              More than a collab page
            </h2>
            <p className="mt-4 text-lg text-[#64748B] font-medium max-w-2xl mx-auto">
              Show creators what happens after a brand clicks their link: offers arrive cleanly, contracts are easier to read, and payouts stay visible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
            {dashboardShowcase.map((panel) => {
              const Icon = panel.icon;

              return (
                <div
                  key={panel.title}
                  className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center',
                      panel.accent === 'emerald' && 'bg-[#16A34A] text-[#16A34A]',
                      panel.accent === 'blue' && 'bg-[#DCFCE7] text-[#16A34A]',
                      panel.accent === 'teal' && 'bg-[#DCFCE7] text-[#15803D]',
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#64748B]">{panel.eyebrow}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-black tracking-tight text-[#0F172A] leading-tight">{panel.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-6 text-[#64748B]">{panel.description}</p>
                  </div>

                  <div className="rounded-[26px] border border-[#E5E7EB] bg-[#F8FAF9] p-4">
                    {panel.body}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. CREATOR SOCIAL PROOF */}
        <section id="social-proof" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24 py-16 lg:py-20">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-[40px] font-black tracking-tight text-[#0F172A] lg:max-w-2xl mx-auto leading-tight">
              Top creators running their business on Armour
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: 'Priya Sharma', category: 'Fashion Creator', loc: 'Delhi', followers: '36K', price: '₹3K', earned: '₹24,500 this week', img: PRIYA_IMG },
              { name: 'Arjun Patel', category: 'Tech Reviewer', loc: 'Mumbai', followers: '51K', price: '₹4K', earned: '₹12,000 per reel', img: ARJUN_IMG },
              { name: 'Neha Verma', category: 'Beauty Creator', loc: 'Bangalore', followers: '28K', price: '₹2K', earned: '₹18,500 last month', img: NEHA_IMG },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] p-6 md:p-8 rounded-[20px] md:rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <img src={c.img} alt={c.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" loading="lazy" />
                  <div>
                    <h3 className="font-black text-[#0F172A] text-lg">{c.name}</h3>
                    <p className="text-[13px] font-medium text-[#64748B]">{c.category} • {c.loc}</p>
                  </div>
                </div>
                <div className="bg-[#F8FAF9] border border-[#E5E7EB] rounded-2xl p-4">
                  <p className="text-sm font-bold text-[#16A34A] mb-1">{c.earned}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#64748B]">Typical deal</span>
                    <span className="font-black text-2xl text-[#16A34A]">{c.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. YOUR COLLAB LINK */}
        <section id="how-it-works" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24 py-16 lg:py-20">
          <div className="bg-white rounded-[28px] md:rounded-[40px] p-8 md:p-16 lg:p-20 relative overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#16A34A]/10 rounded-full blur-[120px]" />

            <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative z-10">
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <h2 className="text-3xl md:text-[48px] font-black tracking-tight text-[#0F172A] leading-tight">
                  Add your link to your Instagram bio.
                </h2>
                <p className="text-xl text-[#64748B] font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Stop losing deals in the noise. Let brands send structured collaboration offers directly through your personal Creator Armour page.
                </p>
                <div className="bg-[#F8FAF9] border border-[#E5E7EB] p-4 rounded-xl inline-block mt-4 backdrop-blur-sm">
                  <p className="font-mono text-[#16A34A] font-bold text-lg md:text-xl">creatorarmour.com/priyasharma</p>
                </div>
              </div>

              <div className="flex-1 w-full max-w-[340px] lg:max-w-none flex justify-center lg:justify-end">
                {/* Creator Collab Page Mockup */}
                <div className="bg-white w-full max-w-[320px] rounded-[40px] shadow-2xl overflow-hidden border-8 border-[#E5E7EB]">
                  <div className="px-5 pt-8 pb-6 bg-[#F8FAF9] relative">
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#DCFCE7] to-transparent" />

                    <div className="relative z-10 text-center mb-6">
                      <img src={PRIYA_IMG} className="w-20 h-20 rounded-full mx-auto object-cover border-[3px] border-white shadow-sm mb-3" alt="Priya Sharma" loading="lazy" />
                      <h3 className="font-black text-lg text-[#0F172A] flex items-center justify-center gap-1">Priya Sharma <CheckCircle2 className="w-4 h-4 text-[#16A34A] fill-[#DCFCE7]" /></h3>
                      <p className="text-[12px] font-bold text-[#64748B] mb-3">36K Followers</p>

                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 inline-block shadow-sm">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Typical Collab Rate</p>
                        <p className="text-lg font-black text-[#0F172A]">₹2K–₹4K</p>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10 w-full">
                      <div className="bg-white border border-[#E5E7EB] p-3 rounded-2xl shadow-sm flex justify-between items-center">
                        <span className="font-black text-sm text-[#0F172A]">Reel Deal</span>
                        <span className="font-black text-sm text-[#16A34A]">₹1,999</span>
                      </div>
                      <div className="bg-white border border-[#E5E7EB] p-3 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#16A34A] rounded-bl-full" />
                        <span className="font-black text-sm text-[#0F172A] relative z-10">Engagement Package</span>
                        <span className="font-black text-sm text-[#16A34A] relative z-10">₹3,499</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MARKETPLACE PACKAGE PREVIEW */}
        <section id="marketplace" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24 py-16 lg:py-20">
          <div className="bg-white rounded-[28px] md:rounded-[40px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="text-center px-6 md:px-8 pt-12 md:pt-16 pb-8 md:pb-12 bg-[#F8FAF9] border-b border-[#E5E7EB]">
              <h2 className="text-3xl md:text-[44px] font-black tracking-tight text-[#0F172A] mb-4">Your custom marketplace</h2>
              <p className="text-lg text-[#64748B] font-medium">Let brands shop your services like a high-end catalog.</p>
            </div>

            <div className="p-5 md:p-16 bg-white">
              <div className="max-w-[1000px] mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12 pb-12 border-b border-[#E5E7EB]">
                  <img src={ROHAN_IMG} alt="Rohan Mehta" className="w-24 h-24 rounded-full object-cover shadow-md border border-[#E5E7EB]" loading="lazy" />
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black text-[#0F172A] mb-1">Rohan Mehta</h3>
                    <p className="text-base font-bold text-[#64748B] flex items-center justify-center md:justify-start gap-2">Travel Creator <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB]"></span> 58K followers</p>
                  </div>
                  <div className="md:ml-auto mt-4 md:mt-0">
                    <button type="button" className="bg-white text-[#0F172A] font-black px-6 py-3 rounded-xl shadow-lg hover:bg-[#F8FAF9] transition-all">Collab With Rohan</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] p-6 md:p-8 text-center">
                  <p className="text-sm font-bold text-[#64748B] mb-1">Interactive package catalog</p>
                  <p className="text-sm text-[#64748B] mb-4">See how brands browse creator packages, compare deliverables, and send structured offers.</p>
                  <button type="button"
                    onClick={() => navigate('/pratyush')}
                    className="bg-white text-[#0F172A] font-black px-6 py-3 rounded-xl shadow-lg hover:bg-[#F8FAF9] transition-all"
                  >
                    Explore Demo Creator Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DEAL PROOF SECTION */}
        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto py-16 lg:py-20">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-[40px] font-black text-[#0F172A] mb-4">Real deals closed recently</h2>
            <p className="text-lg text-[#64748B] font-medium">Creators are consistently booking deals using their Armour profiles.</p>
          </div>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-2 snap-x snap-mandatory">
            {[
              { name: 'Priya Sharma', img: PRIYA_IMG, brand: 'Myntra', package: '1 Reel + 2 Stories', val: '₹4,500', earned: '₹24,500 earned this week' },
              { name: 'Arjun Patel', img: ARJUN_IMG, brand: 'Boat', package: 'Product Review', val: '₹3,000 + product', earned: '₹12,000 per reel' },
              { name: 'Neha Verma', img: NEHA_IMG, brand: 'Mamaearth', package: '1 Reel', val: '₹2,000', earned: '₹18,500 last month' },
            ].map((d, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] p-6 md:p-8 rounded-[20px] md:rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start">
                <div className="flex items-center gap-3 mb-4">
                  <img src={d.img} alt={d.name} className="w-14 h-14 rounded-full border border-[#E5E7EB] object-cover shrink-0" loading="lazy" />
                  <div>
                    <span className="font-black text-lg text-[#0F172A] leading-tight">{d.name}</span>
                    <p className="text-sm font-medium text-[#16A34A]">{d.earned}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#64748B]">Brand</span>
                    <span className="text-lg font-black text-[#0F172A]">{d.brand}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#64748B]">Package</span>
                    <span className="text-base font-bold text-[#0F172A] bg-[#F8FAF9] px-3 py-1 rounded-lg border border-[#E5E7EB]">{d.package}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-[#E5E7EB] items-center">
                    <span className="text-sm font-bold text-[#64748B]">Deal Value</span>
                    <span className="text-3xl font-black text-[#16A34A]">{d.val}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PRE-FOOTER CTA */}
        <section className="px-4 sm:px-6 pb-16">
          <div
            className="max-w-[1200px] mx-auto rounded-[24px] px-6 py-16 md:px-10 md:py-20 text-center text-white shadow-[0_28px_70px_rgba(21,128,61,0.36)] border border-[#16A34A]/25 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#15803D,#1fb97a)' }}
          >
            <div className="absolute -top-32 -right-20 w-80 h-80 bg-[#DCFCE7]/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-[#16A34A]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-[36px] md:text-[56px] font-black tracking-tight leading-[1.05] mb-6">
                Start getting brand deals today
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto bg-white text-[#15803D] hover:bg-[#DCFCE7] px-10 py-5 rounded-full font-black text-[18px] shadow-xl transition-all flex items-center justify-center gap-2">
                  Create my link <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E7EB] bg-[#F8FAF9] pt-[60px] pb-[40px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
            <div className="md:col-span-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-lg shadow-[#16A34A]/25">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[20px] font-black tracking-tight text-[#0F172A]">Creator Armour</h3>
              </Link>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed font-medium text-[#64748B]">
                Close brand deals without Instagram DMs.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a href="https://instagram.com/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#16A34A] hover:border-[#16A34A] inline-flex items-center justify-center transition-colors" aria-label="Creator Armour Instagram">
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a href="https://x.com/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#16A34A] hover:border-[#16A34A] inline-flex items-center justify-center transition-colors" aria-label="Creator Armour X">
                  <Twitter className="w-4.5 h-4.5" />
                </a>
                <a href="https://www.linkedin.com/company/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#16A34A] hover:border-[#16A34A] inline-flex items-center justify-center transition-colors" aria-label="Creator Armour LinkedIn">
                  <Linkedin className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            <div className="hidden md:grid md:col-span-8 grid-cols-4 gap-8">
              <div className="space-y-3">
                <p className="text-sm font-black text-[#64748B]">Product</p>
                <div className="space-y-2.5 text-sm font-medium text-[#64748B]">
                  <Link to="/signup" className="block hover:text-[#16A34A]">Create Collab Link</Link>
                  <Link to="/discover" className="block hover:text-[#16A34A]">Creator Marketplace</Link>
                  <Link to="/collab-requests" className="block hover:text-[#16A34A]">Brand Offers</Link>
                  <Link to="/plan/growth" className="block hover:text-[#16A34A]">Pricing</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-[#64748B]">Creators</p>
                <div className="space-y-2.5 text-sm font-medium text-[#64748B]">
                  <a href="#how-it-works" className="block hover:text-[#16A34A]">How it works</a>
                  <a href="#marketplace" className="block hover:text-[#16A34A]">Creator packages</a>
                  <button type="button" onClick={() => navigate('/pratyush')} className="block text-left hover:text-[#16A34A]">Examples</button>
                  <Link to="/creator-dashboard" className="block hover:text-[#16A34A]">Creator dashboard</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-[#64748B]">Resources</p>
                <div className="space-y-2.5 text-sm font-medium text-[#64748B]">
                  <Link to="/blog" className="block hover:text-[#16A34A]">Blog</Link>
                  <a href="mailto:support@creatorarmour.com" className="block hover:text-[#16A34A]">Help Center</a>
                  <Link to="/free-influencer-contract" className="block hover:text-[#16A34A]">Guides for creators</Link>
                  <Link to="/rate-calculator" className="block hover:text-[#16A34A]">Influencer pricing guide</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-[#64748B]">Company</p>
                <div className="space-y-2.5 text-sm font-medium text-[#64748B]">
                  <Link to="/about" className="block hover:text-[#16A34A]">About</Link>
                  <a href="mailto:support@creatorarmour.com" className="block hover:text-[#16A34A]">Contact</a>
                  <Link to="/privacy-policy" className="block hover:text-[#16A34A]">Privacy</Link>
                  <Link to="/terms-of-service" className="block hover:text-[#16A34A]">Terms</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden mt-7 space-y-2">
            <details className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-[#64748B] flex items-center justify-between">Product <span className="text-[#64748B]">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-[#64748B]">
                <Link to="/signup" className="block">Create Collab Link</Link>
                <Link to="/discover" className="block">Creator Marketplace</Link>
                <Link to="/collab-requests" className="block">Brand Offers</Link>
                <Link to="/plan/growth" className="block">Pricing</Link>
              </div>
            </details>
            <details className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-[#64748B] flex items-center justify-between">Creators <span className="text-[#64748B]">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-[#64748B]">
                <a href="#how-it-works" className="block">How it works</a>
                <a href="#marketplace" className="block">Creator packages</a>
                <button type="button" onClick={() => navigate('/pratyush')} className="block text-left">Examples</button>
                <Link to="/creator-dashboard" className="block">Creator dashboard</Link>
              </div>
            </details>
            <details className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-[#64748B] flex items-center justify-between">Resources <span className="text-[#64748B]">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-[#64748B]">
                <Link to="/blog" className="block">Blog</Link>
                <a href="mailto:support@creatorarmour.com" className="block">Help Center</a>
                <Link to="/free-influencer-contract" className="block">Guides for creators</Link>
                <Link to="/rate-calculator" className="block">Influencer pricing guide</Link>
              </div>
            </details>
            <details className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-[#64748B] flex items-center justify-between">Company <span className="text-[#64748B]">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-[#64748B]">
                <Link to="/about" className="block">About</Link>
                <a href="mailto:support@creatorarmour.com" className="block">Contact</a>
                <Link to="/privacy-policy" className="block">Privacy</Link>
                <Link to="/terms-of-service" className="block">Terms</Link>
              </div>
            </details>
          </div>

          <div className="mt-10 border-t border-[#E5E7EB] pt-6">
            <p className="text-sm font-medium text-[#64748B] text-center">
              <span className="font-semibold text-[#16A34A]">50+ creators</span> already using Creator Armour to collaborate professionally with brands.
            </p>
          </div>

          <div className="mt-6 border-t border-[#E5E7EB] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#64748B]">
            <p>© 2026 Creator Armour</p>
            <p className="font-medium">Made for creators</p>
            <div className="flex items-center gap-3">
              <Link to="/privacy-policy" className="hover:text-[#64748B]">Privacy</Link>
              <span className="text-[#64748B]">•</span>
              <Link to="/terms-of-service" className="hover:text-[#64748B]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
