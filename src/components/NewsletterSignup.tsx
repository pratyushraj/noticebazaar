"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    
    // Mock Submission Logic
    console.log(`Newsletter Signup: ${email}`);
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Subscribed!', {
        description: `You will now receive compliance tips at ${email}.`,
        duration: 3000,
      });
      setEmail('');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white text-lg">Get Compliance Tips Monthly</h4>
      <p className="text-gray-400 text-sm">
        Subscribe to our newsletter for expert insights on GST, ROC filings, and legal strategy for SMEs.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 py-2 bg-black/30 border-white/10 text-white placeholder-gray-400"
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !email.trim()}
          className="cta-secondary px-4 py-2 rounded-lg font-semibold flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default NewsletterSignup;