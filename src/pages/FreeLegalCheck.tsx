"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowDown, ShieldCheck, Users, Gavel, Zap, Clock, IndianRupee, Star, ArrowRight, FileText, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import LegalCheckForm from '@/components/forms/LegalCheckForm';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/analytics';

// Helper function to update document metadata
const updateMetadata = (title: string, description: string) => {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  // Update OG tags dynamically (best effort without a dedicated library)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://creatorarmour.com/free-legal-check');
  document.querySelector('meta[property="og:image"]')?.setAttribute('content', 'https://creatorarmour.com/legal-check-banner.png'); // Updated image path
  document.querySelector('meta[name="twitter:card"]')?.setAttribute('content', 'summary_large_image');
};

// New constant for the Supabase hosted PDF URL
const SAMPLE_REPORT_URL = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/marketing-assets/legal_health_check.pdf';

const FreeLegalCheck = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  // Dynamic Metadata Update
  useEffect(() => {
    updateMetadata(
      "Free Creator Deal Risk Check | Creator Armour",
      "Answer a few questions and Creator Armour will flag your likely contract, proof, and payment risks before your next brand deal gets messy."
    );
    
    // Meta Pixel Event 1: ViewContent
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'ViewContent');
    }

    // Cleanup function to reset title/description when component unmounts (or navigates away)
    return () => {
      updateMetadata(
        "Creator Armour - Protect Creator Deals, Contracts, and Payments",
        "Creator Armour helps creators protect brand deals with structured offers, contract clarity, proof trails, and payment recovery workflows."
      );
    };
  }, []);

  const scrollToForm = () => {
    void trackEvent('legal_check_started', { source: 'free_legal_check_page' });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show floating CTA after scrolling past hero
      if (scrollY > 600) {
        setShowFloatingCta(true);
      } else {
        setShowFloatingCta(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const TrustBadge = ({ text, Icon }: { text: string, Icon: React.ElementType }) => (
    <div className="flex items-center space-x-2 p-3 bg-secondary rounded-lg border border-border shadow-sm">
      <Icon className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-sm font-medium text-foreground">{text}</span>
    </div>
  );

  const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="space-y-1">
      <h4 className="font-semibold text-foreground flex items-center">
        <Zap className="h-4 w-4 text-primary mr-2" /> {question}
      </h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );

  // FAQ Schema Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "What is a Legal Health Check?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Creator Deal Risk Check helps creators identify likely contract, payment, and proof risks before a brand deal becomes expensive to fix."
      }
    }, {
      "@type": "Question",
      "name": "Is the Legal Health Check free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The Creator Deal Risk Check by Creator Armour is free."
      }
    }]
  };

  return (
    <div className="nb-screen-height bg-background">
      {/* Inject FAQ Schema */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />

      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            Creator Armour
          </Link>
          <Button variant="outline" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
            <Link to="/login">
              Client Login
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-16" id="hero">
          <div className="badge mb-4 mx-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            ⚡ Free creator deal risk check
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground mb-4">
            Find the weak spots in your next brand deal before they cost you money.
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            In under 2 minutes, Creator Armour will flag your likely contract, payment, and proof risks and tell you what to fix first.
          </p>
          
          {/* Trust Badges (Point 6) */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1 text-green-500 font-semibold"><Lock className="h-4 w-4" /> Confidential Report</span>
            <span className="flex items-center gap-1 text-blue-500 font-semibold"><Clock className="h-4 w-4" /> Risk summary in 24-48 hrs</span>
            <span className="flex items-center gap-1 text-purple-500 font-semibold">
              <Star className="h-4 w-4 fill-current text-yellow-500" /> Built for Indian creators
            </span>
          </div>

          {/* CTA Layout with "No Payment Required" */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button 
              onClick={scrollToForm} 
              className="cta-primary px-8 py-3 rounded-lg font-bold text-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]"
            >
              Get My Free Risk Check <ArrowDown className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Urgency/Social Proof below CTA */}
          <div className="mt-8 space-y-2">
            <p className="text-sm font-semibold text-green-500 flex items-center justify-center">
              <Users className="h-4 w-4 mr-2" /> Used by creators handling paid, barter, and hybrid deals
            </p>
            <div className="max-w-xs mx-auto mt-4">
              <p className="text-xs font-semibold text-red-500 mb-1">Limited review slots this week</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section (What You'll Get) - REPLACED WITH CONCISE LIST */}
        <section className="max-w-4xl mx-auto mb-16" data-aos="fade-up">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">What You Get in Your Free Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <TrustBadge text="Deal Risk Summary" Icon={ShieldCheck} />
            <TrustBadge text="Contract / Payment / Proof Priority" Icon={AlertTriangle} />
            <TrustBadge text="Recommended Next Step" Icon={Gavel} />
            <TrustBadge text="Estimated Money at Risk" Icon={IndianRupee} />
            <TrustBadge text="Optional 15-min review call" Icon={Users} />
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:text-primary/80 justify-center sm:justify-start">
              <a href={SAMPLE_REPORT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center sm:justify-start">
                <FileText className="h-4 w-4 mr-2" /> Preview Sample Report
              </a>
            </Button>
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-2xl mx-auto" id="form" ref={formRef} data-aos="fade-up" data-aos-delay="100">
          <LegalCheckForm />
        </section>
        
        {/* Social Proof Section (Point 3) */}
        <section className="max-w-2xl mx-auto mt-16" data-aos="fade-up">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">📣 What Creators Are Saying</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-secondary p-6 rounded-xl border-l-4 border-blue-500 shadow-lg">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                "The risk check made it obvious my contract was weak on usage rights and payment terms. I fixed it before sending the final yes."
              </p>
              <div className="mt-4 font-bold text-white">— Riya S., fashion creator</div>
            </Card>
            <Card className="bg-secondary p-6 rounded-xl border-l-4 border-green-500 shadow-lg">
              <div className="flex mb-3 text-yellow-400">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                "It helped me realize the real problem was not just delayed payment. I had almost no usable proof saved in one place."
              </p>
              <div className="mt-4 font-bold text-white">— Aryan K., tech reviewer</div>
            </Card>
          </div>
          <div className="text-center mt-6 text-muted-foreground text-sm">
            Creators use this before signing, while chasing payment, and when brands go silent
          </div>
        </section>
      </main>
      
      {/* Footer (Minimal) */}
      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-gray-500">
        <p>© 2025 Creator Armour. All rights reserved. | <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></p>
      </footer>

      {/* Floating CTA on Scroll */}
      <div className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
        showFloatingCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        <Button 
          onClick={scrollToForm} 
          className="cta-primary px-6 py-3 rounded-lg font-bold text-lg shadow-2xl flex items-center gap-2"
        >
          Get My Free Risk Check <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default FreeLegalCheck;
