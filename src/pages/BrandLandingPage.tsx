import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Clock, FileText, Handshake, Mail, Menu, Search, Send, ShieldCheck, Sparkles, X, Star, Zap, Globe } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { FeaturedCreators } from '@/components/discovery/FeaturedCreators';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';

const BRAND_CONTACT_EMAIL = 'hello@creatorarmour.com';

const metricCards = [
  {
    title: 'Verified creator supply',
    body: 'Shortlist creators with rates, category fit, response signals, and campaign proof.',
    icon: BriefcaseBusiness,
    color: 'emerald'
  },
  {
    title: 'Brief-to-offer flow',
    body: 'Turn campaign requirements into structured offers creators can accept or counter.',
    icon: Clock,
    color: 'cyan'
  },
  {
    title: 'Contracts and payment safety',
    body: 'Keep approvals, timelines, and payment expectations out of messy DMs.',
    icon: ShieldCheck,
    color: 'blue'
  },
];

const brandFlowCards = [
  {
    eyebrow: 'Discovery',
    title: 'Tell us the campaign',
    description: 'Share the category, budget, timeline, and creator profile you need.',
    accent: 'emerald',
    icon: Handshake,
  },
  {
    eyebrow: 'Creator Matching',
    title: 'Get relevant creator options',
    description: 'Browse verified creators or let us recommend a shortlist for your campaign.',
    accent: 'teal',
    icon: FileText,
  },
  {
    eyebrow: 'Trust Layer',
    title: 'Send protected offers',
    description: 'Move from creator selection to structured offers, approvals, and deal tracking.',
    accent: 'blue',
    icon: BadgeCheck,
  },
];

