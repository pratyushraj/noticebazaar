"use client";

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  ArrowRight, ShieldCheck, CheckCircle2, MessageCircle, FileText,
  Activity, Play, Star, Sparkles, ChevronRight, XCircle, Check, Instagram, Briefcase
} from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();

  const canonicalUrl = 'https://creatorarmour.com/';
  const seoTitle = 'CreatorArmour - Close Brand Deals Without Instagram DMs';
  const seoDescription = 'Creator Armour gives you a professional collaboration page where brands send structured offers, contracts are generated automatically, and deals are tracked in your dashboard.';
  const seoKeywords = ['creator collab link', 'brand deal management'];

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
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
      />

      {/* Modern Top Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[17px] font-black tracking-tight text-slate-900">
              CreatorArmour
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#marketplace" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Packages</a>
            <a href="#dashboard" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Dashboard</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block px-4 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Log In
            </Link>
            <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-[13px] font-black shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Create Collab Link
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-28 lg:pt-36 pb-24 space-y-32">

        {/* 1. HERO SECTION */}
        <section className="px-6 max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 w-full">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-6 lg:mb-8">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[12px] font-bold text-emerald-700">The new standard for creators</span>
              </div>

              <h1 className="text-[52px] md:text-[68px] lg:text-[76px] font-black tracking-tight leading-[1] mb-6 text-slate-900">
                Close Brand Deals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Without Instagram DMs
                </span>
              </h1>

              <p className="text-[18px] md:text-[20px] text-slate-600 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Creator Armour gives creators a professional collaboration page where brands send structured offers, select packages, and close deals without messy messages.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link to="/signup" className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-full font-black text-[15px] shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  Create Your Collab Link <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 shadow-sm">
                  View Demo Page
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2">
                  <img src="https://i.pravatar.cc/100?img=1" alt="Creator" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  <img src="https://i.pravatar.cc/100?img=5" alt="Creator" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  <img src="https://i.pravatar.cc/100?img=9" alt="Creator" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                </div>
                <p className="text-[13px] font-bold text-slate-600">Trusted by creators to manage brand collaborations.</p>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="flex-1 w-full max-w-[440px] lg:max-w-none relative">
              {/* Creator Photo Floating */}
              <div className="absolute -left-12 top-10 flex flex-col items-center bg-white p-3 rounded-2xl shadow-xl border border-slate-100 z-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="w-20 h-20 rounded-xl overflow-hidden mb-3">
                  <img src="https://i.pravatar.cc/150?img=47" alt="Aanya Kapoor" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <h3 className="text-sm font-black text-slate-900">Aanya Kapoor</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Lifestyle Creator</p>
                  <p className="text-[11px] font-black text-emerald-600 mt-1">42K Followers</p>
                </div>
              </div>

              {/* Phone Mockup */}
              <div className="bg-slate-50 rounded-[44px] shadow-2xl border-[10px] border-slate-200 overflow-hidden w-full max-w-[320px] mx-auto relative z-10">
                {/* Top Bar */}
                <div className="h-6 w-full flex justify-center pt-2 pb-6 bg-white border-b border-slate-100">
                  <div className="w-20 h-5 bg-slate-200 rounded-full" />
                </div>

                <div className="px-5 py-6 bg-white">
                  {/* Typical Rate */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[20px] -mr-10 -mt-10" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 relative z-10">Typical Collab Rate</p>
                    <p className="text-2xl font-black text-slate-900 relative z-10">₹2K–₹4K</p>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mb-3 px-1">Collab Packages</h4>

                  {/* Packages */}
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-2xl p-4">
                      <h5 className="font-black text-sm text-slate-900 mb-1">Reel Deal</h5>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-lg font-black text-slate-900">₹2,499</span>
                        <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black">Select</div>
                      </div>
                    </div>

                    <div className="border-2 border-emerald-500 bg-white rounded-2xl p-4 relative shadow-md shadow-emerald-500/10">
                      <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Most Popular</div>
                      <h5 className="font-black text-sm text-slate-900 mb-1">Engagement Package</h5>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-lg font-black text-emerald-600">₹3,999</span>
                        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-black">Select</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4">
                      <h5 className="font-black text-sm text-slate-900 mb-1">Product Review</h5>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-lg font-black text-slate-900">Barter</span>
                        <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black">Select</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CREATOR SOCIAL PROOF */}
        <section className="px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Top creators running their business on Armour</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', category: 'Fashion Creator', followers: '36K', price: '₹3K', img: 'https://i.pravatar.cc/300?img=5' },
              { name: 'Arjun Patel', category: 'Tech Creator', followers: '51K', price: '₹4K', img: 'https://i.pravatar.cc/300?img=11' },
              { name: 'Neha Verma', category: 'Beauty Creator', followers: '28K', price: '₹2K', img: 'https://i.pravatar.cc/300?img=9' },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                <img src={c.img} alt={c.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" />
                <div>
                  <h3 className="font-black text-slate-900 text-[17px]">{c.name}</h3>
                  <p className="text-[12px] font-bold text-slate-500 mb-1">{c.followers} followers • {c.category}</p>
                  <div className="inline-flex bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-black">
                    Typical deal {c.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. PROBLEM SECTION */}
        <section className="px-6 max-w-[1000px] mx-auto">
          <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-[48px] font-black tracking-tight text-white mb-4">Instagram DM Chaos</h2>
              <p className="text-lg text-slate-400 font-medium">Stop losing deals in the noise.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-16 relative z-10">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xl font-black text-white">Before Creator Armour</h3>
                </div>
                <ul className="space-y-5">
                  {[
                    "Brands send random DMs",
                    "Budgets unclear",
                    "Deliverables confusing",
                    "No deal tracking"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-300 font-medium">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-slate-500" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-black text-white">After Creator Armour</h3>
                </div>
                <ul className="space-y-5">
                  {[
                    "Structured brand offers",
                    "Clear collaboration packages",
                    "Defined deliverables",
                    "Track deals in dashboard"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-4 text-white font-bold">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section id="how-it-works" className="px-6 max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl md:text-[48px] font-black tracking-tight text-slate-900 mb-16">Three steps to professional deals.</h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-100 via-emerald-300 to-emerald-100" />

            {[
              { step: 1, title: 'Create your collab link', desc: 'creatorarmour.com/yourhandle' },
              { step: 2, title: 'Add it to Instagram bio', desc: 'Brands send structured offers' },
              { step: 3, title: 'Accept deals', desc: 'Track collaborations in your dashboard' }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-emerald-100 shadow-xl shadow-emerald-500/10 flex items-center justify-center text-2xl font-black text-emerald-600 mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm font-bold text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. MARKETPLACE PACKAGE PREVIEW */}
        <section id="marketplace" className="px-6 max-w-[1000px] mx-auto">
          <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Your custom marketplace</h2>
              <p className="text-slate-500 font-medium mt-2">Let brands shop your services like a catalog.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col items-center">
                <img src="https://i.pravatar.cc/150?img=12" alt="Rohan Mehta" className="w-20 h-20 rounded-full mb-3 object-cover" />
                <h3 className="text-2xl font-black text-slate-900">Rohan Mehta</h3>
                <p className="text-sm font-bold text-slate-500">Travel Creator • 58K followers</p>
              </div>
              <div className="p-8 grid md:grid-cols-3 gap-6 bg-slate-50/50">

                <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                  <h4 className="font-black text-slate-900 text-lg mb-4">Reel Deal</h4>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> 1 Reel
                    </li>
                  </ul>
                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="text-xl font-black text-slate-900 mb-3">₹2,500</div>
                    <button className="w-full py-2 bg-slate-100 rounded-xl font-black text-sm text-slate-700">Select</button>
                  </div>
                </div>

                <div className="bg-emerald-50/30 border-2 border-emerald-500 p-6 rounded-2xl relative shadow-lg shadow-emerald-500/10 scale-105 z-10 flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-4">Engagement Package</h4>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> 1 Reel
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> 2 Stories
                    </li>
                  </ul>
                  <div className="border-t border-emerald-100 pt-4 mt-auto">
                    <div className="text-xl font-black text-emerald-600 mb-3">₹4,000</div>
                    <button className="w-full py-2 bg-emerald-600 rounded-xl font-black text-sm text-white shadow-md">Select</button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col">
                  <h4 className="font-black text-slate-900 text-lg mb-4">Product Review</h4>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> 1 Unboxing
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" /> 1 Story
                    </li>
                  </ul>
                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="text-xl font-black text-slate-900 mb-3">Barter</div>
                    <button className="w-full py-2 bg-slate-100 rounded-xl font-black text-sm text-slate-700">Select</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 6. CREATOR DASHBOARD SECTION */}
        <section id="dashboard" className="px-6 max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 lg:pr-10 text-center lg:text-left">
              <h2 className="text-3xl md:text-[44px] font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Everything managed in one place.
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-10">
                Track offers, campaigns, and collaborations in one simple dashboard.
              </p>
              <div className="space-y-6 max-w-sm mx-auto lg:mx-0">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-700">Incoming brand offers</span>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-700">Active collaborations</span>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-bold text-slate-700">Completed deals</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-[500px] lg:max-w-none">
              <div className="bg-slate-50 p-6 rounded-[40px] border border-slate-200 shadow-xl">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-lg text-slate-900">Dashboard</h3>
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="font-black text-slate-900 text-sm mb-1">TechBrand Co.</div>
                        <div className="text-xs font-bold text-emerald-600">New Offer Received</div>
                      </div>
                      <div className="text-lg font-black text-slate-900">₹4,000</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="font-black text-slate-900 text-sm mb-1">FitLife Apparel</div>
                        <div className="text-xs font-bold text-blue-600">In Progress</div>
                      </div>
                      <div className="text-lg font-black text-slate-900">₹2,500</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CREATOR EARNINGS PROOF */}
        <section className="px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Real deals closed recently</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', img: 'https://i.pravatar.cc/100?img=5', brand: 'Myntra', package: '1 Reel + 2 Stories', val: '₹4,500' },
              { name: 'Arjun Patel', img: 'https://i.pravatar.cc/100?img=11', brand: 'Boat', package: 'Product Review', val: '₹3,000 + item' },
              { name: 'Neha Verma', img: 'https://i.pravatar.cc/100?img=9', brand: 'Mamaearth', package: '1 Reel', val: '₹2,000' },
            ].map((d, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <img src={d.img} alt={d.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    <span className="font-black text-sm text-slate-900">{d.name}</span>
                  </div>
                  <div className="text-xs font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded">Closed</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Brand</span>
                    <span className="text-xs font-black text-slate-900">{d.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500">Package</span>
                    <span className="text-xs font-black text-slate-900">{d.package}</span>
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-500">Deal Value</span>
                    <span className="text-lg font-black text-emerald-600">{d.val}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. SOCIAL PROOF STATS */}
        <section className="px-6 max-w-[1000px] mx-auto border-y border-slate-200 py-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 text-center">
            <div>
              <div className="text-[48px] md:text-[64px] font-black text-emerald-600 leading-none mb-2">50+</div>
              <div className="text-sm md:text-base font-bold text-slate-600 uppercase tracking-widest">creators using Creator Armour</div>
            </div>
            <div className="hidden md:block w-px h-20 bg-slate-200" />
            <div>
              <div className="text-[48px] md:text-[64px] font-black text-slate-900 leading-none mb-2">100+</div>
              <div className="text-sm md:text-base font-bold text-slate-600 uppercase tracking-widest">collaboration offers sent</div>
            </div>
          </div>
        </section>

        {/* 9. BIG CALL TO ACTION (Dark Premium Section) */}
        <section className="px-6 pb-24">
          <div className="max-w-[1200px] mx-auto bg-[#0a0f12] rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl mx-auto">
              <h2 className="text-[40px] md:text-[64px] font-black tracking-tight leading-[1.05] mb-12 text-white">
                Turn Your Instagram Into a Deal Pipeline
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-black text-[16px] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  Create Your Collab Link <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/10 text-white px-10 py-5 rounded-full font-black text-[16px] transition-all flex items-center justify-center gap-2">
                  View Demo Creator Page
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[18px] font-black tracking-tight text-slate-900">
              CreatorArmour
            </h1>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-900">Product</Link>
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-900">Pricing</Link>
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-slate-900">Help</Link>
            <Link to="/terms-of-service" className="text-sm font-bold text-slate-500 hover:text-slate-900">Terms</Link>
            <Link to="/privacy-policy" className="text-sm font-bold text-slate-500 hover:text-slate-900">Privacy</Link>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto text-center border-t border-slate-100 pt-8">
          <p className="text-xs font-bold text-slate-400">© Creator Armour</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
