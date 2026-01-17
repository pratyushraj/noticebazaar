"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { 
  Shield, TrendingUp, FileText, MessageCircle, Bot, 
  CheckCircle, Star, Users, Zap, ArrowRight, 
  Menu, X, Loader2, ChevronRight, Play,
  Instagram, Youtube, Twitter, DollarSign,
  Lock, Award, BarChart3, Clock
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
    document.title = 'CreatorArmour — Protect Your Brand Deals | Contracts, Payments & Legal Protection';

    // Update meta description
    updateMetaTag('description', 'Generate professional contracts, track payment risks, and protect your brand deals. Free legal consultations, consumer complaints, and payment recovery for creators. Start free.');

    // Add canonical URL
    updateLinkTag('canonical', 'https://creatorarmour.com/');
    
    // Add robots meta tag
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Update Open Graph tags
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:title', 'CreatorArmour — Protect Your Brand Deals | Contracts, Payments & Legal Protection');
    updateMetaTag('og:description', 'Generate professional contracts, track payment risks, and protect your brand deals. Free legal consultations, consumer complaints, and payment recovery for creators.');
    updateMetaTag('og:image', 'https://creatorarmour.com/og-preview.png');
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:site_name', 'CreatorArmour');
    updateMetaTag('og:locale', 'en_IN');

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'CreatorArmour — Protect Your Brand Deals');
    updateMetaTag('twitter:description', 'Generate professional contracts, track payment risks, and protect your brand deals. Free legal consultations for creators.');
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
          "name": "What is CreatorArmour?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CreatorArmour is a legal protection platform for content creators and influencers. We help you generate professional contracts, track payment risks, file consumer complaints, and get free legal consultations."
          }
        },
        {
          "@type": "Question",
          "name": "How much does CreatorArmour cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer a free plan with basic features, Creator Lite at ₹399/month, Creator Pro at ₹1,499/month, and Agency plans starting at ₹5,000/month. All plans include free legal consultations."
          }
        },
        {
          "@type": "Question",
          "name": "Do you provide legal advice?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CreatorArmour is a software platform that helps you prepare, track, and act on legal matters. We provide contract templates, payment tracking, and connect you with verified lawyers for consultations. We are not a law firm and do not provide legal representation."
          }
        },
        {
          "@type": "Question",
          "name": "Can I file consumer complaints?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Creator Pro includes Lifestyle Shield, which allows unlimited consumer complaints against brands, e-commerce platforms, and service providers. We draft and send legal notices on your behalf."
          }
        },
        {
          "@type": "Question",
          "name": "How do free legal consultations work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Creator Lite includes 1 free 15-minute legal consultation per month, while Creator Pro includes unlimited consultations. You can book sessions with verified lawyers through our Calendly integration to discuss contracts, payments, disputes, and other legal matters."
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
      <div className="nb-screen-height flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  const features = [
    {
      icon: FileText,
      title: "Contract Protection",
      description: "Scan contracts to identify risky clauses before you sign. This platform helps you prepare, track, and act — not represent you legally.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: DollarSign,
      title: "Payment Dispute Support",
      description: "Access tools, documentation, and support for payment disputes when brands delay or refuse payment. This platform helps you prepare, track, and act — not represent you legally.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageCircle,
      title: "Legal Guidance & Tools",
      description: "Access tools and documentation to connect with verified legal advisors when disputes arise. This platform helps you prepare, track, and act — not represent you legally.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Clock,
      title: "Risk Indicators & Alerts",
      description: "Track pending payouts and amounts at risk in real time. This platform helps you prepare, track, and act — not represent you legally.",
      color: "from-purple-500 to-pink-500"
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
      title: "Add Your Deal",
      description: "Upload a contract or enter deal details. Takes 2–3 minutes, no legal knowledge needed.",
      icon: FileText
    },
    {
      step: 2,
      title: "Risk Indicators & Alerts",
      description: "Track payments, deadlines, and potential issues with automated alerts.",
      icon: Clock
    },
    {
      step: 3,
      title: "Enable Legal Action",
      description: "Access tools and documentation to escalate with expert guidance when needed.",
      icon: Shield
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
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white overflow-hidden pb-20 md:pb-0">
      {/* Navigation */}
      <nav 
        className="sticky top-0 z-50 bg-purple-900/80 backdrop-blur-xl border-b border-white/5"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text drop-shadow-[0_0_8px_rgba(0,0,0,0.45)]"
              >
                CreatorArmour
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-purple-200 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-purple-200 hover:text-white transition-colors">How It Works</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-purple-200 hover:text-white transition-colors">Testimonials</button>
              <button onClick={() => scrollToSection('pricing')} className="text-purple-200 hover:text-white transition-colors">Pricing</button>
              <Link to="/login" className="text-purple-200 hover:text-white transition-colors">Login</Link>
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105"
              >
                Get Started Free
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
            className="md:hidden bg-purple-900/95 backdrop-blur-lg border-t border-white/10"
            style={{ 
              paddingTop: 'max(8px, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))'
            }}
          >
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => { scrollToSection('features'); setIsMenuOpen(false); }} className="block py-2 text-purple-200 hover:text-white transition-colors w-full text-left">Features</button>
              <button onClick={() => { scrollToSection('how-it-works'); setIsMenuOpen(false); }} className="block py-2 text-purple-200 hover:text-white transition-colors w-full text-left">How It Works</button>
              <button onClick={() => { scrollToSection('testimonials'); setIsMenuOpen(false); }} className="block py-2 text-purple-200 hover:text-white transition-colors w-full text-left">Testimonials</button>
              <button onClick={() => { scrollToSection('pricing'); setIsMenuOpen(false); }} className="block py-2 text-purple-200 hover:text-white transition-colors w-full text-left">Pricing</button>
              <Link to="/login" className="block py-2 text-purple-200 hover:text-white transition-colors">Login</Link>
              <Link 
                to="/signup" 
                className="block bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 rounded-full font-semibold text-center transition-all"
              >
                Get Started Free
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
                className="flex items-center justify-center gap-4 mb-6 text-sm"
              >
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-purple-200 font-medium">4.9/5 from 500+ creators</span>
                </div>
                <div className="h-4 w-px bg-purple-400/30"></div>
                <span className="text-purple-200 font-medium">₹50Cr+ protected</span>
              </motion.div>

              {/* Improved Headline with Better Hierarchy */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="block mb-2">Protect Your</span>
                <span className="block mb-2">Brand Deals.</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text mb-2">
                  Generate Contracts.
                </span>
                <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
                  Spot Payment & Usage Risks Early.
                </span>
              </h1>
              
              <p className="text-lg md:text-2xl text-white/90 font-medium mb-4 max-w-3xl mx-auto">
                Creator Armour helps creators generate professional contracts, track payment risks, and protect against content misuse — all in one platform.
              </p>
              <p className="text-sm text-purple-400/70 mb-8 max-w-3xl mx-auto">
                For creators and influencers. Not legal advice.
              </p>
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
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl shadow-purple-500/50 flex items-center gap-2 border-2 border-white/20 overflow-hidden min-h-[56px]"
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
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-purple-200 font-medium text-sm">Free for 14 days</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                <Lock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span className="text-purple-200 font-medium text-sm">No credit card</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                <Zap className="w-5 h-5 text-pink-400 flex-shrink-0" />
                <span className="text-purple-200 font-medium text-sm">Cancel anytime</span>
              </div>
            </motion.div>

            {/* Social Proof Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-purple-300">
                <span className="font-semibold text-pink-400">127 creators</span> joined this week
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

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
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-purple-200 text-sm md:text-base">{stat.label}</div>
                <div className="mt-2 h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-xs text-purple-400/70">Based on platform activity and user submissions.</p>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CreatorArmour?</h2>
            <p className="text-lg text-purple-200 max-w-2xl mx-auto">
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
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Legal-Backed Protection</h3>
              <p className="text-purple-200">Real legal notices, not just templates</p>
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
              <p className="text-purple-200">Spot payment issues before they become problems</p>
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
              <p className="text-purple-200">Templates designed to protect you, not brands</p>
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
            <p className="text-lg text-purple-200">
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
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
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
                <p className="text-purple-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How CreatorArmour Protects You
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Join thousands of creators protecting their work and growing their income
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 h-full">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <step.icon className="w-12 h-12 text-purple-400 mb-4 mt-4" />
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-purple-200">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-purple-400" />
                  </div>
                )}
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
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-purple-300">{testimonial.role} • {testimonial.followers} followers</div>
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
              <ul className="space-y-4 text-purple-200">
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
              <ul className="space-y-4 text-purple-200">
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
            <p className="text-lg text-purple-200 max-w-2xl mx-auto">
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
              <ul className="space-y-2 text-purple-200 text-sm mb-6">
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
              <ul className="space-y-2 text-purple-200 text-sm mb-6">
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
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
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
                className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border ${
                  plan.popular ? 'border-purple-400 ring-4 ring-purple-400/20' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-purple-300 text-sm mb-2">{plan.description}</p>
                  {plan.helperText && plan.name === "Creator Lite" && (
                    <p className="text-purple-400 text-xs mb-3">{plan.helperText}</p>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-purple-300">{plan.period}</span>}
                  </div>
                  {plan.helperText && plan.name === "Agency" && (
                    <p className="text-purple-400 text-xs mt-2">{plan.helperText}</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-purple-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
                {plan.helperText && plan.name === "Free" && (
                  <div className="text-center mt-3">
                    <p className="text-purple-400/70 text-xs mb-2">No legal action included</p>
                    <p className="text-purple-300/80 text-xs mb-1">Limited to one contract or scan.</p>
                    <p className="text-purple-300/80 text-xs">Upgrade to monitor active deals and receive alerts.</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-purple-300 text-sm">Legal notices included in Creator Pro. No lawyers to chase. No court visits. No confusion.</p>
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
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Start free. Upgrade only if you need legal recovery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50 flex items-center gap-2"
              >
                Protect My Deals Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-purple-300 mt-4">No lawyers to chase. No court visits.</p>
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
          className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-4 rounded-full font-bold text-center transition-all shadow-2xl shadow-purple-500/50 min-h-[56px] flex items-center justify-center gap-2"
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
              <p className="text-purple-300 text-sm mb-2">
                Empowering creators to protect their content and grow their income.
              </p>
              <p className="text-purple-400 text-xs font-medium">
                CreatorArmour is India's creator protection platform for contracts, payments, and legal recovery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-purple-300">
                © 2024 CreatorArmour. All rights reserved.
              </p>
              <p className="text-xs text-purple-400/70 italic">
                CreatorArmour is a software platform and does not provide legal advice or representation.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-purple-300 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