const BrandLandingPage = () => {
  const navigate = useNavigate();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [briefForm, setBriefForm] = useState({
    brandName: '',
    workEmail: '',
    website: '',
    category: '',
    budget: '',
    timeline: '',
    notes: '',
  });
  const [isSubmittingBrief, setIsSubmittingBrief] = useState(false);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const updateBriefField = (field: keyof typeof briefForm, value: string) => {
    setBriefForm(prev => ({ ...prev, [field]: value }));
  };

  const openBriefEmailFallback = () => {
    const subject = `Brand campaign brief from ${briefForm.brandName.trim()}`;
    const body = [
      `Brand: ${briefForm.brandName}`,
      `Work email: ${briefForm.workEmail}`,
      `Website / Instagram: ${briefForm.website || 'Not shared'}`,
      `Campaign category: ${briefForm.category || 'Not shared'}`,
      `Budget range: ${briefForm.budget || 'Not shared'}`,
      `Timeline: ${briefForm.timeline || 'Not shared'}`,
      '',
      'Creator requirement:',
      briefForm.notes || 'Not shared',
    ].join('\n');

    window.location.href = `mailto:${BRAND_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleBriefSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!briefForm.brandName.trim() || !briefForm.workEmail.trim()) {
      toast.error('Add your brand name and work email.');
      return;
    }

    setIsSubmittingBrief(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/brand-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...briefForm,
          source: 'brands_landing',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not submit brief.');
      }

      toast.success('Brief received. We will follow up with creator options.');
      setBriefForm({
        brandName: '',
        workEmail: '',
        website: '',
        category: '',
        budget: '',
        timeline: '',
        notes: '',
      });
    } catch (error) {
      console.error('[BrandLandingPage] Brand inquiry submit failed:', error);
      toast.error('Could not submit automatically. Opening email instead.');
      openBriefEmailFallback();
    } finally {
      setIsSubmittingBrief(false);
    }
  };

  const scrollToBrief = () => {
    triggerHaptic(HapticPatterns.light);
    document.getElementById('brief')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SEOHead
        title="Find Verified UGC Creators in India | Creator Armour"
        description="Find verified Indian UGC creators, share a campaign brief, compare rates, and send structured brand deals with contracts and payment tracking."
        keywords={['brand collaboration platform', 'influencer marketing ROI', 'data-driven creator campaigns', 'UGC creator discovery', 'hire UGC creators India', 'UGC video production', 'influencer marketing india', 'send offers to creators', 'creator campaign management']}
        canonicalUrl="https://creatorarmour.com/brands"
      />

      <div className="min-h-screen bg-[#05110E] text-white overflow-hidden selection:bg-emerald-500/30">
        {/* Navigation */}
        <header
          className={cn(
            'fixed top-0 inset-x-0 z-50 transition-all duration-500',
            hasScrolled
              ? 'bg-[#071511]/80 border-b border-white/5 backdrop-blur-2xl py-4'
              : 'bg-transparent py-6'
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70 leading-none mb-1">Brand mode</p>
                <h1 className="text-xl font-black tracking-tight leading-none">Creator Armour</h1>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest text-white/50">
              <a href="#creators" className="hover:text-emerald-400 transition-colors">Creators</a>
              <a href="#performance" className="hover:text-emerald-400 transition-colors">Performance</a>
              <a href="#brief" className="hover:text-emerald-400 transition-colors">Brief</a>
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={scrollToBrief}
                className="hidden sm:flex items-center gap-2 h-11 px-5 rounded-2xl bg-white text-[#05110E] font-black text-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                Share Brief
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(v => !v)}
                className="md:hidden w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center transition-colors hover:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-white/5 bg-[#071511]/95 px-6 py-8 space-y-6 overflow-hidden"
              >
                <a href="#creators" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-black text-white/80">Creators</a>
                <a href="#performance" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-black text-white/80">Performance</a>
                <a href="#brief" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-black text-white/80 text-emerald-400">Share brief</a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToBrief();
                  }}
                  className="w-full h-14 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg"
                >
                  Get Creator Matches
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative pt-32 pb-24 md:pt-48 md:pb-40">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
              <div className="absolute -right-[5%] top-[20%] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
              <div className="absolute left-[30%] bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-400/5 blur-[100px]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-20 items-center">
                <motion.div 
                  initial="initial"
                  animate="animate"
                  variants={stagger}
                  className="space-y-10"
                >
                  <motion.div variants={fadeIn} className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">
                    <Search className="w-4 h-4" />
                    For brands hiring creators
                  </motion.div>

                  <motion.div variants={fadeIn} className="space-y-6">
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-balance">
                      Find verified UGC creators.<br />
                      <span className="text-emerald-400">Close safer brand deals.</span>
                    </h1>
                    <p className="max-w-xl text-lg md:text-xl text-white/50 leading-relaxed font-medium">
                      Share your campaign brief, compare creator rates and proof, then send structured offers with contracts, approvals, and payment tracking in one place.
                    </p>
                  </motion.div>

                  <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="button"
                      onClick={scrollToBrief}
                      className="group inline-flex items-center justify-center gap-3 h-16 px-8 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98]"
                    >
                      Get Creator Matches
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/brand-directory');
                      }}
                      className="inline-flex items-center justify-center gap-3 h-16 px-8 rounded-2xl border border-white/10 bg-white/5 font-black text-lg text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                    >
                      Browse Creators
                    </button>
                  </motion.div>

                  <motion.div variants={fadeIn} className="grid sm:grid-cols-3 gap-4">
                    {metricCards.map((card) => (
                      <div key={card.title} className="group rounded-[2rem] border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm transition-all hover:bg-white/[0.05] hover:border-white/10">
                        <card.icon className={cn("w-6 h-6 mb-4", card.color === 'emerald' ? 'text-emerald-400' : card.color === 'cyan' ? 'text-cyan-400' : 'text-blue-400')} />
                        <p className="text-[15px] font-black tracking-tight mb-2">{card.title}</p>
                        <p className="text-[13px] text-white/40 leading-relaxed font-medium">{card.body}</p>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl" />
                  <div id="brief" className="relative rounded-[2.25rem] border border-white/10 bg-[#0A1713]/90 p-6 sm:p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl scroll-mt-28">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400/60 mb-1">Brand brief</p>
                        <h2 className="text-2xl font-black">Tell us what you need</h2>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>

                    <form onSubmit={handleBriefSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input value={briefForm.brandName} onChange={(event) => updateBriefField('brandName', event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Brand name" />
                        <input type="email" value={briefForm.workEmail} onChange={(event) => updateBriefField('workEmail', event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Work email" />
                      </div>
                      <input value={briefForm.website} onChange={(event) => updateBriefField('website', event.target.value)} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Website or Instagram" />
                      <div className="grid sm:grid-cols-3 gap-4">
                        <input value={briefForm.category} onChange={(event) => updateBriefField('category', event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Category" />
                        <input value={briefForm.budget} onChange={(event) => updateBriefField('budget', event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Budget range" />
                        <input value={briefForm.timeline} onChange={(event) => updateBriefField('timeline', event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="Timeline" />
                      </div>
                      <textarea value={briefForm.notes} onChange={(event) => updateBriefField('notes', event.target.value)} className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-emerald-400/60" placeholder="What kind of creators do you need?" />
                      <button type="submit" disabled={isSubmittingBrief} className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-slate-950 font-black transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmittingBrief ? 'Sending Brief...' : 'Share Campaign Brief'}
                        <Send className="h-4 w-4" />
                      </button>
                      <p className="text-center text-xs font-bold leading-relaxed text-white/35">
                        Sends the brief to Creator Armour and notifies our team at creatorarmour07@gmail.com.
                      </p>
                    </form>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Featured Discovery Section */}
          <section id="creators" className="bg-white py-12 rounded-[4rem] mx-4 sm:mx-8 lg:mx-12 overflow-hidden shadow-2xl border border-white/5 scroll-mt-28">
            <FeaturedCreators />
          </section>

          {/* Search Intent Section */}
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-5"
                >
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400">For brand teams</p>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
                    Hire UGC creators in India without losing the deal in DMs.
                  </h2>
                  <p className="text-lg text-white/50 font-medium leading-relaxed">
                    Creator Armour is built for brands that need verified Indian influencers, UGC video creators, and structured collaboration workflows without chasing screenshots, rate cards, and payment details across Instagram or WhatsApp.
                  </p>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    {
                      title: 'Hire UGC creators India',
                      body: 'Find creators for skincare, fashion, food, travel, tech, and lifestyle campaigns. Compare creator rates, content formats, delivery timelines, and proof before sending a brief.',
                    },
                    {
                      title: 'Verified Indian influencers',
                      body: 'Shortlist creators with practical audience signals, profile completeness, availability, and platform proof so brand teams can pick partners with more confidence.',
                    },
                    {
                      title: 'Brand collaboration platform India',
                      body: 'Move from discovery to structured offers, creator approvals, contracts, and payment tracking in a single workflow designed for Indian creator-brand deals.',
                    },
                    {
                      title: 'UGC campaign brief matching',
                      body: 'Share your budget, timeline, target category, and creator requirements. Creator Armour helps turn the brief into creator options and cleaner deal execution.',
                    },
                  ].map((item) => (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="rounded-[2rem] border border-white/5 bg-white/[0.03] p-7"
                    >
                      <h3 className="text-xl font-black tracking-tight text-white">{item.title}</h3>
                      <p className="mt-4 text-sm font-medium leading-6 text-white/45">{item.body}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section id="how-it-works" className="py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center space-y-4 mb-20"
              >
                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400">The Deal Flow</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">From brief to creator shortlist.</h2>
              </motion.div>

              <div className="grid lg:grid-cols-3 gap-8">
                {brandFlowCards.map((card, idx) => (
                  <motion.article
                    key={card.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 }}
                    className={cn(
                      'relative group rounded-[2.5rem] border p-10 transition-all duration-500 hover:scale-[1.02]',
                      idx === 0
                        ? 'border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]'
                        : idx === 1
                          ? 'border-cyan-500/20 bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06]'
                          : 'border-blue-500/20 bg-blue-500/[0.03] hover:bg-blue-500/[0.06]'
                    )}
                  >
                    <div className="absolute top-8 right-10 text-[60px] font-black text-white/[0.03] leading-none select-none">
                      0{idx + 1}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <card.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 mb-2">{card.eyebrow}</p>
                    <h3 className="text-2xl font-black tracking-tight mb-4">{card.title}</h3>
                    <p className="text-white/50 leading-relaxed font-medium">{card.description}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* Performance Section */}
          <section id="performance" className="py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[3.5rem] border border-white/5 bg-white/[0.02] p-8 md:p-16 overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-10">
                  <Globe className="w-64 h-64 text-emerald-400" />
                </div>

                <div className="grid lg:grid-cols-[1fr_0.8fr] gap-16 items-center relative">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 text-emerald-400">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-sm font-black uppercase tracking-widest">Performance Data</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                      Brands need proof,<br />
                      not just profiles.
                    </h3>
                    <p className="text-lg md:text-xl text-white/50 leading-relaxed font-medium max-w-xl text-balance">
                      Our dashboard gives you the data layer: see creator completion rates, average response times, and historic performance before you send a single brief.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="rounded-3xl border border-white/5 bg-[#08110F] p-8 space-y-4 shadow-xl"
                    >
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/30">Average response</p>
                      <p className="text-6xl font-black text-emerald-400 tracking-tighter">3h</p>
                      <p className="text-sm font-medium text-white/40 leading-relaxed">Brands can filter creators by speed to ensure deadline compliance.</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="rounded-3xl border border-white/5 bg-[#08110F] p-8 space-y-4 shadow-xl"
                    >
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/30">Campaign safety</p>
                      <p className="text-6xl font-black text-cyan-400 tracking-tighter">100%</p>
                      <p className="text-sm font-medium text-white/40 leading-relaxed">Every deal is legally secured with auto-generated contracts.</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* CTA Section */}
          <section id="cta" className="py-24 pb-40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative rounded-[3.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-cyan-500/10 p-10 md:p-20 text-center space-y-10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
                
                <div className="space-y-6 relative">
                  <h3 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none text-balance">
                    Need creators for<br />
                    your next campaign?
                  </h3>
                  <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-medium">
                    Send the brief first. We will help you turn it into creator options and structured offers.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                  <button
                    type="button"
                    onClick={scrollToBrief}
                    className="inline-flex items-center justify-center gap-3 h-16 px-10 rounded-2xl bg-white text-slate-950 font-black text-lg transition-all hover:scale-[1.03] active:scale-[0.98] shadow-2xl"
                  >
                    Share Campaign Brief
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/brand-directory')}
                    className="inline-flex items-center justify-center gap-3 h-16 px-10 rounded-2xl border border-white/10 bg-white/5 font-black text-lg text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    Browse Creators
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="py-20 border-t border-white/5 bg-[#030908]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-black tracking-tight">Creator Armour</span>
              </div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                &copy; 2026 Creator Armour. All rights reserved.
              </p>
              <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-white/40">
                <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                <Link to="/terms-of-service" className="hover:text-emerald-400 transition-colors">Terms</Link>
                <a href={`mailto:${BRAND_CONTACT_EMAIL}`} className="hover:text-emerald-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BrandLandingPage;
