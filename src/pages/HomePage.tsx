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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "Content Protection",
      description: "AI-powered scanning to protect your original content from theft and unauthorized use.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: FileText,
      title: "Contract Review",
      description: "Get your brand deals reviewed by legal experts to ensure fair terms and maximum earnings.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: DollarSign,
      title: "Payment Tracking",
      description: "Never miss a payment. Track all your earnings, pending payments, and financial goals.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageCircle,
      title: "Expert Advisors",
      description: "Chat with legal and financial experts specialized in creator economy and brand partnerships.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { value: "₹50Cr+", label: "Creator Earnings Protected" },
    { value: "2,500+", label: "Contracts Reviewed" },
    { value: "10K+", label: "Content Pieces Secured" },
    { value: "98%", label: "Client Satisfaction" }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Sign Up Free",
      description: "Create your account in under 2 minutes. No credit card required.",
      icon: Users
    },
    {
      step: 2,
      title: "Connect Your Platforms",
      description: "Link your Instagram, YouTube, and other social accounts securely.",
      icon: Link
    },
    {
      step: 3,
      title: "Get Protected",
      description: "Start tracking deals, scanning content, and getting expert advice instantly.",
      icon: Shield
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Fashion Influencer",
      avatar: "PS",
      content: "NoticeBazaar helped me negotiate a 2X better deal and caught someone stealing my content. Worth every rupee!",
      rating: 5,
      followers: "250K"
    },
    {
      name: "Rahul Mehta",
      role: "Tech YouTuber",
      avatar: "RM",
      content: "Finally, someone who understands the creator economy. The contract review saved me from a terrible exclusivity clause.",
      rating: 5,
      followers: "500K"
    },
    {
      name: "Ananya Singh",
      role: "Lifestyle Creator",
      avatar: "AS",
      content: "The payment tracking is a game-changer. I recovered ₹2.5 lakhs in missed payments within the first month!",
      rating: 5,
      followers: "180K"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Up to 5 contracts/month",
        "Basic content scanning",
        "Payment tracking",
        "Email support",
        "Community access"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "₹999",
      period: "/month",
      description: "For serious creators",
      features: [
        "Unlimited contracts",
        "Advanced AI scanning",
        "Priority expert advice",
        "Automated DMCA takedowns",
        "Revenue analytics",
        "24/7 support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Agency",
      price: "Custom",
      period: "",
      description: "For agencies & teams",
      features: [
        "Everything in Pro",
        "Multi-user accounts",
        "White-label reports",
        "Dedicated account manager",
        "API access",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div 
      className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white overflow-hidden"
      style={{
        minHeight: '-webkit-fill-available',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom, 0px) + 120px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        backgroundColor: '#581c87' // Fallback to prevent white gaps
      }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-purple-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                NoticeBazaar
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-purple-200 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-purple-200 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-purple-200 hover:text-white transition-colors">Testimonials</a>
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
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
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
              <a href="#features" className="block py-2 text-purple-200 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="block py-2 text-purple-200 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="block py-2 text-purple-200 hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="block py-2 text-purple-200 hover:text-white transition-colors">Pricing</a>
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
        style={{ opacity, scale }}
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Protect Your Content.
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text">
                  Grow Your Income.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto">
                The all-in-one platform for content creators to manage brand deals, protect intellectual property, and maximize earnings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/signup"
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-all font-semibold">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-purple-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Free for 14 days</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                <div className="text-purple-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Succeed
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
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:transform hover:scale-105"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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
              Get Started in 3 Simple Steps
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
              See what successful creators are saying about NoticeBazaar
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

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Choose the plan that's right for your creator journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                  <p className="text-purple-300 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-purple-300">{plan.period}</span>}
                  </div>
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/10"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Protect Your Content?
            </h2>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust NoticeBazaar to manage their brand deals and protect their intellectual property.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50 flex items-center gap-2"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-all font-semibold"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                NoticeBazaar
              </div>
              <p className="text-purple-300 text-sm">
                Empowering creators to protect their content and grow their income.
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
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
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
              © 2024 NoticeBazaar. All rights reserved.
            </p>
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

