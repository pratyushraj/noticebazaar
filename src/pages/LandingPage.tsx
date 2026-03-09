"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSchema, BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { unlockBodyScroll } from '@/lib/scrollLock';
import {
  Shield, FileText, DollarSign, MessageCircle,
  CheckCircle, Star, Users, ArrowRight,
  Menu, X, Loader2, ChevronRight,
  Instagram, Youtube, Target, Play,
  Clock, TrendingUp, BarChart3, Fingerprint, Search,
  Link2, ShieldCheck, CreditCard, Activity, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const canonicalUrl = 'https://creatorarmour.com/';
  const seoTitle = 'CreatorArmour | Operating System for Creator Deals';
  const seoDescription = 'CreatorArmour replaces chaotic DMs with structured brand deals. Get auto-generated contracts, track payments, and protect your collaborations.';
  const seoKeywords = [
    'creator operating system',
    'brand deal management',
    'influencer contract automation',
    'creator payment protection',
    'legal tech for creators India',
    'creator armour platform'
  ];

  const faqItems = [
    {
      question: 'What is Creator Armour?',
      answer: 'Creator Armour helps creators replace unstructured brand DMs with a secure collaboration link, deal workflows, auto-generated contracts, and payment tracking.',
    },
    {
      question: 'How does the collaboration link work?',
      answer: 'Brands open your link, submit structured offer details, and you can accept, counter, or decline. If accepted, contract and tracking flows are created automatically.',
    },
    {
      question: 'Does Creator Armour provide legal representation?',
      answer: 'Creator Armour is a software platform for creator deal workflows and legal readiness. It is not a law firm and does not provide legal representation.',
    },
  ];

  useEffect(() => {
    unlockBodyScroll();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session && profile) {
      const userEmail = session?.user?.email?.toLowerCase();
      const isPratyush = userEmail === 'pratyushraj@outlook.com';

      if (isPratyush || profile.role === 'creator' || profile.role === 'client' || !profile.role) {
        navigate('/creator-dashboard', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (profile.role === 'chartered_accountant') {
        navigate('/ca-dashboard', { replace: true });
      } else if (profile.role === 'lawyer') {
        navigate('/lawyer-dashboard', { replace: true });
      }
    }
  }, [session, profile, loading, navigate]);

  if (loading || (session && profile)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const painPoints = [
    {
      icon: DollarSign,
      title: "No Payment Protection",
      description: "You deliver the content, then they ghost. 'Payment next week' becomes never. No written proof, no way to recover.",
      color: "text-red-500",
      bg: "bg-red-500/10"
    },
    {
      icon: FileText,
      title: "No Written Agreement",
      description: "Everything's in DMs. When things go wrong, you have screenshots, not contracts. Brands know this.",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      icon: MessageCircle,
      title: "Endless Back-and-Forth",
      description: "Three days of DMs just to agree on deliverables. Then they change their mind. Then you renegotiate. Again.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Brand opens your link",
      description: "They see a professional form, not a DM. They submit structured budget & deliverables.",
      icon: Link2
    },
    {
      step: "02",
      title: "You review & decide",
      description: "See everything in one dashboard. Accept, counter, or decline. You're in control.",
      icon: Search
    },
    {
      step: "03",
      title: "Contract auto-generated",
      description: "Accept a deal and get a professional contract instantly. Legally binding.",
      icon: ShieldCheck
    },
    {
      step: "04",
      title: "Payments tracked automatically",
      description: "Never chase payments again. Get alerts before deadlines. Escrow ready.",
      icon: CreditCard
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        image="https://creatorarmour.com/og-preview.png"
      />
      <FAQSchema faqs={faqItems} />
      <BreadcrumbSchema items={[{ name: 'Creator Armour', url: canonicalUrl }]} />

      {/* Ambient BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Modern Top Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B0F14]/70 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[16px] font-black tracking-tight font-outfit uppercase">
                Creator<span className="text-blue-500">Armour</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-blue-400">
                Operating System
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a href="#problem" className="text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Why DMs Suck</a>
            <a href="#workflow" className="text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Workflow</a>
            <a href="#protection" className="text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Protection</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all hover:bg-white/5 rounded-xl">
              Log In
            </Link>
            <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
              Deploy Protocol <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">

        {/* HERO SECTION */}
        <section className="px-6 min-h-[75vh] flex flex-col items-center justify-center text-center max-w-[1440px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full max-w-5xl">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-10">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">Armour Protocol 2.0 Live</span>
            </div>

            <h1 className="text-[52px] md:text-[80px] lg:text-[100px] font-black tracking-tighter leading-[0.95] mb-8 font-outfit uppercase">
              <span className="block text-white">Scale Your</span>
              <span className="block text-white/60">Creator Business</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mt-2">
                Through Structure
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-white/50 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              Armour turns chaotic DMs into a structured operating system for your brand deals.
              Protect your work, track your money, and scale with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3">
                Initialize System <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
                <Play className="w-5 h-5" /> View Demo Console
              </button>
            </div>

            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-8 border-t border-white/10">
              {[
                { label: "Value Under Protection", val: "₹50Cr+" },
                { label: "Creators Active", val: "5,000+" },
                { label: "Payment Recovery", val: "92%" },
                { label: "Disputes Avoided", val: "99%" }
              ].map((stat, i) => (
                <div key={i} className="text-left md:text-center">
                  <div className="text-[28px] md:text-[32px] font-black text-white font-outfit tracking-tighter">{stat.val}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

          </motion.div>
        </section>

        {/* THE PROBLEM */}
        <section id="problem" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="mb-16">
            <h2 className="text-[40px] md:text-[64px] font-black tracking-tighter font-outfit leading-tight mb-4">
              Where DM Deals <span className="text-white/30">Break Down</span>
            </h2>
            <p className="text-xl text-white/50 max-w-xl">Common failure points in the chaotic manual creator-brand workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((pain, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/[0.07] transition-all group">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-xl", pain.bg)}>
                  <pain.icon className={cn("w-8 h-8", pain.color)} />
                </div>
                <h3 className="text-[24px] font-black tracking-tight mb-4 leading-tight">{pain.title}</h3>
                <p className="text-[16px] text-white/60 font-medium leading-relaxed">{pain.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">

            <div className="lg:w-1/3 sticky top-32">
              <h2 className="text-[40px] md:text-[56px] font-black tracking-tighter font-outfit leading-tight mb-6">
                One Link.<br />
                <span className="text-blue-500">Structured Flow.</span>
              </h2>
              <p className="text-lg text-white/50 mb-10">
                Replace ad-hoc chats with a predictable operating system designed specifically for premium content creators.
              </p>
              <div className="hidden lg:block w-32 h-32 rounded-[2rem] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-3xl shadow-[0_0_100px_rgba(37,99,235,0.2)]">
                <ShieldCheck className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6 w-full">
              {workflowSteps.map((step, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative hover:-translate-y-2 transition-transform duration-500">
                  <div className="text-[64px] font-black font-outfit text-white/5 leading-none absolute top-6 right-6 pointer-events-none">
                    {step.step}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 border border-white/5">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-[22px] font-black tracking-tight mb-4 leading-tight pr-8">{step.title}</h3>
                  <p className="text-[15px] text-white/60 font-medium leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="protection" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-[40px] md:text-[64px] font-black tracking-tighter font-outfit leading-tight mb-4">
              Defend Your Content
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">Enterprise-grade tools scaled to individual creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-blue-500/20 p-10 md:p-14 rounded-[3rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 w-full md:w-2/3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-md">
                  <Fingerprint className="w-4 h-4 text-white" />
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Automated Legal</span>
                </div>
                <h3 className="text-[32px] md:text-[40px] font-black tracking-tighter mb-6 leading-tight">Instant Contracts & Escrow Readiness</h3>
                <p className="text-lg text-white/60 leading-relaxed mb-10">
                  The moment you accept an offer, Armour generates a mutually binding, GST-compliant contract. Brands can sign digitally, triggering project start. Let the system play the bad cop.
                </p>
                <div className="flex flex-col gap-4">
                  {['Digital Biometric Signatures', 'Built-in Usage Rights Restrictions', 'Late Payment Penalty Clauses'].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                      <span className="text-[14px] font-bold text-white/80">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 md:p-12 rounded-[3rem] flex flex-col justify-between hover:bg-white/[0.07] transition-all">
              <div>
                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
                  <Activity className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-[28px] font-black tracking-tight mb-4 leading-tight">Timeline & Invoice Sync</h3>
                <p className="text-[15px] text-white/60 font-medium leading-relaxed">
                  Track drafts, revisions, and automated invoicing without manual follow-ups. The system nudges the brand.
                </p>
              </div>
              <button className="mt-8 text-[12px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                See Finance Flow <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto rounded-[3rem] bg-blue-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/20">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 w-full max-w-2xl mx-auto">
              <ShieldCheck className="w-16 h-16 text-white/80 mx-auto mb-8" />
              <h2 className="text-[40px] md:text-[64px] font-black tracking-tighter font-outfit leading-[0.9] mb-8 text-white">
                Initialize Your Creator Instance
              </h2>
              <p className="text-xl text-white/80 font-medium mb-12">
                Join thousands of creators who have upgraded from DMs to a professional operating system. Free to deploy.
              </p>
              <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="inline-flex bg-white hover:bg-slate-100 text-blue-600 px-12 py-6 rounded-2xl font-black text-[14px] uppercase tracking-widest transition-all active:scale-95 items-center justify-center gap-3">
                Deploy Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/10 bg-[#0B0F14] pt-20 pb-10 px-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
          <div className="col-span-2 md:col-span-1">
            <h1 className="text-[16px] font-black tracking-tight font-outfit uppercase mb-4">
              Creator<span className="text-blue-500">Armour</span>
            </h1>
            <p className="text-[12px] font-medium text-white/40 max-w-[250px]">
              The premium operating system for creator and brand deal management. Made for serious content engineers.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/signup" className="text-[14px] font-bold text-white/60 hover:text-white">Join Protocol</Link></li>
              <li><Link to="/login" className="text-[14px] font-bold text-white/60 hover:text-white">Console Access</Link></li>
              <li><Link to="/discover" className="text-[14px] font-bold text-white/60 hover:text-white">Discover Creators</Link></li>
              <li><Link to="/brand-directory" className="text-[14px] font-bold text-white/60 hover:text-white">Brand Directory</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><Link to="/free-influencer-contract" className="text-[14px] font-bold text-white/60 hover:text-white">Contract Generator</Link></li>
              <li><Link to="/collaboration-agreement-generator" className="text-[14px] font-bold text-white/60 hover:text-white">NDA Generator</Link></li>
              <li><Link to="/rate-calculator" className="text-[14px] font-bold text-white/60 hover:text-white">Rate Discovery</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[14px] font-bold text-white/60 hover:text-white">About System</Link></li>
              <li><Link to="/privacy-policy" className="text-[14px] font-bold text-white/60 hover:text-white">Privacy Protocol</Link></li>
              <li><Link to="/terms-of-service" className="text-[14px] font-bold text-white/60 hover:text-white">Terms of Ops</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto border-t border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/30">
          <p>© {new Date().getFullYear()} CreatorArmour Systems. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="cursor-pointer hover:text-white">Instagram</span>
            <span className="cursor-pointer hover:text-white">Twitter / X</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
