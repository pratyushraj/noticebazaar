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
  Instagram, Youtube,
  Clock, TrendingUp, BarChart3,
  Link2
} from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { session, loading, profile } = useSession();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canonicalUrl = 'https://creatorarmour.com/';
  const seoTitle = 'Creator Armour | Secure Collaboration Link for Creators';
  const seoDescription = 'Replace brand DMs with one secure collaboration link. Receive structured offers, auto-generate contracts, and track payments in one creator workflow.';
  const seoKeywords = [
    'creator collaboration link',
    'influencer contract generator',
    'brand deal protection',
    'creator payment tracking',
    'influencer legal tools India',
    'creator armour',
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
    {
      question: 'Can I use Creator Armour for Indian brand deals?',
      answer: 'Yes. The workflow is optimized for Indian creators and brand collaborations, including structured deal documentation and payment follow-up support.',
    },
  ];

  // Safety reset: clear any stale scroll locks left by drawers/modals on previous routes.
  useEffect(() => {
    unlockBodyScroll();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }, []);

  // Redirect logged-in users to dashboard (only after auth is determined)
  useEffect(() => {
    // Only redirect if we're sure user is logged in (not during initial loading)
    if (loading) return; // Wait for auth to resolve

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

  // Prevent flashing content if we're about to redirect or loading session
  // We show the loader if we are in the process of redirecting (session + profile exists)
  if (loading || (session && profile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const painPoints = [
    {
      icon: DollarSign,
      title: "No Payment Protection",
      description: "You deliver the content, then they ghost. 'Payment next week' becomes never. No written proof, no way to recover.",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: FileText,
      title: "No Written Agreement",
      description: "Everything's in DMs. When things go wrong, you have screenshots, not contracts. Brands know this.",
      color: "from-orange-500 to-yellow-500"
    },
    {
      icon: MessageCircle,
      title: "Ghosting After Delivery",
      description: "You post the reel, tag them, send the invoice. Then silence. They got what they wanted. You got nothing.",
      color: "from-yellow-500 to-red-500"
    },
    {
      icon: Clock,
      title: "Endless Back-and-Forth",
      description: "Three days of DMs just to agree on deliverables. Then they change their mind. Then you renegotiate. Again.",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const solutionSteps = [
    {
      step: 1,
      title: "Brands submit requirements",
      description: "You get structured requests with budget, deliverables, and deadlines. No more guessing.",
      icon: Link2
    },
    {
      step: 2,
      title: "You review & decide",
      description: "See everything in one dashboard. Accept, counter, or decline. You're in control.",
      icon: FileText
    },
    {
      step: 3,
      title: "Contract auto-generated",
      description: "Accept a deal and get a professional contract instantly. No legal fees, no delays.",
      icon: Shield
    },
    {
      step: 4,
      title: "Payments tracked automatically",
      description: "Never chase payments again. Get alerts before deadlines. Know exactly what's due.",
      icon: DollarSign
    }
  ];

  const brandFlowSteps = [
    {
      step: 1,
      title: "Brand opens your link",
      description: "They see a professional form, not a DM",
      icon: Link2,
      color: "from-purple-500 to-pink-500"
    },
    {
      step: 2,
      title: "Submits deal details",
      description: "Budget, deliverables, deadline — all structured",
      icon: FileText,
      color: "from-pink-500 to-blue-500"
    },
    {
      step: 3,
      title: "You accept / counter / decline",
      description: "You decide. No pressure, no back-and-forth",
      icon: CheckCircle,
      color: "from-blue-500 to-green-500"
    },
    {
      step: 4,
      title: "Contract generated",
      description: "Professional contract ready instantly. You're protected.",
      icon: Shield,
      color: "from-green-500 to-purple-500"
    },
    {
      step: 5,
      title: "Deal tracked until payment",
      description: "Payment reminders, deadline alerts. Never lose money again.",
      icon: DollarSign,
      color: "from-purple-500 to-indigo-500"
    }
  ];

  const protectionFeatures = [
    {
      icon: FileText,
      title: "Contract Generation",
      description: "Professional contracts created automatically when you accept a deal",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Clock,
      title: "Payment Reminders",
      description: "Never miss a payment. Get alerts before deadlines.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Legal Notice Support",
      description: "Send legal notices instantly if brands delay or refuse payment",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BarChart3,
      title: "Dispute Tracking",
      description: "Track all disputes and payment issues in one dashboard",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const useCases = [
    {
      title: "Instagram Creators",
      description: "Stop managing brand DMs. Get structured collaboration requests.",
      icon: Instagram,
      color: "from-pink-500 to-purple-500"
    },
    {
      title: "YouTubers",
      description: "Professional brand partnerships with contract protection.",
      icon: Youtube,
      color: "from-red-500 to-pink-500"
    },
    {
      title: "Freelancers & UGC Creators",
      description: "Protect your work and get paid on time, every time.",
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Influencers Working with Indian Brands",
      description: "Built for the Indian creator economy. GST-compliant contracts.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Fashion Influencer",
      avatar: "PS",
      content: "I used to lose ₹2-3 Lakhs every month from unpaid brand deals. Creator Armour changed everything. Now every deal is protected.",
      rating: 5,
      followers: "250K"
    },
    {
      name: "Rahul Mehta",
      role: "Tech YouTuber",
      avatar: "RM",
      content: "The collab link is genius. Brands submit everything properly, contracts are auto-generated, and I never worry about payment delays.",
      rating: 5,
      followers: "500K"
    },
    {
      name: "Ananya Singh",
      role: "Lifestyle Creator",
      avatar: "AS",
      content: "No more endless DMs. One link, structured requests, protected deals. This is how brand collaborations should work.",
      rating: 5,
      followers: "180K"
    }
  ];

  const stats = [
    { value: "₹50Cr+", label: "value under protection" },
    { value: "5,000+", label: "creators using Creator Armour" },
    { value: "85%", label: "payment recovery rate*" },
    { value: "90%", label: "creators avoid disputes" }
  ];

  return (
    <div className="min-h-screen bg-[#090B14] text-white overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-60 [background:radial-gradient(ellipse_at_top,rgba(88,28,135,0.32),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(14,116,144,0.22),transparent_55%)]" />
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        image="https://creatorarmour.com/og-preview.png"
        imageAlt="Creator Armour secure collaboration link workflow for creators and brands"
      />
      <FAQSchema faqs={faqItems} />
      <BreadcrumbSchema items={[{ name: 'Creator Armour', url: canonicalUrl }]} />
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 bg-[#090B14]/80 backdrop-blur-xl border-b border-white/10"
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
              <a href="#problem" className="text-purple-200 hover:text-white transition-colors">Why DMs Suck</a>
              <a href="#solution" className="text-purple-200 hover:text-white transition-colors">The Solution</a>
              <a href="#protection" className="text-purple-200 hover:text-white transition-colors">Protection</a>
              <a href="#pricing" className="text-purple-200 hover:text-white transition-colors">Pricing</a>
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
              className="md:hidden p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px] min-w-[44px]"
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
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#problem" onClick={() => setIsMenuOpen(false)} className="block py-2 text-purple-200 hover:text-white transition-colors">Why DMs Suck</a>
              <a href="#solution" onClick={() => setIsMenuOpen(false)} className="block py-2 text-purple-200 hover:text-white transition-colors">The Solution</a>
              <a href="#protection" onClick={() => setIsMenuOpen(false)} className="block py-2 text-purple-200 hover:text-white transition-colors">Protection</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block py-2 text-purple-200 hover:text-white transition-colors">Pricing</a>
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

      {/* 1️⃣ HERO SECTION */}
      <section
        className="relative pt-12 md:pt-28 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          paddingTop: 'max(3rem, calc(env(safe-area-inset-top, 0px) + 3rem))',
          paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))',
          minHeight: 'calc(100dvh - 64px)'
        }}
      >
        {/* Ambient background elements */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
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
                <div className="hidden md:block h-4 w-px bg-purple-400/30"></div>
                <span className="hidden md:inline text-purple-200 font-medium">₹50Cr+ protected</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 leading-tight">
                <span className="block mb-2">Stop Negotiating in DMs.</span>
                <span className="block mb-2">Run Every Brand Deal Through</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text">
                  One Structured Link
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-2xl text-white/85 font-medium mb-4 max-w-3xl mx-auto">
                Creator Armour turns inbound collabs into a clean workflow: offer details, contract setup, and payment visibility in one place.
              </p>
              {/* Emotional sub-line */}
              <p className="text-base md:text-lg text-slate-300 mb-2 max-w-3xl mx-auto font-medium">
                Less chaos, fewer payment surprises, better deal quality.
              </p>
              <p className="text-sm text-slate-400 mb-8 max-w-3xl mx-auto">
                Built for creators who want structure without slowing down.
              </p>
            </motion.div>

            {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
              >
                <Link
                  to="/signup"
                  className="group relative bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 active:scale-95 shadow-2xl shadow-violet-900/50 flex items-center gap-2 border border-white/20 overflow-hidden min-h-[56px]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                  <span className="relative z-10">Get My Collab Link</span>
                  <ArrowRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

              <button
                onClick={() => {
                  const element = document.getElementById('solution');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-full text-base md:text-lg text-slate-200 hover:text-white transition-all font-medium bg-white/5 hover:bg-white/10 border border-white/20 min-h-[48px]"
              >
                View Demo
              </button>
            </motion.div>
            <button
              onClick={() => {
                const element = document.getElementById('solution');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="sm:hidden text-sm text-purple-200/80 hover:text-white/90 underline underline-offset-4"
            >
              View demo
            </button>

            {/* Micro-trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden md:flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-12 text-sm text-purple-200/60"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No card required</span>
              </div>
              <div className="hidden md:block h-1 w-1 rounded-full bg-purple-500/30"></div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Takes 60 seconds</span>
              </div>
              <div className="hidden md:block h-1 w-1 rounded-full bg-purple-500/30"></div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-400" />
                <span>Free forever plan</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2️⃣ THE PROBLEM (WHY DMs SUCK) */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Where DM-Based Deals Break
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Common failure points in creator-brand workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((pain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all ${index > 1 ? 'hidden md:block' : ''}`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${pain.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <pain.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{pain.title}</h3>
                <p className="text-purple-200">{pain.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section: DMs vs Creator Armour */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">
              DMs vs Creator Armour
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Same collaboration. Different operating model.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Instagram / WhatsApp DMs */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                  Instagram / WhatsApp DMs
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">No written contract</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Payment promises, not guarantees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Endless back-and-forth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">No payment tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Easy to ghost after delivery</span>
                  </li>
                </ul>
              </div>

              {/* Right: Creator Armour */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Creator Armour
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Auto-generated contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Structured deal submissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">One-click accept/counter/decline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Payment tracking & reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-purple-200">Legal protection built-in</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ THE SOLUTION (COLLAB LINK) */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              One Link. Structured Workflow.
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              How Creator Armour replaces ad-hoc chats with predictable deal flow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutionSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${index > 1 ? 'hidden md:block' : ''}`}
              >
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 h-full">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <step.icon className="w-12 h-12 text-purple-400 mb-4 mt-4" />
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-purple-200">{step.description}</p>
                </div>
                {index < solutionSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-purple-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4️⃣ HOW BRANDS WORK WITH YOU */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              How Brands Work With You
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Simple, structured, protected. No more chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {brandFlowSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative text-center ${index > 2 ? 'hidden md:block' : ''}`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                {step.description && (
                  <p className="text-sm text-purple-200 mt-1">{step.description}</p>
                )}
                {index < brandFlowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-transparent transform translate-x-2">
                    <ChevronRight className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5️⃣ PROTECTION & TRUST */}
      <section id="protection" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Every Collaboration Is Protected
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Empowering protection, not threatening legal jargon
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {protectionFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all ${index > 1 ? 'hidden md:block' : ''}`}
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

      {/* 6️⃣ REAL USE CASES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Who Is Creator Armour For?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built for creators who want structure and protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all ${index > 1 ? 'hidden md:block' : ''}`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${useCase.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <useCase.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-purple-200">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7️⃣ SOCIAL PROOF */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Creators Are Already Switching
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of creators protecting their brand deals
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  {stat.value}
                </div>
                <div className="text-purple-200 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 ${index > 0 ? 'hidden md:block' : ''}`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
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

      {/* 8️⃣ PRICING PREVIEW */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Simple Pricing
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Start free. Upgrade when you need protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-purple-300 text-sm mb-1">Collab link only</p>
              <p className="text-purple-200/70 text-xs mb-4">Perfect to replace DMs instantly</p>
              <div className="text-4xl font-bold mb-6">₹0<span className="text-lg text-purple-300">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Your collab link</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Brand request forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Basic dashboard</span>
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center py-3 rounded-full font-semibold transition-all bg-white/10 hover:bg-white/20"
              >
                Start Free
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border-2 border-violet-400 ring-4 ring-violet-400/20 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Creator Pro</h3>
              <p className="text-purple-300 text-sm mb-1">Contracts + protection</p>
              <p className="text-purple-200/70 text-xs mb-4">For creators doing regular paid collaborations</p>
              <div className="text-4xl font-bold mb-6">₹1,499<span className="text-lg text-purple-300">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Auto-generated contracts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Payment tracking & reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Legal notice support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-purple-200">Unlimited consultations</span>
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center py-3 rounded-full font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Start Free
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 9️⃣ FINAL CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-violet-600/15 to-cyan-600/15 backdrop-blur-md rounded-3xl p-12 border border-white/10"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Your Next Brand Deal<br />
              Deserves Protection
            </h2>
            <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
              Get your collab link in 2 minutes. No credit card required.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50"
            >
              Create My Collab Link
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-purple-300 mt-4">Used by creators across India • No brand approval needed</p>
            <p className="text-xs text-purple-400/70 mt-2">Free forever. Upgrade only if you need protection.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                CreatorArmour
              </div>
              <p className="text-purple-300 text-sm">
                Empowering creators to protect their content and grow their income.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><a href="#solution" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#protection" className="hover:text-white transition-colors">Protection</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
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
            <p className="text-sm text-purple-300">
              © 2026 CreatorArmour. All rights reserved.
            </p>
            <p className="text-xs text-purple-400/70 italic">
              CreatorArmour is a software platform and does not provide legal advice or representation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
