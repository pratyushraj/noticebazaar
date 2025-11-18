"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, DollarSign, FileCheck } from 'lucide-react';
import { BrandDeal } from '@/types';

interface SmartSuggestionsProps {
  brandDeals?: BrandDeal[];
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ brandDeals = [] }) => {
  const suggestions: Suggestion[] = React.useMemo(() => {
    const items: Suggestion[] = [];
    const now = new Date();

    // Check for pending payments due soon
    const paymentsDueSoon = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    });

    if (paymentsDueSoon.length > 0) {
      items.push({
        id: 'send-reminder',
        title: 'Send Payment Reminders',
        description: `${paymentsDueSoon.length} payment(s) due within a week`,
        action: 'Send reminders now',
        icon: <DollarSign className="h-5 w-5" />,
        priority: 'high',
      });
    }

    // Check for contracts needing review
    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );

    if (contractsNeedingReview.length > 0) {
      items.push({
        id: 'review-contracts',
        title: 'Review Pending Contracts',
        description: `${contractsNeedingReview.length} contract(s) waiting for your review`,
        action: 'Review now',
        icon: <FileCheck className="h-5 w-5" />,
        priority: 'medium',
      });
    }

    // General suggestion based on earnings trend
    const completedThisMonth = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === now.getMonth() && 
             receivedDate.getFullYear() === now.getFullYear();
    }).length;

    if (completedThisMonth >= 3) {
      items.push({
        id: 'pitch-more',
        title: 'Increase Pitch Frequency',
        description: 'You\'re closing deals well! Consider sending more brand pitches',
        action: 'Explore opportunities',
        icon: <TrendingUp className="h-5 w-5" />,
        priority: 'low',
      });
    }

    return items.slice(0, 3); // Limit to 3 suggestions
  }, [brandDeals]);

  if (suggestions.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'medium':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'low':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`flex items-start gap-3 p-4 rounded-xl border ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex-shrink-0 mt-0.5 text-purple-400">
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{suggestion.title}</p>
              <p className="text-xs text-white/60 mt-1">{suggestion.description}</p>
              <button className="text-xs text-purple-400 hover:text-purple-300 mt-2 font-medium">
                {suggestion.action} →
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SmartSuggestions;

