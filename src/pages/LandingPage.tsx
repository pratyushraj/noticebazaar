"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  ArrowRight, ShieldCheck, CheckCircle2, MessageCircle, FileText,
  Activity, Search, Play, Star, Sparkles, ChevronRight, BarChart3, Clock, Instagram
} from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();

  const canonicalUrl = 'https://creatorarmour.com/';
  const seoTitle = 'CreatorArmour | Close Brand Deals Without Instagram DMs';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
      />

      {/* Modern Top Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 transition-all">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[18px] font-black tracking-tight text-slate-900">
              CreatorArmour
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#benefits" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Benefits</a>
            <a href="#examples" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Examples</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block px-4 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Log In
            </Link>
            <Link to="/signup" onClick={() => triggerHaptic(HapticPatterns.success)} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-full text-[13px] font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Create Collab Link
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 lg:pt-40 pb-24">

        {/* 1. HERO SECTION */}
        <section className="px-6 min-h-[70vh] flex flex-col items-center justify-center max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 mb-6 lg:mb-8">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[12px] font-bold text-teal-700">The new standard for creator deals</span>
              </div>

              <h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-black tracking-tight leading-[1.05] mb-6 text-slate-900">
                Close Brand Deals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                  Without Instagram DMs
                </span>
              </h1>

              <p className="text-[18px] md:text-[20px] text-slate-600 font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Creator Armour gives you a professional collaboration page where brands send structured offers, contracts are generated automatically, and deals are tracked in your dashboard.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link to="/signup" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-full font-black text-[15px] shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  Create Your Collab Link <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-full font-black text-[15px] transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 text-slate-400" /> View Demo
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-500">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">1</div>
                  <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold">2</div>
                  <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-[10px] font-bold">3</div>
                </div>
                <p className="text-[13px] font-bold">Trusted by 50+ creators to manage brands</p>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="flex-1 w-full max-w-[400px] lg:max-w-none perspective-[1000px]">
              <div className="bg-white rounded-[40px] shadow-2xl border-8 border-slate-100 overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
                {/* Mockup Top Bar */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0 object-cover" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900">mellowprints</h3>
                    <p className="text-sm font-bold text-slate-500">Verified Creator</p>
                  </div>
                </div>
                {/* Mockup Content */}
                <div className="p-6 bg-slate-50/50">
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Most Popular
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 text-xl mb-1">Engagement Package</h4>
                    <p className="text-sm font-bold text-slate-500 mb-4">1 Reel + 2 Stories</p>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-teal-600">₹1499</span>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black">Select →</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                    <h4 className="font-black text-slate-900 text-xl mb-1">Reel Deal</h4>
                    <p className="text-sm font-bold text-slate-500 mb-4">1 Dedicated Reel</p>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-teal-600">₹999</span>
                      <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black">Select →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PRODUCT DEMO SECTION */}
        <section id="how-it-works" className="py-24 px-6 max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">

            <div className="flex-1 w-full max-w-[400px]">
              <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex justify-center items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-black text-slate-500">creatorarmour.com/mellowprints</span>
                </div>
                <div className="p-6">
                  <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4" />
                  <div className="w-3/4 h-6 bg-slate-200 rounded mb-2" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded mb-6" />
                  <div className="w-full h-12 bg-teal-600 rounded-xl mb-3" />
                  <div className="w-full h-12 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-[32px] md:text-[40px] font-black tracking-tight mb-10 text-slate-900">
                How the collab link works.
              </h2>

              <div className="space-y-8">
                {[
                  { num: "1", title: "Share your collab link", desc: "Add creatorarmour.com/yourhandle to your Instagram bio." },
                  { num: "2", title: "Brands send structured offers", desc: "Campaign details, deliverables, and budget upfront." },
                  { num: "3", title: "Accept or counter", desc: "Agree on terms before any work starts." },
                  { num: "4", title: "Track the deal", desc: "Contracts, timelines, and payments in one dashboard." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black shrink-0">
                      {item.num}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-slate-600 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 3. CREATOR BENEFITS */}
        <section id="benefits" className="py-24 px-6 bg-slate-900 text-white my-10 rounded-[3rem] max-w-[1300px] mx-auto">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-[40px] font-black text-center tracking-tight mb-16">Why top creators use Armour</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.15] transition-colors">
                <MessageCircle className="w-10 h-10 text-teal-400 mb-6" />
                <h3 className="text-2xl font-black mb-4">No more messy DMs</h3>
                <p className="text-slate-400 font-medium leading-relaxed">Brands send complete collaboration proposals instead of random Instagram messages.</p>
              </div>

              <div className="bg-white/10 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.15] transition-colors">
                <FileText className="w-10 h-10 text-teal-400 mb-6" />
                <h3 className="text-2xl font-black mb-4">Professional deals</h3>
                <p className="text-slate-400 font-medium leading-relaxed">Auto-generated contracts protect both creators and brands before work starts.</p>
              </div>

              <div className="bg-white/10 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.15] transition-colors">
                <Activity className="w-10 h-10 text-teal-400 mb-6" />
                <h3 className="text-2xl font-black mb-4">Track everything</h3>
                <p className="text-slate-400 font-medium leading-relaxed">Manage offers, timelines, and deliverables from one simple dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 & 5. EXAMPLE CREATOR COLLAB PAGE & BOOKING */}
        <section id="examples" className="py-24 px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[48px] font-black tracking-tight text-slate-900 mb-4">Every creator gets a professional page</h2>
            <p className="text-xl text-slate-500 font-medium">Brands can pick a package or create a custom proposal instantly.</p>
          </div>

          <div className="bg-slate-100 rounded-[40px] p-8 md:p-16 flex flex-col items-center">

            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
              {/* Creator Profile Simulation */}
              <div className="md:w-1/3 bg-slate-50 p-8 border-r border-slate-200 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-200 mb-4" />
                <h3 className="text-2xl font-black text-slate-900 mb-1">Mellow Prints</h3>
                <p className="text-slate-500 font-bold text-sm mb-6">@mellowprints</p>

                <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Creator Performance</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-600">Avg. Reach</span>
                    <span className="font-black text-sm text-slate-900">12K - 15K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-600">Platform</span>
                    <Instagram className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <button className="w-full bg-slate-900 text-white rounded-xl py-3 font-black text-sm">Send Custom Offer</button>
              </div>

              {/* Packages Simulation */}
              <div className="md:w-2/3 p-8 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-3xl p-6 hover:border-teal-500 transition-colors cursor-pointer">
                  <h4 className="text-xl font-black text-slate-900 mb-4">Reel Deal</h4>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="w-4 h-4 text-teal-500" /> 1 Reel</li>
                  </ul>
                  <div className="text-2xl font-black text-slate-900 mb-4">₹999</div>
                  <button className="w-full bg-slate-100 text-slate-900 rounded-xl py-2 font-black text-sm hover:bg-slate-200">Select Package</button>
                </div>

                <div className="border-2 border-teal-500 bg-teal-50/20 rounded-3xl p-6 relative cursor-pointer">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>
                  <h4 className="text-xl font-black text-slate-900 mb-4">Engagement Package</h4>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="w-4 h-4 text-teal-500" /> 1 Reel</li>
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600"><CheckCircle2 className="w-4 h-4 text-teal-500" /> 2 Stories</li>
                  </ul>
                  <div className="text-2xl font-black text-slate-900 mb-4">₹1499</div>
                  <button className="w-full bg-teal-600 text-white rounded-xl py-2 font-black text-sm hover:bg-teal-700">Select Package</button>
                </div>
              </div>
            </div>

            <Link to="/signup" className="mt-10 bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-full font-black text-[15px] shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2">
              Create your collab page <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* 6. SOCIAL PROOF */}
        <section className="py-16 px-6 max-w-[1000px] mx-auto border-y border-slate-200 mb-24">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center">
            <div>
              <div className="text-[48px] font-black text-teal-600">50+</div>
              <div className="text-lg font-bold text-slate-600">creators using Creator Armour</div>
            </div>
            <div className="hidden md:block w-px h-16 bg-slate-200" />
            <div>
              <div className="text-[48px] font-black text-slate-900">100+</div>
              <div className="text-lg font-bold text-slate-600">collaboration offers sent</div>
            </div>
          </div>
        </section>

        {/* 7. HOW IT WORKS (Simple Flow) */}
        <section className="py-24 px-6 max-w-[1200px] mx-auto bg-white rounded-[40px] shadow-sm border border-slate-100">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[40px] font-black tracking-tight text-slate-900">Deal flow, simplified.</h2>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-4xl mx-auto">
            {['Create collab link', 'Share in bio', 'Brands send offers', 'Accept and deliver'].map((step, i) => (
              <React.Fragment key={i}>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center w-full md:w-1/4">
                  <div className="text-sm font-black text-slate-900 uppercase tracking-widest">{step}</div>
                </div>
                {i < 3 && <ChevronRight className="w-8 h-8 text-slate-300 hidden md:block" />}
                {i < 3 && <div className="w-px h-8 bg-slate-200 md:hidden" />}
              </React.Fragment>
            ))}
          </div>
        </section>


        {/* 8. CREATOR DASHBOARD PREVIEW */}
        <section className="py-24 px-6 max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-[32px] md:text-[40px] font-black tracking-tight text-slate-900 mb-6">Take control from your dashboard.</h2>
              <p className="text-xl text-slate-600 font-medium mb-8">
                Track offers, active deals, and completed collaborations in your unified Creator Armour dashboard. No more guessing who owes you what.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500" /><span className="font-bold text-slate-700">Financial tracking</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500" /><span className="font-bold text-slate-700">Contract repository</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-teal-500" /><span className="font-bold text-slate-700">Inbox for new requests</span></li>
              </ul>
            </div>
            <div className="flex-1 w-full bg-slate-100 p-8 rounded-[32px] border border-slate-200">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                  <h3 className="font-black text-slate-900">Active Deals</h3>
                  <span className="bg-teal-100 text-teal-700 font-black text-xs px-2 py-1 rounded">3 Pending</span>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-black text-slate-900 text-sm">TechBrand Co.</div>
                        <div className="font-bold text-slate-500 text-xs">Reel Deal • In Progress</div>
                      </div>
                      <div className="font-black text-teal-600">₹2500</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. BIG CALL TO ACTION */}
        <section className="py-24 px-6">
          <div className="max-w-[1000px] mx-auto bg-slate-900 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-teal-500/10 mix-blend-overlay"></div>
            <div className="relative z-10 w-full">
              <h2 className="text-[40px] md:text-[64px] font-black tracking-tight leading-[1] mb-8 text-white">
                Turn your Instagram into <br className="hidden md:block" /> a deal pipeline
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-white px-10 py-5 rounded-full font-black text-[16px] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                  Create your collab link <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-black text-[16px] transition-all flex items-center justify-center gap-2">
                  View demo creator page
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 10. FOOTER */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
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
