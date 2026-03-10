"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  ArrowRight, ShieldCheck, CheckCircle2, Check,
  Sparkles, MessageCircle, XCircle, Briefcase, Link as LinkIcon, ExternalLink, Instagram, Linkedin, Twitter
} from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

const AANYA_IMG = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop";
const PRIYA_IMG = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop";
const ARJUN_IMG = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop";
const NEHA_IMG = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop";
const ROHAN_IMG = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop";

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();

  const [hasScrolled, setHasScrolled] = useState(false);

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
    <div className="min-h-screen bg-white sm:bg-[#FAFAFA] text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEOHead title={seoTitle} description={seoDescription} keywords={seoKeywords} canonicalUrl={canonicalUrl} />

      {/* Modern Top Nav */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b pt-[max(env(safe-area-inset-top),0px)]",
        hasScrolled
          ? "bg-white/90 backdrop-blur-xl border-slate-200 shadow-sm"
          : "bg-white border-slate-100 shadow-sm md:bg-transparent md:border-transparent md:shadow-none"
      )}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[17px] font-black tracking-tight text-slate-900">
              Creator Armour
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-8 bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200/60 shadow-sm">
            <a href="#how-it-works" className="text-[13px] font-bold text-slate-600 hover:text-emerald-600 transition-colors">How it Works</a>
            <a href="#marketplace" className="text-[13px] font-bold text-slate-600 hover:text-emerald-600 transition-colors">Packages</a>
            <a href="#social-proof" className="text-[13px] font-bold text-slate-600 hover:text-emerald-600 transition-colors">Creators</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block px-4 py-2 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
              Log In
            </Link>
            <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-[14px] font-black shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all whitespace-nowrap">
              Create Collab Link
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 sm:pt-28 lg:pt-40 pb-24 space-y-16 lg:space-y-28">
        {/* 1. HERO SECTION */}
        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto relative scroll-mt-24">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-emerald-100/40 via-blue-50/40 to-transparent blur-[100px] rounded-full -z-10" />

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-24 w-full">
            <div className="flex-1 text-center lg:text-left pt-2 lg:pt-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-8 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[13px] font-bold text-emerald-700 uppercase tracking-wide">The Operating System for Creators</span>
              </div>

              <h1 className="text-[42px] md:text-[68px] lg:text-[76px] font-black tracking-tight leading-[1.05] mb-6 text-slate-900 drop-shadow-sm">
                Close Brand Deals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 inline-block mt-2">
                  Without <span className="whitespace-nowrap">Instagram DMs</span>
                </span>
              </h1>

              <p className="text-[17px] md:text-[20px] text-slate-600 font-medium mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Creator Armour gives creators a professional collaboration page where brands send structured offers, choose packages, and close deals without messy messages.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link to="/signup" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-black text-[16px] shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 border border-emerald-700">
                  Create Your Collab Link <ArrowRight className="w-5 h-5" />
                </Link>
                <button onClick={() => navigate('/pratyush')} className="w-full sm:w-auto bg-white hover:bg-slate-50 border shadow-sm border-slate-200 text-slate-700 px-8 py-4 rounded-full font-black text-[16px] transition-all flex items-center justify-center gap-2">
                  View Demo Creator Page
                </button>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="flex-1 w-full max-w-[420px] lg:max-w-none relative">
              {/* Floating Creator Profile Badge */}
              <div className="hidden md:flex absolute -left-16 md:-left-24 top-20 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-20 items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 hover:scale-105 transition-transform">
                <img src={AANYA_IMG} alt="Aanya Kapoor" className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-black text-slate-900">Aanya Kapoor</h3>
                    <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                  </div>
                  <p className="text-[12px] font-bold text-slate-500 leading-tight">Lifestyle Creator • 42K followers</p>
                </div>
              </div>

              {/* Floating Offer Notification */}
              <div className="hidden md:flex absolute -right-8 md:-right-16 top-64 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-30 items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-1000 delay-700 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">New Offer Received</p>
                  <p className="text-base font-black text-slate-900">₹4,000 from Myntra</p>
                </div>
              </div>

              {/* Phone Mockup Screen */}
              <div className="bg-slate-50 rounded-[40px] md:rounded-[48px] shadow-2xl border-[10px] md:border-[14px] border-slate-100 overflow-hidden w-full max-w-[360px] md:max-w-[380px] mx-auto relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 ring-1 ring-slate-900/5">
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-200 rounded-full z-20" />

                <div className="px-5 md:px-6 pt-14 md:pt-16 pb-8 bg-white h-auto md:h-[680px] overflow-visible md:overflow-y-auto no-scrollbar relative">
                  {/* Decorative background blur */}
                  <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-blue-50 to-white" />

                  <div className="relative z-10 flex flex-col items-center mb-6">
                    <img src={AANYA_IMG} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" alt="Creator" />
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-1">Aanya Kapoor <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-50" /></h2>
                    <p className="text-[13px] font-bold text-slate-500 mb-4">@aanyakapoor</p>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 w-full shadow-sm text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Typical Collab Rate</p>
                      <p className="text-xl font-black text-slate-900">₹2K–₹4K</p>
                    </div>
                  </div>

                  {/* Packages */}
                  <div className="space-y-4 relative z-10">
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-[15px] text-slate-900">Reel Deal</h5>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                          <span className="text-xl">🎬</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">1 High-quality Instagram Reel with professional hooks and brand tagging.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <span className="text-lg font-black text-slate-900">₹2,499</span>
                        <div className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-black">Select</div>
                      </div>
                    </div>

                    <div className="border-2 border-emerald-500 bg-white rounded-2xl p-5 relative shadow-lg shadow-emerald-500/10">
                      <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-[11px] uppercase font-black px-3 py-1 rounded-full tracking-wide">Most Popular</div>
                      <div className="flex justify-between items-start mb-2 mt-1">
                        <h5 className="font-black text-[15px] text-slate-900">Engagement Package</h5>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                          <span className="text-xl">🔥</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mb-4">1 Reel + 2 Engagement Stories to maximize reach and drive action.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-emerald-50">
                        <span className="text-lg font-black text-emerald-600">₹3,999</span>
                        <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Select</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-[15px] text-slate-900">Product Review</h5>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                          <span className="text-xl">📦</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mb-4">In-depth product unboxing and review with 1 story mention.</p>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <span className="text-lg font-black text-slate-900">Barter</span>
                        <div className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-black">Select</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Logos Section */}
        <section className="border-y border-slate-200 bg-white py-10 md:py-12">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-8">Example brands creators collaborate with</p>
            <div className="flex justify-center items-center gap-8 sm:gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500 overflow-hidden flex-wrap">
              <span className="text-2xl md:text-3xl font-black tracking-tighter shrink-0">NYKAA</span>
              <span className="text-2xl md:text-3xl font-black tracking-tight shrink-0" style={{ fontFamily: "Impact, sans-serif" }}>boAt</span>
              <span className="text-2xl md:text-3xl font-bold tracking-tight shrink-0">mamaearth</span>
              <span className="text-2xl md:text-3xl font-black tracking-tight shrink-0" style={{ fontFamily: "Georgia, serif" }}>Myntra</span>
              <span className="text-2xl md:text-3xl font-black tracking-widest text-pink-600 shrink-0">SUGAR</span>
            </div>
          </div>
        </section>

        {/* 2. CREATOR SOCIAL PROOF */}
        <section id="social-proof" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-[40px] font-black tracking-tight text-slate-900 lg:max-w-2xl mx-auto leading-tight">
              Top creators running their business on Armour
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: 'Priya Sharma', category: 'Fashion Creator', loc: 'Delhi', followers: '36K', price: '₹3K', img: PRIYA_IMG },
              { name: 'Arjun Patel', category: 'Tech Reviewer', loc: 'Mumbai', followers: '51K', price: '₹4K', img: ARJUN_IMG },
              { name: 'Neha Verma', category: 'Beauty Creator', loc: 'Bangalore', followers: '28K', price: '₹2K', img: NEHA_IMG },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-slate-200 p-5 md:p-6 rounded-[24px] md:rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <img src={c.img} alt={c.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{c.name}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{c.category} • {c.loc}</p>
                    <p className="text-[13px] font-bold text-slate-700 mt-1">{c.followers} followers</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between mt-4">
                  <span className="text-sm font-bold text-slate-500">Typical deal</span>
                  <span className="font-black text-emerald-600 text-lg">{c.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. YOUR COLLAB LINK */}
        <section id="how-it-works" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24">
          <div className="bg-slate-900 rounded-[36px] md:rounded-[48px] p-6 md:p-16 lg:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />

            <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative z-10">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-[13px] font-bold text-white tracking-wide">Your Collab Link</span>
                </div>
                <h2 className="text-3xl md:text-[52px] font-black tracking-tight text-white leading-tight">
                  Add your link to your Instagram bio.
                </h2>
                <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Stop losing deals in the noise. Let brands send structured collaboration offers directly through your personal Creator Armour page.
                </p>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl inline-block mt-4 backdrop-blur-sm">
                  <p className="font-mono text-emerald-400 font-bold text-lg md:text-xl">creatorarmour.com/priyasharma</p>
                </div>
              </div>

              <div className="flex-1 w-full max-w-[340px] lg:max-w-none flex justify-center lg:justify-end">
                {/* Creator Collab Page Mockup */}
                <div className="bg-white w-full max-w-[320px] rounded-[40px] shadow-2xl overflow-hidden border-8 border-slate-800">
                  <div className="px-5 pt-8 pb-6 bg-slate-50 relative">
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-50 to-transparent" />

                    <div className="relative z-10 text-center mb-6">
                      <img src={PRIYA_IMG} className="w-20 h-20 rounded-full mx-auto object-cover border-[3px] border-white shadow-sm mb-3" alt="Priya Sharma" />
                      <h3 className="font-black text-lg text-slate-900 flex items-center justify-center gap-1">Priya Sharma <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" /></h3>
                      <p className="text-[12px] font-bold text-slate-500 mb-3">36K Followers</p>

                      <div className="bg-white border border-slate-200 rounded-xl p-3 inline-block shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Typical Collab Rate</p>
                        <p className="text-lg font-black text-slate-900">₹2K–₹4K</p>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10 w-full">
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex justify-between items-center">
                        <span className="font-black text-sm text-slate-900">Reel Deal</span>
                        <span className="font-black text-sm text-emerald-600">₹1,999</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-full" />
                        <span className="font-black text-sm text-slate-900 relative z-10">Engagement Package</span>
                        <span className="font-black text-sm text-emerald-600 relative z-10">₹3,499</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MARKETPLACE PACKAGE PREVIEW */}
        <section id="marketplace" className="px-4 sm:px-6 max-w-[1200px] mx-auto scroll-mt-24">
          <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="text-center px-6 md:px-8 pt-12 md:pt-16 pb-8 md:pb-12 bg-slate-50/50 border-b border-slate-100">
              <h2 className="text-3xl md:text-[44px] font-black tracking-tight text-slate-900 mb-4">Your custom marketplace</h2>
              <p className="text-lg text-slate-500 font-medium">Let brands shop your services like a high-end catalog.</p>
            </div>

            <div className="p-5 md:p-16 bg-white">
              <div className="max-w-[1000px] mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12 pb-12 border-b border-slate-100">
                  <img src={ROHAN_IMG} alt="Rohan Mehta" className="w-24 h-24 rounded-full object-cover shadow-md border border-slate-100" />
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 mb-1">Rohan Mehta</h3>
                    <p className="text-base font-bold text-slate-500 flex items-center justify-center md:justify-start gap-2">Travel Creator <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> 58K followers</p>
                  </div>
                  <div className="md:ml-auto mt-4 md:mt-0">
                    <button className="bg-slate-900 text-white font-black px-6 py-3 rounded-xl shadow-lg hover:bg-black transition-all">Collab With Rohan</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 md:p-8 text-center">
                  <p className="text-sm font-bold text-slate-500 mb-1">Interactive package catalog</p>
                  <p className="text-sm text-slate-600 mb-4">See how brands browse creator packages, compare deliverables, and send structured offers.</p>
                  <button
                    onClick={() => navigate('/pratyush')}
                    className="bg-slate-900 text-white font-black px-6 py-3 rounded-xl shadow-lg hover:bg-black transition-all"
                  >
                    Explore Demo Creator Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DEAL PROOF SECTION */}
        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-[40px] font-black text-slate-900 mb-4">Real deals closed recently</h2>
            <p className="text-lg text-slate-600 font-medium">Creators are consistently booking deals using their Armour profiles.</p>
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-2 snap-x snap-mandatory">
            {[
              { name: 'Priya Sharma', img: PRIYA_IMG, brand: 'Myntra', package: '1 Reel + 2 Stories', val: '₹4,500' },
              { name: 'Arjun Patel', img: ARJUN_IMG, brand: 'Boat', package: 'Product Review', val: '₹3,000 + product' },
              { name: 'Neha Verma', img: NEHA_IMG, brand: 'Mamaearth', package: '1 Reel', val: '₹2,000' },
            ].map((d, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 md:p-8 rounded-[28px] md:rounded-[32px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img src={d.img} alt={d.name} className="w-12 h-12 rounded-full border border-slate-200 object-cover" />
                    <span className="font-black text-base text-slate-900">{d.name}</span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">Closed</div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Brand</span>
                    <span className="text-base font-black text-slate-900">{d.brand}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Package</span>
                    <span className="text-base font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{d.package}</span>
                  </div>
                  <div className="flex justify-between mt-6 pt-6 border-t border-slate-100 items-center">
                    <span className="text-sm font-bold text-slate-500">Deal Value</span>
                    <span className="text-2xl font-black text-emerald-600">{d.val}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PRE-FOOTER CTA */}
        <section className="px-4 sm:px-6 pb-10">
          <div
            className="max-w-[1200px] mx-auto rounded-[24px] px-6 py-12 md:px-10 md:py-14 text-center text-white shadow-[0_28px_70px_rgba(11,59,47,0.36)] border border-emerald-300/25 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0e3b2f,#1fb97a)' }}
          >
            <div className="absolute -top-32 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-[32px] md:text-[52px] font-black tracking-tight leading-[1.05] mb-4">
                Turn your Instagram into a deal pipeline
              </h2>
              <p className="text-base md:text-xl font-medium text-emerald-50/90 mb-8 md:mb-10 leading-relaxed">
                Stop negotiating in DMs. Create your collab link and receive structured brand offers.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link to="/signup" className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 rounded-full font-black text-[15px] shadow-xl transition-all flex items-center justify-center gap-2">
                  Create your collab link <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <button onClick={() => navigate('/pratyush')} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/35 text-white px-8 py-4 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                  View demo creator page <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-[#f7f9fb] pt-[60px] pb-[40px] px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
            <div className="md:col-span-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[20px] font-black tracking-tight text-slate-900">Creator Armour</h3>
              </Link>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed font-medium text-slate-600">
                Close brand deals without Instagram DMs.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a href="https://instagram.com/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 inline-flex items-center justify-center transition-colors" aria-label="Creator Armour Instagram">
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a href="https://x.com/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 inline-flex items-center justify-center transition-colors" aria-label="Creator Armour X">
                  <Twitter className="w-4.5 h-4.5" />
                </a>
                <a href="https://www.linkedin.com/company/creatorarmour" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 inline-flex items-center justify-center transition-colors" aria-label="Creator Armour LinkedIn">
                  <Linkedin className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            <div className="hidden md:grid md:col-span-8 grid-cols-4 gap-8">
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-900">Product</p>
                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <Link to="/signup" className="block hover:text-emerald-700">Create Collab Link</Link>
                  <Link to="/discover" className="block hover:text-emerald-700">Creator Marketplace</Link>
                  <Link to="/collab-requests" className="block hover:text-emerald-700">Brand Offers</Link>
                  <Link to="/plan/growth" className="block hover:text-emerald-700">Pricing</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-900">Creators</p>
                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <a href="#how-it-works" className="block hover:text-emerald-700">How it works</a>
                  <a href="#marketplace" className="block hover:text-emerald-700">Creator packages</a>
                  <button onClick={() => navigate('/pratyush')} className="block text-left hover:text-emerald-700">Examples</button>
                  <Link to="/creator-dashboard" className="block hover:text-emerald-700">Creator dashboard</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-900">Resources</p>
                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <Link to="/blog" className="block hover:text-emerald-700">Blog</Link>
                  <a href="mailto:support@creatorarmour.com" className="block hover:text-emerald-700">Help Center</a>
                  <Link to="/free-influencer-contract" className="block hover:text-emerald-700">Guides for creators</Link>
                  <Link to="/rate-calculator" className="block hover:text-emerald-700">Influencer pricing guide</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-900">Company</p>
                <div className="space-y-2.5 text-sm font-medium text-slate-600">
                  <Link to="/about" className="block hover:text-emerald-700">About</Link>
                  <a href="mailto:support@creatorarmour.com" className="block hover:text-emerald-700">Contact</a>
                  <Link to="/privacy-policy" className="block hover:text-emerald-700">Privacy</Link>
                  <Link to="/terms-of-service" className="block hover:text-emerald-700">Terms</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden mt-7 space-y-2">
            <details className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-slate-900 flex items-center justify-between">Product <span className="text-slate-400">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-slate-600">
                <Link to="/signup" className="block">Create Collab Link</Link>
                <Link to="/discover" className="block">Creator Marketplace</Link>
                <Link to="/collab-requests" className="block">Brand Offers</Link>
                <Link to="/plan/growth" className="block">Pricing</Link>
              </div>
            </details>
            <details className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-slate-900 flex items-center justify-between">Creators <span className="text-slate-400">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-slate-600">
                <a href="#how-it-works" className="block">How it works</a>
                <a href="#marketplace" className="block">Creator packages</a>
                <button onClick={() => navigate('/pratyush')} className="block text-left">Examples</button>
                <Link to="/creator-dashboard" className="block">Creator dashboard</Link>
              </div>
            </details>
            <details className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-slate-900 flex items-center justify-between">Resources <span className="text-slate-400">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-slate-600">
                <Link to="/blog" className="block">Blog</Link>
                <a href="mailto:support@creatorarmour.com" className="block">Help Center</a>
                <Link to="/free-influencer-contract" className="block">Guides for creators</Link>
                <Link to="/rate-calculator" className="block">Influencer pricing guide</Link>
              </div>
            </details>
            <details className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <summary className="list-none cursor-pointer text-sm font-black text-slate-900 flex items-center justify-between">Company <span className="text-slate-400">▼</span></summary>
              <div className="pt-3 space-y-2 text-sm font-medium text-slate-600">
                <Link to="/about" className="block">About</Link>
                <a href="mailto:support@creatorarmour.com" className="block">Contact</a>
                <Link to="/privacy-policy" className="block">Privacy</Link>
                <Link to="/terms-of-service" className="block">Terms</Link>
              </div>
            </details>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <p className="text-sm font-medium text-slate-600 text-center">
              <span className="font-semibold text-emerald-700">50+ creators</span> already using Creator Armour to collaborate professionally with brands.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <p>© 2026 Creator Armour</p>
            <p className="font-medium">Made for creators</p>
            <div className="flex items-center gap-3">
              <Link to="/privacy-policy" className="hover:text-slate-700">Privacy</Link>
              <span className="text-slate-300">•</span>
              <Link to="/terms-of-service" className="hover:text-slate-700">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
