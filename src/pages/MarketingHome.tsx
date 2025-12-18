"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Check, Menu, X, Briefcase, Clock, IndianRupee, Star, ArrowRight, MessageSquare, Bot, ShieldCheck, Users, Lock, Award, Zap, AlertTriangle, Phone, Send, UserCheck, FileText, Calculator, Gavel, Youtube, Instagram, Globe, Facebook, LayoutDashboard } from 'lucide-react'; // Replaced Tiktok with Globe
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Import cn for conditional class merging
import { useParallax } from '@/lib/hooks/useParallax'; // Import the new hook
import LeadCaptureForm from '@/components/LeadCaptureForm'; // Import the new component
import NewsletterSignup from '@/components/NewsletterSignup'; // Import the new component
import CaseStudyCard from '@/components/CaseStudyCard'; // Import the new component
import { CREATOR_PLAN_DETAILS, CreatorPlanName } from '@/data/creatorPlanDetails'; // Import Creator plan details
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock';

// The Google Forms URL provided by the user (kept for other CTAs)
const GOOGLE_FORMS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdWyn_m5orgxNtxMhM7fginjoFnNDJM8KbbM-dcbCrC8E-ygg/viewform?usp=sharing";
const CALENDLY_URL = 'https://calendly.com/creatorarmour/15-minute-legal-consultation'; // Define the new constant

// Function to open the Calendly widget
const openCalendly = (url: string) => {
  if (typeof (window as any).Calendly !== 'undefined') {
    (window as any).Calendly.initPopupWidget({ url });
  } else {
    console.warn("Calendly script not loaded. Cannot open widget.");
    window.open(url, '_blank'); // Fallback to direct link
  }
  return false;
};

const initializeExternalScripts = () => {
  if (typeof (window as any).AOS !== 'undefined') {
    (window as any).AOS.init({ duration: 600, once: true });
  }
};

