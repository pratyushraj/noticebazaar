"use client";

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, CalendarDays, Clock, AlertTriangle, Zap, Lock, Instagram, Linkedin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ThankYou = () => {
  // Define the Calendly link
  const CALENDLY_LINK = 'https://calendly.com/creatorarmour/15-minute-legal-consultation';

  useEffect(() => {
    // Meta Pixel Event 3: Lead (Main Conversion Goal)
    const fireLeadEvent = () => {
      if (typeof (window as any).fbq === 'function') {
        console.log('FB Pixel: Firing Lead event.');
        (window as any).fbq('track', 'Lead');
      } else {
        // If fbq is not ready, try again after a short delay
        setTimeout(fireLeadEvent, 500);
      }
    };

    fireLeadEvent();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-xl w-full bg-card p-8 rounded-xl shadow-2xl border border-border text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">
          🎉 Thank You — Your Legal Health Check Is Under Review
        </h1>
        
        <Separator className="bg-border mb-6" />

        {/* What Happens Next Section */}
        <div className="space-y-4 text-left mb-8">
          <h2 className="text-xl font-bold text-primary flex items-center">
            <Clock className="h-5 w-5 mr-2" /> What Happens Next
          </h2>
          <p className="text-lg text-muted-foreground">
            Our legal experts are analyzing your responses. Your Personalized Legal Health Report will be delivered to your inbox within <strong>24–48 hours</strong>.
          </p>
          
          <ul className="list-none space-y-2 text-foreground text-sm pl-0">
            <li className="flex items-center"><ArrowRight className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" /> 📊 Your Legal Health Score</li>
            <li className="flex items-center"><ArrowRight className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" /> ⚠️ Any red flags or missing compliances</li>
            <li className="flex items-center"><ArrowRight className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" /> 🧭 Recommended next steps (custom to your industry)</li>
          </ul>
        </div>

        {/* Fast-Track CTA Section */}
        <Card className="bg-secondary p-5 rounded-lg shadow-inner border border-primary/50 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-3 flex items-center justify-center">
            <Zap className="h-6 w-6 mr-2 text-yellow-400" /> Want to Fast-Track It?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Book a Free 15-Min Consultation and get early access to your results + personalized advice on your business.
          </p>
          <Button asChild className="w-full cta-primary py-3 rounded-lg font-bold text-lg">
            <a 
              href={CALENDLY_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <CalendarDays className="h-5 w-5 mr-2" /> Book My Free Consultation Now
            </a>
          </Button>
        </Card>

        {/* Trust and Pro Tip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
          <div className="space-y-2">
            <h4 className="font-bold text-foreground flex items-center"><Lock className="h-4 w-4 mr-2 text-purple-400" /> 100% Confidential</h4>
            <p className="text-xs text-muted-foreground">Your data stays private — always. We never share or resell your information.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-red-400" /> Pro Tip</h4>
            <p className="text-xs text-muted-foreground">Businesses that fix gaps within 7 days of audit improve compliance readiness by up to 80% before investor or tax review.</p>
          </div>
        </div>

        {/* Stay Connected */}
        <div className="border-t border-border/50 pt-6">
          <h4 className="font-bold text-foreground mb-3">💙 Stay Connected</h4>
          <div className="flex justify-center space-x-6">
            <a href="https://www.instagram.com/creatorarmour" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
              <Instagram className="h-5 w-5 mr-1" /> Instagram
            </a>
            <a href="https://www.linkedin.com/company/creatorarmour" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
              <Linkedin className="h-5 w-5 mr-1" /> LinkedIn
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ThankYou;