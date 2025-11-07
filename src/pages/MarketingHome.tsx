"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Check, Menu, X, Briefcase, Clock, IndianRupee, Star, ArrowRight, MessageSquare, Bot, ShieldCheck, Users, Lock, Award, Zap, AlertTriangle, Phone, Send, UserCheck, FileText, Calculator, Gavel } from 'lucide-react'; // Added FileText, Calculator icons
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Import cn for conditional class merging
import { useParallax } from '@/lib/hooks/useParallax'; // Import the new hook
import LeadCaptureForm from '@/components/LeadCaptureForm'; // Import the new component
import NewsletterSignup from '@/components/NewsletterSignup'; // Import the new component
import CaseStudyCard from '@/components/CaseStudyCard'; // Import the new component

// The Google Forms URL provided by the user (kept for other CTAs)
const GOOGLE_FORMS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdWyn_m5orgxNtxMhM7fginjoFnNDJM8KbbM-dcbCrC8E-ygg/viewform?usp=sharing";
const CALENDLY_URL = 'https://calendly.com/noticebazaar/15-minute-legal-consultation'; // Define the new constant

// --- New Comparison Data ---
const COMPARISON_DATA = [
  { feature: 'Retainer', traditional: '₹50,000+', noticebazaar: '₹0' },
  { feature: 'Response Time', traditional: '2-4 days', noticebazaar: '4 hours' },
  { feature: 'Monthly Cost', traditional: '₹25,000+', noticebazaar: '₹9,999' },
  { feature: 'Case Tracking', traditional: 'Email/Call', noticebazaar: 'Real-time dashboard' },
  { feature: 'Compliance Alerts', traditional: 'Manual', noticebazaar: 'Automated' },
];

// --- Simplified Feature Lists ---
const SIMPLIFIED_FEATURES = {
  Essential: [
    { icon: Clock, text: '2.5 hours legal consultation per month' },
    { icon: FileText, text: '1 contract draft or review per month' },
    { icon: IndianRupee, text: 'Monthly GST filing (standard)' },
    { icon: IndianRupee, text: 'Quarterly TDS filing' },
    { icon: Bot, text: 'Access to AI Assistant (Lexi)' },
  ],
  Growth: [
    { icon: Users, text: 'Dedicated Advocate + CA' },
    { icon: ShieldCheck, text: 'Unlimited compliance tracking' },
    { icon: Gavel, text: '1 legal notice/month included' },
    { icon: FileText, text: 'Contract review (1/month)' },
    { icon: Clock, text: 'Priority support (4-hour response)' },
  ],
  Strategic: [
    { icon: Star, text: 'Up to 25 hours senior counsel' },
    { icon: Zap, text: 'Unlimited formal notices (fair use)' },
    { icon: Briefcase, text: 'Full contract lifecycle management' },
    { icon: Calculator, text: 'Quarterly risk assessment & strategy' },
    { icon: UserCheck, text: 'Payroll management (up to 50 employees)' },
  ],
};