const MarketingHome = () => {
  const { session, loading, profile } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false); // State for pricing toggle
  const [showFloatingCta, setShowFloatingCta] = useState(false); // State for floating CTA (bottom)
  const [showStickyTopCta, setShowStickyTopCta] = useState(false); // New state for sticky top CTA

  // Apply Parallax Hooks
  const benefitsParallaxStyle = useParallax({ intensity: 0.15 }); // Subtle movement for benefits
  const testimonialsParallaxStyle = useParallax({ intensity: 0.2 }); // Slightly more movement for testimonials

  useEffect(() => {
    initializeExternalScripts();

    // Floating CTA logic
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Bottom Floating CTA (appears after scrolling past hero)
      if (scrollY > 600) {
        setShowFloatingCta(true);
      } else {
        setShowFloatingCta(false);
      }

      // Top Sticky CTA (appears after scrolling past hero)
      if (scrollY > 100) {
        setShowStickyTopCta(true);
      } else {
        setShowStickyTopCta(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when the mobile menu dialog is open (iOS-safe scroll handling)
  useEffect(() => {
    if (isMenuOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      unlockBodyScroll();
    };
  }, [isMenuOpen]);

  if (loading) {
    return (
      <div className="nb-screen-height flex flex-col items-center justify-center bg-[#0b1020] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-3 text-gray-400">Loading...</p>
      </div>
    );
  }

  if (session && profile) {
    return null;
  }

  // Helper component for list items
  const ListItem = ({ children, Icon }: { children: React.ReactNode, Icon: React.ElementType }) => (
    <li className="flex items-start text-base text-gray-100">
      <Icon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-1" />
      {children}
    </li>
  );

  const MobileMenu = () => (
    <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DialogContent className="fixed inset-y-0 right-0 h-full w-3/4 max-w-xs bg-card p-6 flex flex-col border-l border-white/5 rounded-none">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-2xl font-bold text-white">Menu</DialogTitle>
        </DialogHeader>
        <nav className="flex flex-col space-y-4 text-lg text-gray-300 flex-1">
          <a href="#for-creators" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">For Creators</a>
          <Link to="/pricing-comparison" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Pricing</Link>
          <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Clients</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Contact</a>
          <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Blog</Link>
          
          <div className="pt-6 space-y-4 border-t border-white/10">
            <Link to="/login" className="w-full inline-flex justify-center text-lg border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10">Client Login</Link>
            <button 
              onClick={() => openCalendly(CALENDLY_URL)} 
              className="w-full cta-secondary py-2 rounded-lg text-lg font-semibold"
            >
              Book Free Call
            </button>
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  );

  const getPrice = (monthly: number) => {
    if (isYearly) {
      const yearlyPriceFloat = monthly * 12 * 0.8;
      let yearlyPrice = Math.ceil(yearlyPriceFloat);
      if (yearlyPrice % 100 !== 99) {
          yearlyPrice = yearlyPrice + (100 - (yearlyPrice % 100)) - 1;
      }
      return `₹${yearlyPrice.toLocaleString('en-IN')}`;
    }
    return `₹${monthly.toLocaleString('en-IN')}`;
  };

  const getPriceSuffix = () => isYearly ? '/yr' : '/mo';

  return (
    <div className="antialiased">
      <style>{`
        :root{
          --bg:#0B1325; /* Deep Navy Blue */
          --card:#131F3B; /* Slightly lighter Navy for cards */
          --muted: #9CA3AF;
          --accent-blue:#3B82F6;
          --accent-purple:#8B5CF6; /* New Purple Accent */
          --accent-green:#22C55E; /* New Green Accent */
          --accent-yellow:#FACC15; /* New Yellow Accent */
          --accent-red:#EF4444; /* New Red Accent */
          --glass: rgba(255,255,255,0.03);
        }
        html,body{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial; background:var(--bg); color:#E6EEF8; font-size: 16px; line-height: 1.45;} /* Increased base font size and line height */
        .gradient-text{background:linear-gradient(90deg,var(--accent-blue),var(--accent-purple)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;}
        .cta-primary{
          background:linear-gradient(90deg,var(--accent-yellow),#F59E0B);
          color:#0b1020;
          transition: transform 150ms ease-out, opacity 150ms ease-out;
        }
        .cta-primary:hover{transform:translateY(-3px) scale(1.02)}
        .cta-primary:active{
          transform:scale(0.98);
          opacity:0.95;
        }
        .cta-secondary{background:linear-gradient(90deg,var(--accent-blue),#2563EB); color:white}
        .card{background:var(--card); border:1px solid rgba(255,255,255,0.08); box-shadow: 0 6px 18px rgba(3,7,18,0.6); border-radius: 0.75rem;} /* Increased border radius and subtle border */
        .glass{background:var(--glass); border:1px solid rgba(255,255,255,0.02)}
        .hero-bg { background: linear-gradient(120deg, rgba(59,130,246,0.07), rgba(167,139,250,0.04)); backdrop-filter: blur(8px); }
        .cta-bg { background-image: url('/handshake_cta.png'); background-size: cover; background-position: center; position: relative; overflow: hidden; }
        .cta-overlay { position: absolute; inset: 0; background: rgba(23, 26, 51, 0.65); } /* Adjusted opacity to 0.65 */
        .badge {background: rgba(255,255,255,0.04); color: #D1FAE5; padding:6px 10px; border-radius:999px; font-weight:600; display:inline-flex; gap:.5rem; align-items:center}
        /* Ensure all paragraphs and list items are legible */
        p, li { font-size: 1rem; line-height: 1.45; } /* Increased line height */
        @media (max-width: 768px) {
            /* Ensure minimum tap target size */
            .btn, button, a.inline-flex {
                min-height: 44px;
                min-width: 44px;
            }
            /* Larger font for mobile */
            body { font-size: 16px; } /* Never below 16px */
            h1 { font-size: 32px; }
        }
        @media (min-width:1024px){ .container{max-width:1100px} }
        
        /* New style for How It Works section */
        .how-it-works-bg {
          background-image: url('/how_it_works_diagram.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          overflow: hidden;
          border-radius: 0.75rem; /* rounded-xl */
          border: 1px solid rgba(255,255,255,0.05);
          background-color: var(--card);
        }
        .how-it-works-overlay {
          position: absolute;
          inset: 0;
          background: rgba(23, 26, 51, 0.3); /* Reduced opacity to 0.3 */
          border-radius: 0.75rem;
        }
      `}</style>

      {/* Sticky Top CTA Bar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-[60] transition-transform duration-300 ease-out",
        showStickyTopCta ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="bg-yellow-500 text-black py-2 px-4 text-center flex items-center justify-center gap-4">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" /> Free Legal Health Check — Takes &lt; 1 min
          </p>
          <Link to="/free-legal-check" className="bg-black text-yellow-500 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors">
            Get Started
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,0,0,0.45)]">
              CreatorArmour
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#for-creators" className="hover:text-white">For Creators</a>
            <Link to="/pricing-comparison" className="hover:text-white">Pricing</Link>
            <a href="#testimonials" className="hover:text-white">Clients</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <Link to="/blog" className="hover:text-white">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop CTAs */}
            <button 
              onClick={() => openCalendly(CALENDLY_URL)} 
              className="cta-secondary py-2 px-4 rounded-lg text-sm font-semibold hidden md:inline-block"
            >
              Book Free Call
            </button>
            <a href="https://wa.me/919205376316?text=Hi%20CreatorArmour,%20I%20need%20help" target="_blank" rel="noopener" className="bg-green-500/95 hover:bg-green-600 px-3 py-2 rounded-lg text-sm font-semibold hidden md:inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              WhatsApp
            </a>
            <Link to="/login" className="text-sm border border-white/10 px-3 py-2 rounded-lg hidden md:inline-block">Client Login</Link>

            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-white hover:bg-white/10 active:bg-white/15 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dialog */}
      <MobileMenu />

      <main className="container mx-auto px-6">
        {/* SECTION 1 — Creator-Focused Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center py-20 hero-bg rounded-xl p-8 relative overflow-hidden" data-aos="fade-up">
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 10% 10%, #3B82F6, transparent 50%), radial-gradient(circle at 90% 90%, #2563EB, transparent 50%)' }}></div>
          
          <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mt-2">
              Protect Your Brand Deals. Get Paid On Time.
            </h1>
            <p className="mt-4 text-gray-300 max-w-xl text-lg">
              CreatorArmour helps creators handle unpaid brand deals, risky contracts, and legal disputes — using software backed by real legal action.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {/* Primary CTA copy variants for future tests (keep default active):
                 - "Protect My Deals →" (current text + ArrowRight icon)
                 - "Start Free →"
                 - "Secure My Deal →"
                 - "Get Protected →"
              */}
              <Link
                to="/free-legal-check"
                className="cta-primary nb-hero-cta inline-flex items-center justify-center gap-3 font-bold py-3 px-5 rounded-lg text-lg flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020]"
              >
                Protect My Deals
                <ArrowRight className="h-5 w-5 transition-transform duration-150 ease-out group-hover:translate-x-1 group-active:translate-x-0.5" />
              </Link>
              <button
                onClick={() => openCalendly(CALENDLY_URL)}
                className="cta-secondary inline-flex items-center justify-center gap-3 font-bold py-3 px-5 rounded-lg shadow-md text-lg flex-1"
              >
                See How It Works
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center z-10">
            <img
              src="/mobile_team_and_cases.png"
              alt="CreatorArmour creator dashboard on mobile"
              className="rounded-[2.5rem] shadow-[0_40px_120px_rgba(2,6,23,0.55)] w-full max-w-md object-cover border border-white/10 rotate-3 md:rotate-2"
              loading="lazy"
              data-aos="zoom-in"
              style={{ animation: 'fadeIn 1.8s ease-out' }}
            />
          </div>
        </section>
        
        {/* SECTION 2 — Creator Focus */}
        <section className="py-16" data-aos="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything You Need to Stay Protected</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">Monitor deals, recover payments, and take legal action when brands don't pay.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <Link to="/pricing-comparison" id="for-creators" className="card p-8 rounded-xl shadow-lg border border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-bold text-purple-400 mb-4">For Creators & Influencers</h3>
                <ul className="space-y-2 text-gray-300 text-lg">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Brand deal contract review</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Payment recovery</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Copyright protection</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Defamation support</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> UGC contract negotiation</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Tax filing & compliance</li>
                </ul>
              </div>
              <Button className="cta-primary mt-8 py-3 px-6 rounded-lg font-bold text-lg w-full">
                Explore Creator Plans <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* SECTION 3 — Inside the Creator Vault */}
        <section className="py-16 bg-card rounded-xl shadow-lg border border-white/5" data-aos="fade-up">
          <div className="grid md:grid-cols-2 gap-12 items-center p-8">
            <div className="relative flex justify-center">
              <img
                src="/mobile_portal_mockup.png"
                alt="Creator legal vault"
                className="rounded-[2rem] shadow-[0_30px_90px_rgba(2,6,23,0.55)] w-full max-w-md object-cover border border-white/10"
                loading="lazy"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight">What creators manage inside CreatorArmour</h2>
              <p className="text-gray-300 text-lg">
                Monitor deals, recover payments, and take legal action when brands don't pay. Every tool is built for Indian creators.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="card p-4 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-400 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Contract Protection</p>
                    <p className="text-xs text-muted">Scan contracts to identify risky clauses before you sign.</p>
                  </div>
                </div>
                <div className="card p-4 flex items-start gap-3">
                  <IndianRupee className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Payment Recovery</p>
                    <p className="text-xs text-muted">Send legal notices when brands delay or refuse payment.</p>
                  </div>
                </div>
                <div className="card p-4 flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-400 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Legal Assistance</p>
                    <p className="text-xs text-muted">Talk to verified legal advisors when disputes arise.</p>
                  </div>
                </div>
                <div className="card p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Payment Monitoring</p>
                    <p className="text-xs text-muted">Track pending payouts and amounts at risk in real time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Creator Dashboard Preview */}
        <section className="py-16" data-aos="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">See Everything In One Legal Dashboard</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">A dedicated portal to manage your brand deals, payments, and content protection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <img src="/pasted-image-2025-10-30T08-18-24-826Z.png" alt="Contract Scan Preview" className="rounded-xl shadow-lg border border-white/10" loading="lazy" />
            <img src="/pasted-image-2025-10-29T16-49-34-444Z.png" alt="Deal Tracking Preview" className="rounded-xl shadow-lg border border-white/10" loading="lazy" />
            <img src="/Pixel-True-Mockup-(2)-(2).png" alt="Payments Due Preview" className="rounded-xl shadow-lg border border-white/10" loading="lazy" />
            <img src="/iPhone-12-PRO-localhost.png" alt="Copyright Alerts Preview" className="rounded-xl shadow-lg border border-white/10" loading="lazy" />
          </div>
        </section>

        {/* SECTION 5 — Creator Pain Points (Very Human) */}
        <section className="py-16" data-aos="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">The Creator Struggle is Real. We Fix It.</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">From unpaid brand deals to stolen content, we've got your back.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {/* Pain Points */}
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Late Payments</p>
            </div>
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Bad Contracts</p>
            </div>
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Copyright Stolen</p>
            </div>
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Fake Allegations</p>
            </div>
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">Brands Ghosting</p>
            </div>
            <div className="card p-4 rounded-xl bg-destructive/10 border-destructive/30">
              <X className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-semibold text-foreground">No Legal Protection</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <h3 className="text-2xl font-bold text-green-400">CreatorArmour Solutions:</h3>
            <p className="text-gray-300 mt-2 text-lg">We turn your legal headaches into peace of mind.</p>
          </div>
        </section>

        {/* SECTION 6 — Creator Plans Section */}
        <section className="py-16">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Protection Plans for Every Creator</h2>
            <p className="text-gray-400 text-lg">Monitor deals, recover payments, and escalate with legal action when needed.</p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex justify-center mb-8" data-aos="fade-up">
            <div className="relative flex p-1 bg-card rounded-full border border-white/10">
              <button 
                onClick={() => setIsYearly(false)} 
                className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors", !isYearly ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsYearly(true)} 
                className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors", isYearly ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {Object.values(CREATOR_PLAN_DETAILS).map((plan, index) => (
              <div key={plan.name} className={cn("card p-6 rounded-xl flex flex-col", plan.isPopular && 'border-2 border-purple-500 shadow-2xl')} data-aos="fade-up" data-aos-delay={index * 80}>
                {plan.isPopular && <div className="absolute -top-4 right-6 bg-purple-600 px-3 py-1 rounded-full text-xs font-bold">⭐ MOST POPULAR</div>}
                <h3 className="text-xl font-bold text-purple-300">{plan.name}</h3>
                <div className="mt-4">
                  <div className="text-4xl font-extrabold">{getPrice(parseInt(plan.price.replace('₹', '').replace('/mo', '').replace(',', '')))}<span className="text-gray-400 text-base">{getPriceSuffix()}</span></div>
                  <p className="text-gray-400 mt-2 text-base">{plan.tagline}</p>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  {plan.featuresList.map((item, idx) => (
                    <li key={idx} className="flex items-start text-base text-gray-100">
                      <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-1" />
                      {item.text}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link to={plan.link} className={cn("w-full inline-flex justify-center py-3 rounded-lg font-semibold text-lg", plan.isPopular ? 'cta-primary' : 'cta-secondary')}>
                    Get Started
                  </Link>
                  <Link to={`/plan/${plan.name.toLowerCase().replace(' ', '-')}`} className="text-blue-400 hover:text-blue-300 font-medium text-sm mt-2 block text-center">[See All Features ↓]</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">Legal notices included in Pro plans. No hidden fees.</p>
          </div>
        </section>

        {/* SECTION 7 — Creator Social Proof */}
        <section className="py-16" data-aos="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Trusted by Creators Across India</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">Real results from creators who recovered payments and avoided bad contracts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"A brand delayed my ₹4.8 Lakh payment for 3 months. CreatorArmour sent a legal notice and I got paid within 2 weeks. Worth every rupee!"</p>
              <div className="mt-4 font-bold text-white">Riya S.</div>
              <div className="text-sm text-gray-400">Fashion Influencer (150K followers)</div>
            </div>
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up" data-aos-delay="80">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"I almost signed a contract with a terrible exclusivity clause. CreatorArmour flagged it and helped me negotiate better terms. Saved me from a huge mistake."</p>
              <div className="mt-4 font-bold text-white">Aryan K.</div>
              <div className="text-sm text-gray-400">Tech Reviewer (80K subscribers)</div>
            </div>
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up" data-aos-delay="160">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"Recovered ₹2.5 Lakhs in missed payments within the first month. The payment tracking and legal notices actually work."</p>
              <div className="mt-4 font-bold text-white">Pooja M.</div>
              <div className="text-sm text-gray-400">Vlogger (200K subscribers)</div>
            </div>
          </div>
        </section>


        {/* SECTION 10 — WhatsApp Legal Vault (New Highlight) */}
        <section className="py-16 bg-card rounded-xl shadow-lg border border-white/5" data-aos="fade-up">
          <div className="grid md:grid-cols-2 gap-12 items-center p-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight">Your WhatsApp is Now a <span className="gradient-text">Legal Evidence Vault</span></h2>
              <p className="text-gray-300 text-lg">
                Forward any message, image, or document to your dedicated NoticeBazaar WhatsApp number. It's automatically saved, timestamped, and ready as evidence for any dispute.
              </p>
              <ul className="space-y-3">
                <ListItem Icon={Check}>Auto-save all communications.</ListItem>
                <ListItem Icon={Check}>Timestamped for legal validity.</ListItem>
                <ListItem Icon={Check}>Securely stored in your client portal.</ListItem>
                <ListItem Icon={Check}>Accessible by your legal team.</ListItem>
              </ul>
              <div className="mt-6">
                <a href="https://wa.me/919205376316?text=Hi%20NoticeBazaar,%20I%20want%20to%20know%20more%20about%20the%20WhatsApp%20Legal%20Vault" target="_blank" rel="noopener" className="bg-green-500/95 hover:bg-green-600 px-5 py-3 rounded-lg text-lg font-semibold inline-flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Learn More on WhatsApp
                </a>
              </div>
            </div>
            <div className="relative flex justify-center">
              <img 
                src="/iPhone-12-PRO-localhost.png" // Placeholder for WhatsApp vault screenshot
                alt="WhatsApp Legal Vault Preview" 
                className="rounded-xl shadow-2xl w-full max-w-md object-cover border border-white/10" 
                loading="lazy" 
                data-aos="zoom-in" 
              />
            </div>
          </div>
        </section>

        {/* SECTION 11 — Final CTA */}
        <section className="py-20 text-center" data-aos="fade-up">
          <h2 className="text-3xl font-bold mb-6">Don't Let Brands Delay Your Payment</h2>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg mb-8">Start free. Upgrade only if you need legal recovery.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/free-legal-check" className="cta-primary px-8 py-4 rounded-lg font-bold text-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]">
              Protect My Deals Now <ArrowRight className="h-6 w-6 ml-2" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer (Enhanced) */}
      <footer className="border-t border-white/5 mt-20 bg-card">
        <div className="container mx-auto px-6 py-10 text-gray-400 text-sm">
          
          {/* Legal Disclaimer Section */}
          <div className="mb-8 p-4 rounded-lg bg-red-900/10 border border-red-800/30 text-red-300">
            <p className="font-bold mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" /> Legal Disclaimer
            </p>
            <p className="text-xs leading-relaxed">
              NoticeBazaar is a technology platform providing administrative and legal support services. We are not a law firm and do not provide direct legal representation. Legal advice is provided solely by the independent professionals in our network. Use of this platform does not create an attorney-client relationship.
            </p>
          </div>

          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-white/5 pt-8">
            
            {/* Column 1 & 2 (Span 2 on desktop): Company Info & Newsletter */}
            <div className="md:col-span-2 space-y-6">
              <div className="font-bold text-white text-xl">NoticeBazaar</div>
              <p className="text-gray-500 text-sm max-w-xs">
                India's first subscription-based legal and CA team for content creators and influencers. Expert contract review, payment recovery, and tax compliance.
              </p>
              <NewsletterSignup />
            </div>

            {/* Column 3: Services */}
            <div>
              <div className="font-semibold text-white">Services</div>
              <div className="mt-2"><Link to="/pricing-comparison" className="hover:text-white">Pricing</Link></div>
              <div className="mt-1"><a href="#for-creators" className="hover:text-white">Creator Legal</a></div>
              <div className="mt-1"><a href="#for-creators" className="hover:text-white">Tax & Compliance</a></div>
              <div className="mt-1"><a href="#for-creators" className="hover:text-white">Payment Recovery</a></div>
              <div className="mt-1"><a href="#for-creators" className="hover:text-white">Contract Review</a></div>
            </div>

            {/* Column 4: Company */}
            <div>
              <div className="font-semibold text-white">Company</div>
              <div className="mt-2"><a href="#testimonials" className="hover:text-white">Clients & Trust</a></div>
              <div className="mt-1"><Link to="/blog" className="hover:text-white">Blog & Insights</Link></div>
              <div className="mt-1"><Link to="/sitemap" className="hover:text-white">Sitemap</Link></div>
              <div className="mt-1"><Link to="/login" className="hover:text-white">Client Login</Link></div>
            </div>

            {/* Column 5: Legal & Support */}
            <div>
              <div className="font-semibold text-white">Legal & Support</div>
              <div className="mt-2"><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></div>
              <div className="mt-1"><Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link></div>
              <div className="mt-1"><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></div>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <a href="tel:+919205376316" className="hover:text-white">+91 92053 76316</a>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <a href="mailto:support@creatorarmour.com" className="hover:text-white">Email Support</a>
              </div>
            </div>
          </div>

          {/* Security & Compliance Logos (Trust Seals) */}
          <div className="mt-10 text-center border-t border-white/5 pt-6">
            <p className="text-gray-500 mb-4 font-semibold">Security & Compliance:</p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <span className="flex items-center gap-2 text-gray-300">
                <Lock className="h-5 w-5 text-purple-400" /> ISO 27001 Certified
              </span>
              <span className="flex items-center gap-2 text-gray-300">
                <ShieldCheck className="h-5 w-5 text-green-400" /> SSL Secured
              </span>
              <span className="flex items-center gap-2 text-gray-300">
                <Award className="h-5 w-5 text-yellow-400" /> Startup India Recognized
              </span>
              <span className="flex items-center gap-2 text-gray-300">
                <Users className="h-5 w-5 text-blue-400" /> Supabase Security
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-gray-500 text-center border-t border-white/5 pt-4">
            © 2025 NoticeBazaar. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating CTA on Scroll (Bottom) */}
      <div className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 md:hidden",
        showFloatingCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        <Link to="/free-legal-check" className="cta-primary px-6 py-3 rounded-lg font-bold text-lg shadow-2xl flex items-center gap-2">
          Get My Free Audit (No Payment Required) <ArrowRight className="h-5 w-5 ml-2" />
        </Link>
      </div>

      {/* Floating WhatsApp CTA (bottom-right) */}
      <a href="https://wa.me/919205376316?text=Hi%20NoticeBazaar,%20I%20need%20help" target="_blank" rel="noopener" className="fixed bottom-6 right-6 bg-green-500 p-3 rounded-full shadow-xl z-50 flex items-center gap-2 transition-all duration-300 hover:scale-105">
        <MessageSquare className="h-6 w-6 text-white" />
        <span className="text-white font-semibold hidden sm:inline">Chat on WhatsApp Now</span>
      </a>
    </div>
  );
};

export default MarketingHome;