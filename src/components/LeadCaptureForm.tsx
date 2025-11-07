"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Download, Loader2, ArrowRight, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

const LeadCaptureForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    
    // --- Mock Submission Logic ---
    console.log(`Lead Captured: ${email}`);
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Success! Your Free Legal Health Check is ready.', {
        description: `We've sent the download link to ${email}. Check your inbox!`,
        duration: 5000,
      });
      setEmail('');
    }, 1500);
  };

  return (
    <Card className="card p-6 rounded-xl shadow-2xl border border-white/10 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0 space-y-4">
        {/* New Value Proposition */}
        <p className="text-yellow-400 font-semibold text-base flex items-center gap-2">
          <Zap className="h-5 w-5 flex-shrink-0" /> Find out if your business has hidden compliance risks — for free.
        </p>
        
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-yellow-400 flex-shrink-0" />
          <h3 className="text-2xl font-bold text-white">Free Legal Health Check</h3>
        </div>
        
        {/* New Progress Indicator */}
        <p className="text-gray-400 text-sm flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-500" /> Takes less than 60 seconds.
        </p>

        <p className="text-gray-300 text-lg">
          Download our comprehensive checklist to instantly assess your business's legal and tax compliance status.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder="Enter your business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 py-3 bg-black/30 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="cta-primary px-6 py-3 rounded-lg font-bold text-lg flex-shrink-0 h-12" // Added h-12 for explicit height
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Download Now <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadCaptureForm;