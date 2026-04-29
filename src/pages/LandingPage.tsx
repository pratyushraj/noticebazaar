

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowRight, ShieldCheck, CheckCircle2, Instagram, Linkedin, Twitter, Menu, X, BriefcaseBusiness, Zap, Clock, XCircle, Wallet, Landmark, ChevronRight, FileText, Gavel, AlertTriangle } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { optimizeImage } from '@/lib/utils/image';

const ThreeDIllustration = lazy(() =>
  import('@/components/ui/ThreeDIllustration').then(m => ({ default: m.default }))
);

const AANYA_IMG = optimizeImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";
const PRIYA_IMG = optimizeImage("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";
const ARJUN_IMG = optimizeImage("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";
const NEHA_IMG = optimizeImage("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";
const RITIKA_IMG = optimizeImage("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";
const ROHAN_IMG = optimizeImage("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? "";

const dashboardShowcase = [
  {
    eyebrow: 'Incoming Offers',
    title: 'Know what brands are offering',
    description: 'Creators see live offer value, deliverables, and due dates instead of re-reading old chats.',
    accent: 'emerald',
    icon: BriefcaseBusiness,
    body: (
      <div className="space-y-4">
        {/* New Offers Card Demo */}
        <div className="p-5 rounded-[28px] border bg-white border-slate-200/60 shadow-[0_15px_35px_rgba(0,0,0,0.05)] relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-100 whitespace-nowrap">
                <Zap className="w-3 h-3 fill-current" />
                Standard Deal
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-rose-50 text-rose-600 border-rose-100 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              Exp. in 2 days
            </span>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="w-[100px] h-[100px] rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50/50 shrink-0 p-1 shadow-md transition-all duration-500 group-hover:scale-[1.05]">
              <img 
                src={optimizeImage("https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&h=500&q=80", { width: 128, quality: 80 }) ?? ""} 
                alt="Nykaa Beauty Logo" 
                className="w-full h-full object-cover rounded-[18px]" 
              />
            </div>

            <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-between">
              <div className="min-w-0">
                <h4 className="text-[18px] font-black tracking-tight leading-tight truncate text-slate-900">
                  Nykaa Beauty
                </h4>
                <p className="text-[12px] font-bold mt-1 text-slate-500 truncate">
                  1 Reel + 3 Stories
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-[24px] font-black tracking-tighter tabular-nums leading-none text-slate-900">
                    ₹18,000
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earnings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-[48px] rounded-[18px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <CheckCircle2 className="w-4 h-4" />
              Accept
            </div>
            <div className="h-[48px] rounded-[18px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600">
              <XCircle className="w-4 h-4" />
              Decline
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Revenue Management',
    title: 'Track paid, late, or at risk',
    description: 'The payout side should feel as visible as the storefront so creators know what to follow up on fast.',
    icon: Wallet,
    accent: 'teal',
    body: (
      <div className="space-y-6">
        <div className="p-6 rounded-[2.5rem] border bg-white border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 text-slate-500">Total Revenue</p>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900">
                ₹50,159
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50">
              <Wallet className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border bg-orange-50/30 border-orange-100/50 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
              </div>
              <p className="text-xl font-black text-slate-900">₹41,160</p>
            </div>
            <div className="p-4 rounded-2xl border bg-green-50/30 border-green-100/50 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Out</p>
              </div>
              <p className="text-xl font-black text-slate-900">₹8,999</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payout Method</h4>
            <button className="text-[10px] font-bold text-blue-600">Edit Details</button>
          </div>
          <div className="p-5 rounded-3xl border flex items-center justify-between bg-white border-slate-200 shadow-sm text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-600">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[15px] font-bold text-slate-900">UPI Transfer</p>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">Verified</span>
                </div>
                <p className="text-xs font-medium text-slate-400 font-mono tracking-tight">ama*****@oksbi</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Legal Protection',
    title: 'Lawyer support on demand',
    description: 'In case a brand denies payment or breaches the agreement, our legal team is ready to step in.',
    icon: Gavel,
    accent: 'blue',
    body: (
      <div className="space-y-4">
      <div className="p-5 rounded-[28px] border bg-white border-slate-200/60 shadow-[0_15px_35px_rgba(0,0,0,0.05)] relative overflow-hidden group">
        <div className="flex gap-4 mb-6">
          <div className="w-[100px] h-[100px] rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50/50 shrink-0 p-1 shadow-md transition-all duration-500 group-hover:scale-[1.05]">
            <img 
              src="/assets/images/lawyer-pratik.png" 
              alt="Lawyer Pratik Singh" 
              className="w-full h-full object-cover rounded-[18px]" 
            />
          </div>

          <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-center text-left">
            <div className="min-w-0">
              <h4 className="text-[18px] font-black tracking-tight leading-tight truncate text-slate-900">
                Pratik Singh
              </h4>
              <p className="text-[12px] font-bold mt-1 text-slate-500 truncate">
                Senior Legal Counsel
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dispute Detected</p>
            <p className="text-sm font-black text-slate-900">Payment Overdue: 14 Days</p>
          </div>
        </div>
        
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4 text-left">
          <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
            "Brand has not released payment after approval. Initiating legal notice..."
          </p>
        </div>

        <button className="w-full h-12 rounded-[18px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 bg-slate-900 text-white shadow-lg">
          <Gavel className="w-4 h-4" />
          Request Legal Aid
        </button>
      </div>
      </div>
    ),
  },
];

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const canonicalUrl = 'https://noticebazaar.com/';
  const seoTitle = 'NoticeBazaar - Close Brand Deals Without Instagram DMs';
  const seoDescription = 'NoticeBazaar gives you a professional collaboration page where brands send structured offers, contracts are generated automatically, and deals are tracked in your dashboard.';
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

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const audience = params.get('audience');
    if (audience === 'brand') {
      navigate('/brands', { replace: true });
      return;
    }
    if (audience === 'creator') {
      navigate('/', { replace: true });
    }
  }, [location.search, loading, navigate]);

  const setLandingAudience = (audience: 'creator' | 'brand') => {
    try {
      localStorage.setItem('landing_audience', audience);
    } catch {
      // ignore storage failures
    }
    navigate(audience === 'brand' ? '/brands' : '/');
  };

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
              name: 'NoticeBazaar',
              url: 'https://noticebazaar.com',
              description: seoDescription,
            },
            {
              '@type': 'SoftwareApplication',
              name: 'NoticeBazaar',
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
            <h1 className="text-[16px] sm:text-[17px] font-black tracking-tight text-[#0F172A] whitespace-nowrap hidden min-[380px]:block">
              NoticeBazaar
            </h1>
          </Link>

          <div className="hidden lg:flex items-center gap-6 bg-white/95 backdrop-blur-md px-6 py-2 rounded-full border border-[#E5E7EB] shadow-sm">
            <a href="#how-it-works" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">How it Works</a>
            <a href="#marketplace" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">Packages</a>
            <a href="#social-proof" className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] transition-colors whitespace-nowrap">Creators</a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-3.5 sm:px-5 py-2 sm:py-3 rounded-full text-[13px] sm:text-[15px] font-black shadow-lg shadow-[#16A34A]/25 hover:shadow-[#16A34A]/40 hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0 min-h-[40px] sm:min-h-[44px] flex items-center justify-center"
            >
              Create <span className="hidden min-[400px]:inline ml-1">Collab </span>Link
            </Link>
            {/* Mobile menu button */}
            <button type="button"
              className="lg:hidden p-1.5 sm:p-2 rounded-xl hover:bg-[#F8FAF9] transition-colors shrink-0"
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
              <h1 className="text-[48px] md:text-[72px] lg:text-[84px] font-black tracking-tight leading-[1.05] mb-6 text-[#0F172A] drop-shadow-sm text-balance">
                Get brand deals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16A34A] to-[#15803D] inline-block mt-2">
                  without DMs
                </span>
              </h1>

              <p className="text-[20px] md:text-[24px] text-[#64748B] font-medium mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed text-pretty">
                Send one link. Brands send offers.
              </p>

              <div className="mb-8 inline-flex flex-col sm:flex-row gap-3 p-2 rounded-[1.5rem] border border-[#E5E7EB] bg-white/80 backdrop-blur-sm shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setLandingAudience('creator');
                  }}
                  className="min-w-[180px] px-5 py-3 rounded-[1.1rem] text-left transition-all"
                >
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#16A34A]">For creators</span>
                  <span className="block mt-1 text-sm font-black text-[#0F172A]">Build your collab link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setLandingAudience('brand');
                  }}
                  className="min-w-[180px] px-5 py-3 rounded-[1.1rem] bg-[#0F172A] text-white text-left transition-all shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                >
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">For brands</span>
                  <span className="block mt-1 text-sm font-black">Discover and send offers</span>
                </button>
              </div>

              {/* Floating 3D Hero Illustration */}
              <div className="hidden xl:flex justify-center mb-8">
                <Suspense fallback={null}>
                  <ThreeDIllustration type="hero" size="md" />
                </Suspense>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link
                    to="/signup?mode=creator"
                    className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-5 rounded-full font-black text-[18px] shadow-xl shadow-[#16A34A]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 border border-[#16A34A]"
                  >
                    Create my link <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/#how-it-works"
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
                <img src={AANYA_IMG} alt="Ananya Kapoor" className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-black text-[#0F172A]">Ananya Kapoor</h3>
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
                  <Clock className="w-5 h-5" />
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
                    <img src={AANYA_IMG} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" alt="Creator Ananya Kapoor Profile Photo" />
                    <h2 className="text-2xl font-black text-[#0F172A] flex items-center gap-1">Ananya Kapoor <CheckCircle2 className="w-6 h-6 text-[#16A34A] fill-[#DCFCE7]" /></h2>
                    <p className="text-[13px] font-bold text-[#64748B] mb-4">@aanyakapoor</p>

                    <div className="bg-[#F8FAF9] border border-[#E5E7EB] rounded-2xl p-4 w-full shadow-sm text-center">
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Typical Collab Rate</p>
                      <p className="text-xl font-black text-[#0F172A]">₹2K–₹4K</p>
                    </div>
                  </div>

                                <div className="space-y-4 relative z-10">
                      <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white shadow-sm hover:border-[#16A34A] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-black text-[15px] text-[#0F172A]">🚀 Starter Collab</h5>
                          <div className="w-8 h-8 rounded-full bg-[#F8FAF9] flex items-center justify-center">
                            <span className="text-xl">🎬</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-[#64748B] mb-4 line-clamp-2">High-performing Reel optimized for organic reach.</p>
                        <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                          <span className="text-lg font-black text-[#0F172A]">₹1,999</span>
                          <div className="bg-[#F8FAF9] text-[#64748B] px-4 py-1.5 rounded-xl text-xs font-black">Select</div>
                        </div>
                      </div>

                      <div className="border-2 border-[#16A34A] bg-white rounded-2xl p-5 relative shadow-lg shadow-[#16A34A]/10">
                        <div className="absolute -top-3 left-4 bg-[#16A34A] text-white text-[11px] uppercase font-black px-3 py-1 rounded-full tracking-wide">Most chosen</div>
                        <div className="flex justify-between items-start mb-2 mt-1">
                          <h5 className="font-black text-[15px] text-[#0F172A]">⭐ Growth Campaign</h5>
                          <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                            <span className="text-xl">🔥</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-[#64748B] mb-4">Premium Reel, 30-day ad usage rights, hook optimization, and Story shoutout.</p>
                        <div className="flex justify-between items-center pt-3 border-t border-[#16A34A]">
                          <span className="text-lg font-black text-[#16A34A]">₹3,499</span>
                          <div className="bg-[#16A34A] text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">Select</div>
                        </div>
                      </div>

                      <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white shadow-sm hover:border-[#16A34A] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-black text-[15px] text-[#0F172A]">🎁 Product Exchange</h5>
                          <div className="w-8 h-8 rounded-full bg-[#F8FAF9] flex items-center justify-center">
                            <span className="text-xl">📦</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-[#64748B] mb-4">Product unboxing or review with Story mention and no paid usage rights.</p>
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

        {/* Trust Stats Bar */}
        <section className="bg-[#0F172A] py-6 md:py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
              {[
                { stat: '12,400+', label: 'Creators on platform' },
                { stat: '₹4.2Cr+', label: 'Paid out to creators' },
                { stat: '98%', label: 'Creator satisfaction' },
                { stat: '4.8★', label: 'Average app rating' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{item.stat}</p>
                  <p className="text-xs md:text-sm font-medium text-slate-400">{item.label}</p>
                </div>
              ))}
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
                      panel.accent === 'emerald' && 'bg-[#DCFCE7] text-[#16A34A]',
                      panel.accent === 'blue' && 'bg-[#DBEAFE] text-[#2563EB]',
                      panel.accent === 'teal' && 'bg-[#F0FDFA] text-[#0D9488]',
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#64748B]">{panel.eyebrow}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-[19px] sm:text-2xl font-black tracking-tight text-[#0F172A] leading-tight whitespace-nowrap overflow-hidden text-ellipsis sm:whitespace-normal">{panel.title}</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { name: 'Priya Sharma', category: 'Fashion Creator', loc: 'Delhi', followers: '36K', price: '₹3K', earned: '₹24,500 this week', img: PRIYA_IMG, type: 'creator' },
              { name: 'Arjun Patel', category: 'Tech Reviewer', loc: 'Mumbai', followers: '51K', price: '₹4K', earned: '₹12,000 per reel', img: ARJUN_IMG, type: 'creator' },
              { name: 'Neha Verma', category: 'Beauty Creator', loc: 'Bangalore', followers: '28K', price: '₹2K', earned: '₹18,500 last month', img: NEHA_IMG, type: 'creator' },
              { name: 'Ritika Shah', category: 'Brand: SkinCare Co.', loc: 'Mumbai', followers: '—', price: '₹8K avg', earned: '24 creators, 0 disputes', img: RITIKA_IMG, type: 'brand' },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] p-6 md:p-8 rounded-[20px] md:rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <img src={c.img} alt={c.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" loading="lazy" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-[#0F172A] text-lg">{c.name}</h3>
                      {c.type === 'brand' && <span className="text-[10px] font-black bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full">BRAND</span>}
                    </div>
                    <p className="text-[13px] font-medium text-[#64748B]">{c.category}</p>
                  </div>
                </div>
                <div className="bg-[#F8FAF9] border border-[#E5E7EB] rounded-2xl p-4">
                  <p className="text-sm font-bold text-[#16A34A] mb-1">{c.earned}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#64748B]">{c.type === 'brand' ? 'Avg deal value' : 'Typical deal'}</span>
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
                  Stop losing deals in the noise. Let brands send structured collaboration offers directly through your personal NoticeBazaar page.
                </p>
                <div className="bg-[#F8FAF9] border border-[#E5E7EB] p-4 rounded-xl inline-block mt-4 backdrop-blur-sm">
                  <p className="font-mono text-[#16A34A] font-bold text-lg md:text-xl">noticebazaar.com/priyasharma</p>
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
                        <span className="font-black text-sm text-[#0F172A] relative z-10">⭐ Growth Campaign</span>
                        <span className="font-black text-sm text-[#16A34A] relative z-10">₹3,499</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>





        {/* CUSTOM MARKETPLACE SECTION */}
        <section id="marketplace" className="px-4 sm:px-6 max-w-[1200px] mx-auto py-16 lg:py-24 border-t border-slate-100/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-black tracking-tight text-[#0F172A] whitespace-nowrap overflow-hidden text-ellipsis sm:whitespace-normal">
              Your custom marketplace
            </h2>
            <p className="mt-4 text-lg text-[#64748B] font-medium max-w-2xl mx-auto">
              Replace messy email threads with a sleek marketplace where brands buy your packages instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {/* Rohan Mehta Card */}
            <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
               <div className="flex items-center gap-4 mb-8 text-left">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                    <img src={ROHAN_IMG} className="w-full h-full object-cover" alt="Rohan Mehta" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Rohan Mehta</h3>
                    <p className="text-sm font-bold text-slate-500">Travel Creator • 120K followers</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                 <div className="p-6 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/30 relative text-left">
                   <div className="absolute -top-3 right-6 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                     Most chosen
                   </div>
                   <h4 className="text-lg font-black text-slate-900 mb-1">Ultimate Travel Vlog Bundle</h4>
                   <p className="text-sm font-medium text-slate-500 mb-4">1 YouTube Vlog + 3 Instagram Reels + 5 High-res Photos</p>
                   <div className="flex items-center justify-between">
                     <p className="text-2xl font-black text-slate-900">₹25,000</p>
                     <button className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-black text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-colors">
                       Book Now
                     </button>
                   </div>
                 </div>
               </div>
            </div>
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
      <footer className="bg-[#05070A] pt-24 pb-12 px-6 relative overflow-hidden border-t border-white/5">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#16A34A]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 pb-20 border-b border-white/5">
            {/* Brand Column */}
            <div className="lg:col-span-5 space-y-8">
              <Link to="/" className="flex items-center gap-2 group w-fit">
                <div className="w-11 h-11 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-lg shadow-[#16A34A]/25 transition-all group-hover:scale-105 group-hover:rotate-3">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[24px] font-black tracking-tight text-white italic uppercase">NoticeBazaar</h3>
              </Link>
              <p className="max-w-md text-[17px] leading-relaxed font-medium text-slate-400">
                The high-performance infrastructure for creators to close brand deals, manage contracts, and track revenue professionally.
              </p>
              
              <div className="flex items-center gap-4 pt-4">
                <a href="https://www.instagram.com/noticebazaar" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-[#16A34A] hover:border-[#16A34A]/50 inline-flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(22,163,74,0.15)]" aria-label="Instagram">
                  <Instagram className="w-5.5 h-5.5" />
                </a>
                <a href="https://x.com/NoticeBazaar" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-[#16A34A] hover:border-[#16A34A]/50 inline-flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(22,163,74,0.15)]" aria-label="X">
                  <Twitter className="w-5.5 h-5.5" />
                </a>
                <a href="https://www.linkedin.com/company/noticebazaar/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-[#16A34A] hover:border-[#16A34A]/50 inline-flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(22,163,74,0.15)]" aria-label="LinkedIn">
                  <Linkedin className="w-5.5 h-5.5" />
                </a>
              </div>
                            <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-3">
                  <img src={PRIYA_IMG} className="w-10 h-10 rounded-full border-2 border-[#05070A] object-cover" alt="Priya Sharma Profile Photo" />
                  <img src={ARJUN_IMG} className="w-10 h-10 rounded-full border-2 border-[#05070A] object-cover" alt="Arjun Patel Profile Photo" />
                  <img src={NEHA_IMG} className="w-10 h-10 rounded-full border-2 border-[#05070A] object-cover" alt="Neha Verma Profile Photo" />
                </div>
                <p className="text-[15px] font-bold text-slate-300">Join <span className="text-white">500+</span> top creators</p>
              </div>

              <div className="pt-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A] shadow-[0_0_10px_rgba(22,163,74,0.8)]" />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white/80">Fintech Grade Security</span>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-8">
              <div className="space-y-6">
                <p className="text-[13px] font-black uppercase tracking-[0.25em] text-white/30">Platform</p>
                <div className="flex flex-col gap-4 text-[16px] font-bold text-slate-400">
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Collab Link</Link>
                  <a href="#marketplace" className="hover:text-white transition-colors w-fit">Marketplace</a>
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Brand Offers</Link>
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Pricing</Link>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-[13px] font-black uppercase tracking-[0.25em] text-white/30">Resources</p>
                <div className="flex flex-col gap-4 text-[16px] font-bold text-slate-400">
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Creator Blog</Link>
                  <a href="mailto:support@noticebazaar.com" className="hover:text-white transition-colors w-fit">Help Center</a>
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Contract Templates</Link>
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">Rate Tool</Link>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-[13px] font-black uppercase tracking-[0.25em] text-white/30">Company</p>
                <div className="flex flex-col gap-4 text-[16px] font-bold text-slate-400">
                  <Link to="/signup" className="hover:text-white transition-colors w-fit">About Us</Link>
                  <Link to="/privacy-policy" className="hover:text-white transition-colors w-fit">Privacy</Link>
                  <Link to="/terms-of-service" className="hover:text-white transition-colors w-fit">Terms</Link>
                  <a href="mailto:support@noticebazaar.com" className="hover:text-white transition-colors w-fit">Contact</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex flex-col items-center lg:items-start gap-3">
              <p className="text-[15px] font-medium text-slate-500 text-center lg:text-left">
                © 2026 NoticeBazaar. All rights reserved. Built for professional creators.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[14px] font-bold text-slate-500">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
