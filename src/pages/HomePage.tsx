"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import {
  Shield, TrendingUp, FileText, MessageCircle, Bot,
  CheckCircle, Star, Users, Zap, ArrowRight,
  Menu, X, Loader2, ChevronRight, Play,
  Instagram, Youtube, Twitter, DollarSign,
  Lock, Award, BarChart3, Clock, Link2, Copy, ExternalLink, Eye, Send
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock';

const HomePage = () => {
  const { session, loading, profile, user } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Temporarily disable scroll animations due to React hooks error
  // Using static values to ensure content is visible
  const opacity = 1;
  const scale = 1;

  // TODO: Re-enable when React hooks issue is resolved
  // const { scrollYProgress } = useScroll();
  // const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  // const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Scroll to section handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL hash without triggering navigation
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  // Update Open Graph meta tags for social sharing
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://creatorarmour.com';

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);

      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Update page title
    document.title = 'Creator Armour — Close Brand Deals Without Instagram DMs';

    // Update meta description
    updateMetaTag('description', 'Create your collab link, showcase packages, and receive structured brand offers. Creator Armour helps creators close collaborations professionally.');

    // Add canonical URL
    updateLinkTag('canonical', 'https://creatorarmour.com/');

    // Add robots meta tag
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Update Open Graph tags
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:title', 'Creator Armour — Close Brand Deals Without Instagram DMs');
    updateMetaTag('og:description', 'Create your collab link, showcase packages, and receive structured brand offers with Creator Armour.');
    updateMetaTag('og:image', 'https://creatorarmour.com/og-preview.png');
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:site_name', 'Creator Armour');
    updateMetaTag('og:locale', 'en_IN');

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'Creator Armour — Close Brand Deals Without Instagram DMs');
    updateMetaTag('twitter:description', 'Create your collab link, showcase packages, and close brand deals with structured offers.');
    updateMetaTag('twitter:image', 'https://creatorarmour.com/og-preview.png');
    updateMetaTag('twitter:site', '@creatorarmour');
  }, []);

  // Add FAQ Schema for SEO
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Creator Armour?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Creator Armour is a creator collaboration platform where you publish a collab page, list packages, and receive structured brand offers without messy DM negotiations."
          }
        },
        {
          "@type": "Question",
          "name": "How does Creator Armour pricing work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Creators can start with a free setup and choose paid plans as they scale. Plans are designed for individual creators and teams who want structured collaboration workflows."
          }
        },
        {
          "@type": "Question",
          "name": "Can brands send offers directly through Creator Armour?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Brands can open your collab page, choose package templates, customize campaign requirements, and submit secure collaboration requests in one flow."
          }
        },
        {
          "@type": "Question",
          "name": "What can I show on my collab page?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can show your creator profile, niche, platform presence, package rates, deliverables, and trust signals so brands can book faster with clear expectations."
          }
        },
        {
          "@type": "Question",
          "name": "Is Creator Armour only for Instagram creators?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Creator Armour supports creators across Instagram and other social platforms, helping them present structured offers and manage collaborations professionally."
          }
        }
      ]
    };

    // Remove existing FAQ schema if present
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-faq]');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add FAQ schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq', 'true');
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const schema = document.querySelector('script[type="application/ld+json"][data-faq]');
      if (schema) schema.remove();
    };
  }, []);

  useEffect(() => {
    // Handle hash navigation on mount (for direct links like #testimonials)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (session && profile) {
      // Default to Creator Dashboard for ALL users (including clients)
      // Special case: pratyushraj@outlook.com always gets creator dashboard
      const userEmail = user?.email?.toLowerCase() || session?.user?.email?.toLowerCase();
      const isPratyush = userEmail === 'pratyushraj@outlook.com';

      if (isPratyush) {
        // Always use creator dashboard for pratyushraj@outlook.com
        navigate('/creator-dashboard');
      } else if (profile.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (profile.role === 'chartered_accountant') {
        navigate('/ca-dashboard');
      } else if (profile.role === 'lawyer') {
        navigate('/lawyer-dashboard');
      } else {
        // Default: Creator Dashboard (for 'creator', 'client', null, or any other role)
        navigate('/creator-dashboard');
      }
    }
  }, [session, profile, user, navigate]);

  // Lock body scroll when mobile menu is open (fixes iOS Safari viewport/bottom bar issues)
  useEffect(() => {
    if (isMenuOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      // Ensure scroll is unlocked if the component unmounts while the menu is open
      unlockBodyScroll();
    };
  }, [isMenuOpen]);

  if (loading) {
    return (
      <div className="nb-screen-height flex items-center justify-center bg-[#0B0F14]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const features = [
    {
      icon: FileText,
      title: "Contract Protection",
      description: "Scan contracts for risks. Our platform helps you prepare, track, and act.",
      color: "bg-blue-600 shadow-blue-600/20"
    },
    {
      icon: DollarSign,
      title: "Payment Recovery",
      description: "Access tools and documentation for payment disputes and delays.",
      color: "bg-blue-600 shadow-blue-600/20"
    },
    {
      icon: MessageCircle,
      title: "Legal Workflow",
      description: "Structured legal documentation and advisory access.",
      color: "bg-blue-600 shadow-blue-600/20"
    },
    {
      icon: Clock,
      title: "Risk Monitoring",
      description: "Real-time tracking of pending payouts and deal risks.",
      color: "bg-blue-600 shadow-blue-600/20"
    }
  ];

  const stats = [
    { value: "₹50Cr+", label: "value under protection" },
    { value: "5,000+", label: "deals monitored" },
    { value: "85%", label: "payment recovery rate*" },
    { value: "90%", label: "creators avoid disputes" }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Brand submits request",
      description: "Brand submits request via your link",
      icon: Link2
    },
    {
      step: 2,
      title: "You review & respond",
      description: "You review, accept, or counter",
      icon: FileText
    },
    {
      step: 3,
      title: "Contract auto-generated",
      description: "Contract auto-generated",
      icon: Shield
    },
    {
      step: 4,
      title: "Payments tracked",
      description: "Payments & deadlines tracked",
      icon: DollarSign
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Fashion Influencer",
      avatar: "PS",
      content: "A brand delayed my ₹4.8 Lakh payment for 3 months. CreatorArmour sent a legal notice and I got paid within 2 weeks. Worth every rupee!",
      painLine: "I was unpaid for weeks. The legal notice worked.",
      rating: 5,
      followers: "250K"
    },
    {
      name: "Rahul Mehta",
      role: "Tech YouTuber",
      avatar: "RM",
      content: "I almost signed a contract with a terrible exclusivity clause. CreatorArmour flagged it and helped me negotiate better terms. Saved me from a huge mistake.",
      rating: 5,
      followers: "500K"
    },
    {
      name: "Ananya Singh",
      role: "Lifestyle Creator",
      avatar: "AS",
      content: "Tracked ₹2.5 Lakhs in missed payments within the first month. The payment tracking and documentation tools helped me take action.",
      rating: 5,
      followers: "180K"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "/month",
      description: "For monitoring deals & risks",
      helperText: "No legal action included",
      features: [
        "1 contract generation",
        "1 contract scan",
        "Basic payment monitoring",
        "Invoice creation (basic)",
        "Dashboard access",
        "No ongoing monitoring"
      ],
      cta: "Start Monitoring Deals",
      popular: false
    },
    {
      name: "Creator Lite",
      price: "₹399",
      period: "/month",
      description: "For creators who want structure & clarity",
      helperText: "Best before you face unpaid brands or disputes",
      features: [
        "Unlimited AI contract scans (AI summary only)",
        "Deals dashboard (brands, deadlines, deliverables)",
        "Invoice generator (GST / Non-GST)",
        "Payment tracking & reminders",
        "1 free legal consultation per month",
        "Email / in-app support"
      ],
      cta: "Get Creator Lite",
      popular: false
    },
    {
      name: "Creator Pro",
      price: "₹1,499",
      period: "/month",
      description: "For creators who need payment protection",
      features: [
        "Everything in Creator Lite",
        "1 FREE legal notice every month (₹999 value)",
        "1 human lawyer contract review / month",
        "Unlimited free legal consultations",
        "Payment recovery & escalation support",
        "Tax compliance guidance (GST / TDS)",
        "Lifestyle Shield (unlimited consumer complaints)",
        "Panic Button (priority WhatsApp support)",
        "Verified Creator badge"
      ],
      cta: "Protect My Payments",
      popular: true
    },
    {
      name: "Agency",
      price: "₹5,000",
      period: "/month",
      description: "For managers & creator teams",
      helperText: "Covers up to 10 creators",
      features: [
        "Manage up to 10 creators",
        "5 legal notices per month",
        "Unlimited legal consultations",
        "Bulk deal & payment monitoring",
        "White-label contract risk reports",
        "Client view-only dashboards",
        "Dedicated relationship manager"
      ],
      cta: "Talk to Sales",
      popular: false
    }
  ];

  return (
    <div className="nb-screen-height bg-[#0B0F14] text-white overflow-x-hidden pb-20 md:pb-0 font-inter">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background:radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(30,58,138,0.1),transparent_55%)]" />

      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-xl border-b border-white/5"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl font-black tracking-tighter text-white uppercase"
              >
                Creator<span className="text-blue-600">Armour</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <button onClick={() => scrollToSection('features')} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Testimonials</button>
              <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</Link>
              <Link
                to="/signup"
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Join Armour
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-900"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#0B0F14]/95 backdrop-blur-lg border-t border-white/10"
            style={{
              paddingTop: 'max(8px, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))'
            }}
          >
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => { scrollToSection('features'); setIsMenuOpen(false); }} className="block py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors w-full text-left">Features</button>
              <button onClick={() => { scrollToSection('how-it-works'); setIsMenuOpen(false); }} className="block py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors w-full text-left">How It Works</button>
              <button onClick={() => { scrollToSection('testimonials'); setIsMenuOpen(false); }} className="block py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors w-full text-left">Testimonials</button>
              <Link to="/login" className="block py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</Link>
              <Link
                to="/signup"
                className="block bg-blue-600 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-center transition-all shadow-lg shadow-blue-600/20"
              >
                Join Armour
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{
          opacity,
          scale,
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          paddingTop: 'max(3rem, calc(env(safe-area-inset-top, 0px) + 3rem))',
          paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))',
          minHeight: 'calc(100dvh - 64px)'
        }}
        className="relative pt-12 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden flex items-center"
      >
        {/* Animated background elements */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Social Proof Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-center gap-4 mb-8 text-[11px] font-black uppercase tracking-[0.2em]"
              >
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-slate-400 font-black">4.9/5 RATING</span>
                </div>
                <div className="hidden md:block h-4 w-px bg-slate-800"></div>
                <span className="hidden md:inline text-blue-500 font-black">₹50Cr+ Value Protected</span>
              </motion.div>

              {/* 1️⃣ HERO SECTION - Collab Link First */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.95]">
                <span className="block mb-2 text-white">Your Official</span>
                <span className="block text-blue-600">
                  Business Protocol.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 font-medium mb-6 max-w-3xl mx-auto">
                Replace DMs. Receive structured, protected brand deals.
              </p>

              {/* Primary Card - Collab Link Demo */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="bg-slate-900 shadow-2xl rounded-[2.5rem] p-10 border border-slate-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-black tracking-tighter mb-2">
                        protocol.link/<span className="text-blue-500">yourname</span>
                      </h2>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Official Operating Link
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95">
                        Copy
                      </button>
                      <button className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 border border-white/5 px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95">
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    <button className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm font-medium flex items-center gap-2">
                      WhatsApp
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm font-medium flex items-center gap-2">
                      Email
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 text-sm font-medium flex items-center gap-2">
                      Instagram
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Line - Impossible to miss */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-red-500/20 border-2 border-red-500/40 rounded-lg p-4 flex items-center gap-3 text-red-200 font-bold text-base md:text-lg">
                  <Shield className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <span>Deals outside this link are not legally protected</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Enhanced Primary CTA */}
              <Link
                to="/signup"
                className="group relative bg-gradient-to-r bg-blue-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl shadow-purple-500/50 flex items-center gap-2 border-2 border-white/20 overflow-hidden min-h-[56px]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                <span className="relative z-10">Generate My First Contract</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA */}
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 py-3 rounded-full text-base md:text-lg text-purple-100/80 hover:text-white/90 transition-all font-medium bg-white/10 hover:bg-white/20 border border-white/20 hover:scale-105 min-h-[48px]"
              >
                Scan an Existing Deal
              </Link>
            </motion.div>

            {/* Enhanced Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.1em]">Zero Cost Setup</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <Lock className="w-4 h-4 text-blue-500" />
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.1em]">Bank Grade Encryption</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.1em]">Instant Deployment</span>
              </div>
            </motion.div>

            {/* Social Proof Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-pink-400">127 creators</span> joined this week
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 2️⃣ "How Brands Work With You" Visual Steps */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Brands Work With You
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Use your Collab Link to receive structured, protected brand deals
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-slate-900 shadow-xl rounded-[2.5rem] p-10 border border-slate-800 h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5`}>
                    <step.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3️⃣ Collab Link Performance (Proof) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Collab Link Performance</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              See how your link performs with real-time analytics
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Views this week</span>
                </div>
                <div className="text-3xl font-bold text-white">1,247</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Send className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-500">Requests received</span>
                </div>
                <div className="text-3xl font-bold text-white">23</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Conversion rate</span>
                </div>
                <div className="text-3xl font-bold text-white">1.8%</div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500/70">
              This link actually works. Track performance in real-time when you sign up.
            </p>
          </div>
        </div>
      </section>

      {/* 4️⃣ Collaboration Requests (Primary Feed) - Demo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Incoming Brand Requests
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Brands submit structured requests via your link. Review, accept, or counter — all in one place.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* Demo Request Cards */}
            {[
              {
                brand: "TechBrand Co.",
                budget: "₹50,000",
                deliverables: "3 Instagram Reels + 2 Stories",
                status: "pending"
              },
              {
                brand: "Fashion Label",
                budget: "Barter",
                deliverables: "Product shoot + 5 posts",
                status: "pending"
              }
            ].map((request, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{request.brand}</h3>
                    <div className="space-y-1 text-slate-400">
                      <p className="text-sm"><span className="font-semibold">Budget:</span> {request.budget}</p>
                      <p className="text-sm"><span className="font-semibold">Deliverables:</span> {request.deliverables}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg text-sm font-medium">
                      Accept
                    </button>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-medium">
                      Counter
                    </button>
                    <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm font-medium">
                      Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="text-center pt-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r bg-blue-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white transition-all"
              >
                Get Your Collab Link
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Trusted by Creators Across India</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group cursor-default"
              >
                <div className="text-5xl md:text-6xl font-black mb-3 text-white tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-xs text-slate-400/70">Based on platform activity and user submissions.</p>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CreatorArmour?</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built specifically for creators who want protection without the legal complexity
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Legal-Backed Protection</h3>
              <p className="text-slate-400">Real legal notices, not just templates</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Early Risk Detection</h3>
              <p className="text-slate-400">Spot payment issues before they become problems</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Creator-First Contracts</h3>
              <p className="text-slate-400">Templates designed to protect you, not brands</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-red-500/10 border-y border-red-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-red-200">
              Tired of Unpaid Brand Deals?
            </h2>
            <p className="text-lg text-slate-400">
              Over 60% of creators face payment delays. Don't let brands take advantage of you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Stay Protected
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Professional tools built specifically for content creators and influencers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Creators Everywhere
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See what successful creators are saying about CreatorArmour
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {testimonial.painLine && (
                  <p className="text-purple-100 mb-3 font-bold">"{testimonial.painLine}"</p>
                )}
                <p className="text-purple-100 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r bg-blue-600 flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role} • {testimonial.followers} followers</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Creator Armour Is — And Isn't */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Creator Armour Is — And Isn't
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span>What We Are</span>
              </h3>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Contract automation & risk-tracking software</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Creator-friendly contract templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Documentation & legal action readiness</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <X className="w-6 h-6 text-red-400" />
                <span>What We're Not</span>
              </h3>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Not a law firm</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Not legal advice</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>No payment guarantees</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Not a substitute for independent legal advice</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Protection Features</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to protect your deals and get expert legal guidance
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Consumer Complaints Feature */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/30 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Lifestyle Shield</h3>
                  <p className="text-emerald-200 text-sm">Consumer Complaints</p>
                </div>
              </div>
              <p className="text-purple-100 mb-4">
                File unlimited consumer complaints against brands, e-commerce platforms, and service providers. Get legal notices drafted and sent on your behalf.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited complaints (Creator Pro)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Legal notice drafting & filing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Track resolution status</span>
                </li>
              </ul>
              <Link
                to="/lifestyle/consumer-complaints"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-200 font-medium transition-colors text-sm"
              >
                File a Complaint
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Free Legal Consultation Feature */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Free Legal Consultation</h3>
                  <p className="text-blue-200 text-sm">Expert Advice When You Need It</p>
                </div>
              </div>
              <p className="text-purple-100 mb-4">
                Book unlimited 15-minute consultations with verified lawyers. Get expert advice on contracts, payments, disputes, and legal matters.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Unlimited consultations (Creator Pro)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>1 free consultation/month (Creator Lite)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>15-minute sessions with verified lawyers</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  const calendlyUrl = 'https://calendly.com/creatorarmour/15-minute-legal-consultation';
                  if (typeof (window as any).Calendly !== 'undefined') {
                    (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
                  } else {
                    window.open(calendlyUrl, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-200 font-medium transition-colors text-sm"
              >
                Book Consultation
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Protection Plans for Every Creator
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose the plan that's right for your creator journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border ${plan.popular ? 'border-purple-400 ring-4 ring-purple-400/20' : 'border-white/10'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r bg-blue-600 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-2">{plan.description}</p>
                  {plan.helperText && plan.name === "Creator Lite" && (
                    <p className="text-slate-400 text-xs mb-3">{plan.helperText}</p>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-slate-500">{plan.period}</span>}
                  </div>
                  {plan.helperText && plan.name === "Agency" && (
                    <p className="text-slate-400 text-xs mt-2">{plan.helperText}</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${plan.popular
                    ? 'bg-gradient-to-r bg-blue-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                  {plan.cta}
                </Link>
                {plan.helperText && plan.name === "Free" && (
                  <div className="text-center mt-3">
                    <p className="text-slate-400/70 text-xs mb-2">No legal action included</p>
                    <p className="text-slate-500/80 text-xs mb-1">Limited to one contract or scan.</p>
                    <p className="text-slate-500/80 text-xs">Upgrade to monitor active deals and receive alerts.</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">Legal notices included in Creator Pro. No lawyers to chase. No court visits. No confusion.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))'
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/10"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Don't Let Brands Delay Your Payment
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Start free. Upgrade only if you need legal recovery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="bg-gradient-to-r bg-blue-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50 flex items-center gap-2"
              >
                Protect My Deals Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-4">No lawyers to chase. No court visits.</p>
          </motion.div>
        </div>
      </section>

      {/* Floating CTA for Mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-t from-purple-900 via-purple-900 to-transparent pt-8 pb-4 px-4 border-t border-white/10 backdrop-blur-xl"
        style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}
      >
        <Link
          to="/signup"
          className="block w-full bg-gradient-to-r bg-blue-600 hover:from-purple-700 hover:to-pink-700 px-6 py-4 rounded-full font-bold text-center transition-all shadow-2xl shadow-purple-500/50 min-h-[56px] flex items-center justify-center gap-2"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 pb-20 md:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                CreatorArmour
              </div>
              <p className="text-slate-500 text-sm mb-2">
                Empowering creators to protect their content and grow their income.
              </p>
              <p className="text-slate-400 text-xs font-medium">
                CreatorArmour is India's creator protection platform for contracts, payments, and legal recovery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-500">
                © 2024 CreatorArmour. All rights reserved.
              </p>
              <p className="text-xs text-slate-400/70 italic">
                CreatorArmour is a software platform and does not provide legal advice or representation.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/CreatorArmour"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/creatorarmour"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/creatorarmour"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
