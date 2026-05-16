import React from 'react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Target, 
  BarChart3, 
  ShieldCheck, 
  Globe, 
  TrendingUp, 
  ArrowRight,
  Database,
  Layers,
  Cpu,
  Users
} from 'lucide-react';

const InvestorPitchPage = () => {
  return (
    <div className="min-h-screen bg-[#020D0A] text-white">
      <SEOHead
        title="Investor Relations | Creator Armour — Building the Creator OS"
        description="Creator Armour is the infrastructure layer for the $250B creator economy. We are building the operating system for creator-brand collaboration at scale."
        keywords={['creator armour investors', 'creator economy startup', 'SaaS for influencers', 'venture capital India', 'D2C infrastructure']}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 text-xs uppercase tracking-widest font-black">
              Series Seed | Investor Relations
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter italic uppercase leading-none">
              Building the <span className="text-emerald-500">Infrastructure</span> <br/> of the Creator Economy
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
              Solving the operational bottleneck of the creator economy. 
              <span className="text-white"> Software infrastructure </span> to manage high-volume D2C creator campaigns at scale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-24 px-6 bg-black/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tight text-emerald-500">The Problem</h2>
            <p className="text-4xl font-black tracking-tight leading-tight">
              Scaling to 1,000 creators is impossible with WhatsApp and Excel.
            </p>
            <div className="space-y-4">
              {[
                '60% time leak in operational coordination',
                'Zero standardization in data or analytics',
                'No centralized payment or shipment tracking',
                'High fraud risk from unverified metrics'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <p className="text-slate-400 font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tight text-emerald-500">The Solution</h2>
            <p className="text-4xl font-black tracking-tight leading-tight">
              An Infrastructure-first SaaS to manage the entire lifecycle.
            </p>
            <div className="space-y-4">
              {[
                'API-audited "Elite Verification" layer',
                'Centralized Shipment & Workflow tracking',
                'Standardized Content Approval pipeline',
                'Creator Reliability & Performance Scoring'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-slate-400 font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The "Why Now" Section */}
      <section className="py-24 px-6 border-y border-slate-900 bg-[#050F0C]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase italic tracking-tight mb-12 text-center text-emerald-500">The "Why Now"</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Market Explosion', desc: 'D2C brands are shifting 60% of their marketing spend to creator-led content.' },
              { title: 'The Manual Wall', desc: 'Brands hitting ₹1Cr+ MRR are breaking under the weight of manual WhatsApp coordination.' },
              { title: 'Metric Fraud', desc: 'Vanity metrics are dead. Brands now demand API-verified performance data.' },
              { title: 'Infrastructure Gap', desc: 'Discovery tools exist, but no one is solving the operational "messy middle."' }
            ].map((item, i) => (
              <div key={i} className="p-6 border-l-2 border-emerald-500/20 bg-slate-900/10 hover:bg-slate-900/20 transition-colors">
                <h3 className="font-black uppercase italic mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Wedge Section */}
      <section className="py-24 px-6 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black uppercase italic tracking-tight text-emerald-500">The Initial Wedge</h2>
            <p className="text-4xl font-black tracking-tight leading-tight">
              Dominating D2C Food & Wellness.
            </p>
            <p className="text-slate-400 leading-relaxed">
              We aren't trying to boil the ocean. Our initial wedge is the high-frequency 
              <strong> micro-creator operations </strong> for India's emerging D2C giants. 
              By solving the specific logistics of product gifting, tracking, and 
              content approval for food brands, we are building the repeatable 
              workflow engine for every other category.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-2xl font-black italic text-emerald-500">Food</p>
              <p className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">Active Batch</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center opacity-50">
              <p className="text-2xl font-black italic text-slate-400">Beauty</p>
              <p className="text-[10px] font-black uppercase text-slate-600 mt-1 tracking-widest">Upcoming</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center opacity-50">
              <p className="text-2xl font-black italic text-slate-400">Pet Care</p>
              <p className="text-[10px] font-black uppercase text-slate-600 mt-1 tracking-widest">Upcoming</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-2xl font-black italic text-emerald-500">Kitchen</p>
              <p className="text-[10px] font-black uppercase text-slate-500 mt-1 tracking-widest">Active Batch</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Market Cap 2030', value: '$3.5B', sub: 'India Creator Economy', icon: Globe },
              { label: 'Brand ROI Boost', value: '3.2x', sub: 'Via Elite Verified Talent', icon: TrendingUp },
              { label: 'Workflow Efficiency', value: '60%', sub: 'Reduction in Ops Time', icon: Zap }
            ].map((metric, i) => (
              <Card key={i} className="bg-slate-900/40 border-slate-800 p-8 text-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <metric.icon className="h-12 w-12 text-emerald-500" />
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{metric.label}</p>
                <p className="text-6xl font-black text-white italic mb-2 tracking-tighter">{metric.value}</p>
                <p className="text-sm font-bold text-slate-400">{metric.sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Tech Stack / Moat */}
      <section className="py-24 px-6 bg-black/60">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black italic uppercase tracking-tight mb-4">Our Technological <span className="text-emerald-500">Moat</span></h2>
          <p className="text-slate-400 max-w-2xl mx-auto">We aren't an agency. We are building the software layer that scales.</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-800 space-y-4">
            <Database className="h-8 w-8 text-emerald-500" />
            <h3 className="text-2xl font-black uppercase tracking-tight italic">Unified Creator Data Lake</h3>
            <p className="text-slate-400 leading-relaxed">
              Standardizing raw API data from Meta, YouTube, and TikTok into a single "Source of Truth" 
              for creator performance, demographics, and conversion history.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-800 space-y-4">
            <Layers className="h-8 w-8 text-emerald-500" />
            <h3 className="text-2xl font-black uppercase tracking-tight italic">The Campaign OS</h3>
            <p className="text-slate-400 leading-relaxed">
              A modular workflow engine that handles everything from contract generation to 
              shipment tracking and content approvals at a scale of 10,000+ creators.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-[40px] bg-gradient-to-b from-emerald-500 to-emerald-600 p-12 md:p-20 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(16,185,129,0.3)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-black italic uppercase tracking-tighter mb-8 leading-none">
              Ready to invest in the <br/> future of Creator Ops?
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Button className="bg-black text-white hover:bg-slate-900 h-16 px-10 rounded-2xl font-black uppercase italic tracking-widest text-lg group">
                Request Access to Deck
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-emerald-950 font-bold uppercase tracking-widest text-xs">
                Restricted to Accredited Investors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <span className="text-xl font-black uppercase italic tracking-tighter">Creator <span className="text-emerald-500">Armour</span></span>
          </div>
          <div className="flex gap-8 text-xs font-black text-slate-500 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-white">Privacy</span>
            <span className="cursor-pointer hover:text-white">Terms</span>
            <span className="cursor-pointer hover:text-white">Investor FAQ</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 Creator Armour. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default InvestorPitchPage;