// --- Helper Components ---
const ComparisonTable = () => (
  <div className="card p-6 rounded-xl shadow-2xl border border-white/10 bg-card/80 backdrop-blur-sm mb-12">
    <h3 className="text-2xl font-bold text-white mb-6 text-center">Traditional Lawyer vs. NoticeBazaar</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-3 px-4 text-gray-400 font-semibold">Feature</th>
            <th className="py-3 px-4 text-gray-400 font-semibold text-center">Traditional Lawyer</th>
            <th className="py-3 px-4 text-blue-400 font-semibold text-center">NoticeBazaar</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((row, index) => (
            <tr key={index} className="border-b border-white/5 last:border-b-0">
              <td className="py-3 px-4 font-medium text-white">{row.feature}</td>
              <td className="py-3 px-4 text-gray-400 text-center">{row.traditional}</td>
              <td className="py-3 px-4 text-green-400 font-bold text-center">{row.noticebazaar}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Function to open the Calendly widget (moved outside initializeExternalScripts for direct use)
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

  // Function to open the Google Forms link in a new tab
  const openGoogleForm = () => {
    window.open(GOOGLE_FORMS_URL, '_blank');
  };

  // Update event listeners to use the Google Form link (only for non-pricing CTAs)
  // Note: We are removing listeners for book-cta-2, book-cta-3, book-cta-4, book-btn-mobile 
  // because we will use direct onClick handlers in the JSX for better React practice.
  document.getElementById('book-cta')?.addEventListener('click', openGoogleForm);
  document.getElementById('book-cta-floating')?.addEventListener('click', openGoogleForm);
  
  // The following IDs are now handled via direct onClick in JSX:
  // book-btn, book-cta-2, book-cta-3, book-cta-4, book-btn-mobile
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1020] text-white">
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
          <a href="#services" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Services</a>
          <Link to="/pricing-comparison" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Pricing</Link>
          <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Clients</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Contact</a>
          <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="hover:text-white py-2 border-b border-white/5">Blog</Link>
          
          <div className="pt-6 space-y-4 border-t border-white/10">
            <Link to="/login" className="w-full inline-flex justify-center text-lg border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10">Client Login</Link>
            <button 
              id="book-btn-mobile" 
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
      // Apply 20% discount for yearly
      const yearlyPriceFloat = monthly * 12 * 0.8;
      
      // Round up to the nearest integer
      let yearlyPrice = Math.ceil(yearlyPriceFloat);
      
      // Adjust to end in 99
      if (yearlyPrice % 100 !== 99) {
          // Calculate difference to the next number ending in 99
          yearlyPrice = yearlyPrice + (100 - (yearlyPrice % 100)) - 1;
      }
      
      return `₹${yearlyPrice.toLocaleString('en-IN')}`;
    }
    return `₹${monthly.toLocaleString('en-IN')}`;
  };

  const getPriceSuffix = () => isYearly ? '/yr' : '/mo';

  return (
    <div className="antialiased">
      {/* Styles are embedded in the original HTML, but we need to ensure Tailwind classes are used */}
      <style>{`
        :root{
          --bg:#10142A; /* Deep Navy Blue */
          --card:#171A33; /* Slightly lighter Navy for cards */
          --muted: #9CA3AF;
          --accent-blue:#3B82F6;
          --accent-yellow:#FBBF24;
          --glass: rgba(255,255,255,0.03);
        }
        html,body{font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial; background:var(--bg); color:#E6EEF8; font-size: 16px;} /* Increased base font size */
        .gradient-text{background:linear-gradient(90deg,#3B82F6,#A78BFA); -webkit-background-clip:text; -webkit-text-fill-color:transparent;}
        .cta-primary{background:linear-gradient(90deg,var(--accent-yellow),#F59E0B); color:#0b1020}
        .cta-primary:hover{transform:translateY(-3px) scale(1.02)}
        .cta-secondary{background:linear-gradient(90deg,var(--accent-blue),#2563EB); color:white}
        .card{background:var(--card); border:1px solid rgba(255,255,255,0.03); box-shadow: 0 6px 18px rgba(3,7,18,0.6)}
        .glass{background:var(--glass); border:1px solid rgba(255,255,255,0.02)}
        .hero-bg { background: linear-gradient(120deg, rgba(59,130,246,0.07), rgba(167,139,250,0.04)); backdrop-filter: blur(8px); }
        .cta-bg { background-image: url('/handshake_cta.png'); background-size: cover; background-position: center; position: relative; overflow: hidden; }
        .cta-overlay { position: absolute; inset: 0; background: rgba(23, 26, 51, 0.65); } /* Adjusted opacity to 0.65 */
        .badge {background: rgba(255,255,255,0.04); color: #D1FAE5; padding:6px 10px; border-radius:999px; font-weight:600; display:inline-flex; gap:.5rem; align-items:center}
        /* Ensure all paragraphs and list items are legible */
        p, li { font-size: 1rem; line-height: 1.6; }
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
            <span className="font-bold text-lg">NoticeBazaar</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#services" className="hover:text-white">Services</a>
            <Link to="/pricing-comparison" className="hover:text-white">Pricing</Link>
            <a href="#testimonials" className="hover:text-white">Clients</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <Link to="/blog" className="hover:text-white">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Desktop CTAs */}
            <button 
              id="book-btn" 
              onClick={() => openCalendly(CALENDLY_URL)} 
              className="cta-secondary py-2 px-4 rounded-lg text-sm font-semibold hidden md:inline-block"
            >
              Book Free Call
            </button>
            <a href="https://wa.me/919205376316?text=Hi%20NoticeBazaar,%20I%20need%20help" target="_blank" rel="noopener" className="bg-green-500/95 hover:bg-green-600 px-3 py-2 rounded-lg text-sm font-semibold hidden md:inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              WhatsApp
            </a>
            <Link to="/login" className="text-sm border border-white/10 px-3 py-2 rounded-lg hidden md:inline-block">Client Login</Link>

            {/* Mobile Menu Trigger */}
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} className="md:hidden text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dialog */}
      <MobileMenu />

      {/* HERO */}
      <main className="container mx-auto px-6">
        <section className="grid md:grid-cols-2 gap-8 items-center py-20 hero-bg rounded-xl p-8 relative overflow-hidden" data-aos="fade-up">
          {/* Soft Gradient Background */}
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 10% 10%, #3B82F6, transparent 50%), radial-gradient(circle at 90% 90%, #2563EB, transparent 50%)' }}></div>
          
          <div className="relative z-10">
            {/* Urgency Badge */}
            <div className="badge mb-4 bg-yellow-500/90 text-black border-none font-bold">
              🛑 STOP LOSING MONEY
            </div>
            
            {/* Outcome-focused Headline */}
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mt-2">
              Never Miss a GST Deadline. Recover ₹8.5L+ in Unpaid Invoices.
            </h1>
            
            {/* Subheadline with Price Transparency */}
            <p className="mt-4 text-gray-300 max-w-xl text-lg">
              Get a dedicated Advocate & CA team tracking your compliance, recovering your money, and protecting your business—all from <span className="font-bold text-white">₹2,999/month</span>.
            </p>

            {/* Single Clear CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/free-legal-check" className="cta-primary inline-flex items-center justify-center gap-3 font-bold py-3 px-5 rounded-lg shadow-md text-lg flex-1">
                Get FREE Legal Health Check →
              </Link>
            </div>
            
            {/* Trust Bar / Social Proof */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-white/10 pt-4">
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-xs text-gray-400">SMEs Trust Us</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">₹15Cr+</p>
                <p className="text-xs text-gray-400">Recovered for Clients</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24 Hrs</p>
                <p className="text-xs text-gray-400">Legal Notice Delivery</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-gray-400">Compliance Penalties</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center z-10">
            {/* Using the professional consultation image */}
            <img 
              src="/NOTICERBAZAAR.jpg" 
              alt="Professional Legal Consultation" 
              className="rounded-xl shadow-2xl w-full max-w-md object-cover border border-white/10" 
              loading="lazy" 
              data-aos="zoom-in" 
              style={{ animation: 'fadeIn 2s ease-out' }}
            />
          </div>
        </section>
        
        {/* NEW LEAD MAGNET SECTION */}
        <section className="py-10" data-aos="fade-up">
          <LeadCaptureForm />
        </section>
        
        {/* NEW: Case Study Cards (After Hero/Lead Magnet) */}
        <section className="py-16">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Results That Speak for Themselves</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">We specialize in fast, effective debt recovery and compliance fixes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <CaseStudyCard
              amount="₹12.4 Lakh"
              days={47}
              client="BIG BULL ECO FRIENDLY"
              issue="Unpaid invoice (6 months old)"
              result="Full payment recovered after legal notice and follow-up."
              quote="Worth 100x the cost. Our previous lawyer said it would take 6-8 months."
              author="Rahul Sharma, Co-Founder"
              delay={0}
            />
            <CaseStudyCard
              amount="₹50,000+"
              days={7}
              client="Prakriti EV (Manufacturing)"
              issue="Missed GST filing penalty risk"
              result="Penalty risk eliminated by proactive filing and advisory."
              quote="They caught a GST filing I'd missed. Saved me ₹12,000 in penalties immediately."
              author="Anjali Singh, Operations Head"
              delay={100}
            />
          </div>
        </section>

        {/* New: Client Portal Preview Section */}
        <section className="py-16 bg-card rounded-xl shadow-lg border border-white/5" data-aos="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">See Your Entire Legal Status at a Glance</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">Your real-time dashboard replaces endless emails and phone calls with clear, actionable status updates.</p>
          </div>
          
          {/* Dashboard Image */}
          <div className="flex justify-center px-4">
            <img 
              src="/Noticebazaar.png" 
              alt="NoticeBazaar Client Dashboard Preview" 
              className="rounded-xl shadow-2xl w-full max-w-3xl object-cover border border-white/10" 
              loading="lazy" 
              data-aos="zoom-in" 
            />
          </div>

          {/* Key Feature Highlights (Simulating Hotspots) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center space-y-2 p-4 rounded-lg bg-secondary/50">
              <Clock className="h-8 w-8 text-yellow-400 mx-auto" />
              <h3 className="font-bold text-lg text-white">Upcoming Deadlines</h3>
              <p className="text-sm text-gray-400">Never miss a GST filing or ROC deadline. Get reminders 7 days early.</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-secondary/50">
              <Briefcase className="h-8 w-8 text-blue-400 mx-auto" />
              <h3 className="font-bold text-lg text-white">Active Cases</h3>
              <p className="text-sm text-gray-400">Track your debt recovery or litigation case in real-time. No more 'checking with lawyer.'</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-secondary/50">
              <FileText className="h-8 w-8 text-green-400 mx-auto" />
              <h3 className="font-bold text-lg text-white">Secure Document Vault</h3>
              <p className="text-sm text-gray-400">All contracts, notices, and filings in one searchable, secure place.</p>
            </div>
          </div>
        </section>

        {/* Pricing (Enhanced) */}
        <section id="plans" className="py-16">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Pricing & Plans</h2>
            <p className="text-gray-400 text-lg">Introductory pricing available — pick a plan and start with a low-risk onboarding.</p>
          </div>

          {/* Comparison Table */}
          <ComparisonTable />

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
            {/* Essential */}
            <div className="card p-6 rounded-xl flex flex-col" data-aos="fade-up">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-blue-300">Essential</h3>
                <div className="text-sm text-yellow-400 font-semibold">Intro Offer</div>
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold">{getPrice(2999)}<span className="text-gray-400 text-base">{getPriceSuffix()}</span></div>
                <p className="text-gray-400 mt-2 text-base">Solopreneurs & micro-businesses</p>
              </div>
              <ul className="mt-6 space-y-3 flex-grow">
                {SIMPLIFIED_FEATURES.Essential.map((item, index) => (
                  <li key={index} className="flex items-start text-base text-gray-100">
                    <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-1" />
                    {item.text}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/login?plan=essential" className="w-full inline-flex justify-center cta-secondary py-3 rounded-lg font-semibold text-lg">Get Started</Link>
                <p className="text-xs text-gray-500 mt-2 text-center">No hidden fees. Cancel anytime.</p>
                <Link to="/plan/essential" className="text-blue-400 hover:text-blue-300 font-medium text-sm mt-2 block text-center">[See All Features ↓]</Link>
              </div>
            </div>

            {/* Business Growth (Highlighted) */}
            <div className="card p-6 rounded-xl relative border-2 border-blue-500 flex flex-col shadow-2xl" data-aos="fade-up" data-aos-delay="80">
              <div className="absolute -top-4 right-6 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">⭐ MOST POPULAR</div>
              <h3 className="text-xl font-bold text-blue-300">Business Growth</h3>
              <div className="mt-4">
                <div className="text-4xl font-extrabold">{getPrice(9999)}<span className="text-gray-400 text-base">{getPriceSuffix()}</span></div>
                <p className="text-gray-400 mt-2 text-base">Perfect for: Growing SMEs with active transactions</p>
              </div>
              <ul className="mt-6 space-y-3 text-gray-300 flex-grow">
                {SIMPLIFIED_FEATURES.Growth.map((item, index) => (
                  <li key={index} className="flex items-start text-base text-gray-100">
                    <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-1" />
                    {item.text}
                  </li>
                ))}
              </ul >
              <div className="mt-6">
                <Link to="/login?plan=growth" className="w-full inline-flex justify-center cta-primary py-3 rounded-lg font-semibold text-lg">Start Free Trial →</Link>
                <p className="text-xs text-yellow-400 mt-2 text-center font-semibold">
                  💰 Money-Back Guarantee: If we don't save you at least ₹10,000 in year 1, we'll refund your first month.
                </p>
                <Link to="/plan/growth" className="text-blue-400 hover:text-blue-300 font-medium text-sm mt-2 block text-center">[See All Features ↓]</Link>
              </div>
            </div>

            {/* Strategic */}
            <div className="card p-6 rounded-xl flex flex-col" data-aos="fade-up" data-aos-delay="160">
              <h3 className="text-xl font-bold text-blue-300">Strategic Partner</h3>
              <div className="mt-4">
                <div className="text-4xl font-extrabold">{getPrice(49999)}<span className="text-gray-400 text-base">{getPriceSuffix()}</span></div>
                <p className="text-4xl font-extrabold text-gray-400 mt-2 text-base">Enterprise & large businesses</p>
              </div>
              <ul className="mt-6 space-y-3 text-gray-300 flex-grow">
                {SIMPLIFIED_FEATURES.Strategic.map((item, index) => (
                  <li key={index} className="flex items-start text-base text-gray-100">
                    <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-1" />
                    {item.text}
                  </li>
                ))}
              </ul >
              <div className="mt-6">
                <Link to="/login?plan=strategic" className="w-full inline-flex justify-center cta-secondary py-3 rounded-lg font-semibold text-lg">Get Started</Link>
                <p className="text-xs text-gray-500 mt-2 text-center">Dedicated onboarding included.</p>
                <Link to="/plan/strategic" className="text-blue-400 hover:text-blue-300 font-medium text-sm mt-2 block text-center">[See All Features ↓]</Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing-comparison" className="text-blue-400 hover:text-blue-300 font-medium text-sm">Compare All Plan Features →</Link>
          </div>
        </section>
        
        {/* NEW LEAD MAGNET SECTION */}
        <section className="py-10" data-aos="fade-up">
          <LeadCaptureForm />
        </section>

        {/* Problem / Solution (Features Reframed as Benefits) */}
        <section id="services" className="py-16 relative overflow-hidden">
          {/* Parallax Background Element */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-5 hidden md:block" 
            style={{ 
              backgroundImage: 'url(/how_it_works_diagram.png)', 
              ...benefitsParallaxStyle 
            }} 
          />
          
          <div className="text-center mb-12 relative z-10" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Stop juggling lawyers & accountants</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">Consolidate legal and financial compliance with one monthly subscription — predictable, fast, and reliable.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative z-10">
            {/* 1. Fixed Monthly Pricing */}
            <article className="card p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500" data-aos="fade-up">
              <IndianRupee className="h-8 w-8 text-yellow-400 mb-3" />
              <h3 className="font-semibold text-xl mb-2 text-blue-400">Fixed Monthly Pricing</h3>
              <p className="text-gray-300">Manage your budget with a predictable flat fee for all your legal and compliance needs. Say goodbye to hourly rates.</p>
            </article>
            {/* 2. Data Security & Transparency */}
            <article className="card p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500" data-aos="fade-up" data-aos-delay="80">
              <Briefcase className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="font-semibold text-xl mb-2 text-blue-400">100% Data Security & Case Transparency</h3>
              <p className="text-gray-300">Access all your documents, track requests, and communicate with your legal team in one secure client portal.</p>
            </article>
            {/* 3. Faster Payment Recovery */}
            <article className="card p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500" data-aos="fade-up" data-aos-delay="160">
              <Clock className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="font-semibold text-xl mb-2 text-blue-400">Faster Payment Recovery</h3>
              <p className="text-gray-300">We handle professional follow-ups and legal notices to recover your outstanding payments quickly and efficiently.</p>
            </article>
            {/* 4. Dedicated Account Manager (New) */}
            <article className="card p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500" data-aos="fade-up" data-aos-delay="240">
              <UserCheck className="h-8 w-8 text-purple-400 mb-3" />
              <h3 className="font-semibold text-xl mb-2 text-blue-400">Dedicated Account Manager</h3>
              <p className="text-gray-300">A single point of contact coordinates your legal and CA team, ensuring seamless service and zero confusion.</p>
            </article>
          </div>
        </section>

        {/* New: Stop Waiting. Start Controlling. */}
        <section className="py-16" data-aos="fade-up">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative flex justify-center">
              <img 
                src="/pasted-image-2025-10-29T16-12-40-981Z.png" 
                alt="Mobile App Preview: Team and Cases" 
                className="rounded-xl shadow-2xl w-full max-w-md object-cover border border-white/10" 
                loading="lazy" 
                data-aos="zoom-in" 
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-extrabold leading-tight">Stop Waiting. <span className="gradient-text">Start Controlling.</span></h2>
              <div className="text-gray-300 text-lg"> {/* Changed p to div */}
                Get instant, secure access to dedicated Advocates (Legal) and CAs (Tax/Finance), backed by a real-time tracking dashboard that makes your legal status transparent and actionable.
              </div>
              <ul className="space-y-3">
                <ListItem Icon={Zap}>Direct chat access to your Legal & CA team.</ListItem>
                <ListItem Icon={Briefcase}>Real-time progress tracking for all active cases.</ListItem>
                <ListItem Icon={Clock}>Automated reminders for compliance deadlines (GST, TDS, etc.).</ListItem>
              </ul>
              <div className="mt-6">
                <a 
                  id="book-cta-3" 
                  onClick={() => openCalendly(CALENDLY_URL)} 
                  className="cta-secondary inline-flex items-center justify-center gap-3 font-bold py-3 px-5 rounded-lg shadow-md text-lg cursor-pointer"
                >
                  Book Free Consultation <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* How it works (TIMELINE REFRAME) */}
        <section id="how-it-works" className="py-16 text-center" data-aos="fade-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">From Chaos to Clarity in 48 Hours</h2>
          <p className="text-gray-400 max-w-3xl mx-auto mb-10 text-lg">We deliver immediate value. Here is the exact timeline from your first click to full compliance clarity.</p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* Day 1 */}
            <div className="card p-6 rounded-xl border-l-4 border-yellow-500 shadow-lg">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center"><Clock className="h-6 w-6 mr-2" /> Day 1: The Audit</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">9:00 AM - You: Complete Free Legal Health Check</p>
                    <p className="text-gray-400 text-sm">Takes less than 5 minutes. We get your business snapshot.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">2:00 PM - Us: Dedicated CA Reviews Submission</p>
                    <p className="text-gray-400 text-sm">Our team begins cross-checking your compliance status against mandatory filings.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">6:00 PM - You: Receive Preliminary Findings</p>
                    <p className="text-gray-400 text-sm">We email you the initial risk assessment and compliance score.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Day 2 */}
            <div className="card p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
              <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center"><Briefcase className="h-6 w-6 mr-2" /> Day 2: The Strategy</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">10:00 AM - Us: Complete Legal Health Report Ready</p>
                    <p className="text-gray-400 text-sm">Your full report, including a priority action plan, is finalized.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">11:00 AM - You: Review Report & Book Consultation</p>
                    <p className="text-gray-400 text-sm">Use the link in the report to schedule your free 15-min call.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <div>
                    <p className="font-semibold text-white">2:00 PM - Us: Consultation Call (If Booked)</p>
                    <p className="text-gray-400 text-sm">Discuss your risks and next steps directly with a legal expert.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Week 1 Summary & Testimonial */}
          <div className="card p-6 rounded-xl mt-8 border-2 border-green-500/50 shadow-xl text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center justify-center"><Star className="h-6 w-6 mr-2" /> Week 1: Full Clarity Achieved</h3>
            <p className="text-gray-300 text-lg italic mb-4">
              "By Day 3, they'd already caught a GST filing I'd missed. Saved me ₹12,000 in penalties."
            </p>
            <p className="font-bold text-white">— Rahul M., Manufacturing SME</p>
            <div className="mt-6">
              <a 
                id="book-cta-4" 
                onClick={() => openCalendly(CALENDLY_URL)} 
                className="cta-primary inline-flex items-center justify-center gap-3 font-bold py-3 px-5 rounded-lg shadow-md text-lg cursor-pointer"
              >
                Book Free Consultation <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </div>
          </div>
        </section>

        {/* Client Logos Section (Enhanced) - REMOVED */}
        
        {/* Testimonials (Enhanced) */}
        <section id="testimonials" className="py-16 relative overflow-hidden">
          {/* Parallax Background Element */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-5 hidden md:block" 
            style={{ 
              backgroundImage: 'url(/NOTICERBAZAAR.jpg)', 
              ...testimonialsParallaxStyle 
            }} 
          />
          
          <div className="text-center mb-8 relative z-10" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Trusted by growing businesses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"As a business running since 2013, we needed reliable, modern compliance. NoticeBazaar's platform gave us instant clarity on all our legal filings and deadlines."</p>
              <div className="mt-4 font-bold text-white">Ramesh V.</div>
              <div className="text-sm text-gray-400">Founder, BABA GOLD</div>
            </div>
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up" data-aos-delay="80">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"We recovered a significant outstanding payment of ₹4.5 Lakh in just 21 days after sending the first legal notice through their team. Highly effective."</p>
              <div className="mt-4 font-bold text-white">Amit Kumar</div>
              <div className="text-sm text-gray-400">Owner, Ghaziabad Logistics Pvt. Ltd.</div>
            </div>
            <div className="card p-6 rounded-xl bg-gray-800/50 border-gray-700/50" data-aos="fade-up" data-aos-delay="160">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">"It feels like having an in-house legal and CA team without the massive overhead. The flat fee model is a game-changer for our budget."</p>
              <div className="mt-4 font-bold text-white">Sunita Singh</div>
              <div className="text-sm text-gray-400">Owner, E-commerce Startup</div>
            </div>
          </div>
        </section>
        
        {/* NEW FAQ Section (Addressing Objections) */}
        <section id="faq" className="py-16">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-lg">We answer your toughest questions about switching to a subscription model.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FAQ 1 */}
            <div className="card p-6 rounded-xl border-l-4 border-blue-500" data-aos="fade-up">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Gavel className="h-5 w-5 mr-2 text-blue-400" /> How is this different from hiring a CA and lawyer separately?</h3>
              <p className="text-gray-300 mb-3">
                Most SMEs pay a minimum of **₹60,000-80,000/year** for traditional CA/Lawyer retainers. NoticeBazaar's Growth plan is **₹1,19,988/year**, but you get BOTH dedicated experts, plus a real-time dashboard and guaranteed faster response times.
              </p>
              <p className="text-sm text-yellow-400 font-semibold">
                The biggest difference: We coordinate everything in one place, eliminating silos and confusion.
              </p>
            </div>
            
            {/* FAQ 2 */}
            <div className="card p-6 rounded-xl border-l-4 border-blue-500" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Users className="h-5 w-5 mr-2 text-blue-400" /> What if I already have a CA/lawyer?</h3>
              <p className="text-gray-300 mb-3">
                No problem! Many clients use us alongside their existing team for:
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Urgent matters (we respond faster)</li>
                  <li>Debt recovery (specialized expertise)</li>
                  <li>Compliance tracking (we never forget deadlines)</li>
                  <li>Second opinions (always smart)</li>
                </ul>
              </p>
              <p className="text-sm text-yellow-400 font-semibold">
                Think of us as your "legal insurance" for when your regular team is unavailable or overwhelmed.
              </p>
            </div>
            
            {/* FAQ 3 */}
            <div className="card p-6 rounded-xl border-l-4 border-blue-500" data-aos="fade-up">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Calculator className="h-5 w-5 mr-2 text-blue-400" /> Do you work with my accounting software?</h3>
              <p className="text-gray-300 mb-3">
                Yes! We integrate with all major platforms to ensure seamless data flow for compliance and filing:
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>Tally</li>
                  <li>Zoho Books</li>
                  <li>QuickBooks</li>
                  <li>Excel (if that's what you use!)</li>
                </ul>
              </p>
              <p className="text-sm text-yellow-400 font-semibold">
                During onboarding, we connect to your systems so we can proactively track deadlines.
              </p>
            </div>
            
            {/* FAQ 4 (Micro-Testimonial Callout) */}
            <div className="card p-6 rounded-xl border-l-4 border-blue-500 flex flex-col justify-center" data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-blue-400" /> Micro-Testimonial Callout</h3>
              <p className="text-gray-300 text-lg italic mb-4">
                "Dashboard is incredible. Finally know what's happening with my GST and ROC filings without having to chase anyone."
              </p>
              <p className="font-bold text-white">— Sarah, SaaS CFO</p>
            </div>
          </div>
        </section>

        {/* Contact / CTA */}
        <section id="contact" className="py-20">
          <div className="card p-10 rounded-xl text-center cta-bg" data-aos="fade-up">
            <div className="cta-overlay rounded-xl"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold">Ready to stop chasing payments & legal admin?</h3>
              <p className="text-gray-400 mt-3 text-lg">Book a free consultation and see how NoticeBazaar protects your cashflow and compliance.</p>
              <p className="text-sm text-gray-500 mt-2">Your data is safe. Encrypted and fully compliant with data protection laws.</p>
              <div className="mt-6 flex justify-center gap-4">
                <a 
                  id="book-cta-2" 
                  onClick={() => openCalendly(CALENDLY_URL)} 
                  className="cta-primary px-6 py-3 rounded-lg font-bold text-lg cursor-pointer"
                >
                  Book a Free Consultation
                </a>
                <a href="https://wa.me/919205376316?text=Hi%20NoticeBazaar,%20I%20want%20a%20consultation" className="bg-green-500/95 px-5 py-3 rounded-lg font-semibold text-lg">Chat on WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Enhanced) */}
      <footer className="border-t border-white/5 mt-20 bg-card"> {/* Changed background to bg-card */}
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
                India's first subscription-based legal and CA team, making expert compliance and advisory accessible to SMEs nationwide.
              </p>
              <NewsletterSignup />
            </div>

            {/* Column 3: Services */}
            <div>
              <div className="font-semibold text-white">Services</div>
              <div className="mt-2"><Link to="/pricing-comparison" className="hover:text-white">Pricing</Link></div>
              <div className="mt-1"><a href="#services" className="hover:text-white">Legal Advisory</a></div>
              <div className="mt-1"><a href="#services" className="hover:text-white">Tax & Compliance</a></div>
              <div className="mt-1"><a href="#services" className="hover:text-white">Payment Recovery</a></div>
              <div className="mt-1"><a href="#services" className="hover:text-white">Contracts & Drafting</a></div>
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
                <a href="mailto:support@noticebazaar.com" className="hover:text-white">Email Support</a>
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
      
      {/* Removed AI Paralegal Assistant Preview */}
    </div>
  );
};

export default MarketingHome;