"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, FileText, DollarSign, CheckCircle2 } from 'lucide-react';
import { BrandDeal } from '@/types';

interface ThisWeeksSummaryProps {
  brandDeals?: BrandDeal[];
}

const ThisWeeksSummary: React.FC<ThisWeeksSummaryProps> = ({ brandDeals = [] }) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Calculate this week's metrics
  const dealsClosed = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const completedDate = new Date(deal.payment_received_date);
      return completedDate >= weekAgo;
    }).length;
  }, [brandDeals, weekAgo]);

  const invoicesSent = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const createdDate = new Date(deal.created_at);
      return createdDate >= weekAgo;
    }).length;
  }, [brandDeals, weekAgo]);

  const paymentsCollected = React.useMemo(() => {
    return brandDeals
      .filter(deal => {
        if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
        const paidDate = new Date(deal.payment_received_date);
        return paidDate >= weekAgo;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
  }, [brandDeals, weekAgo]);

  const contractsReviewed = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (!deal.contract_file_url) return false;
      // Assume reviewed if status changed from Drafting to Approved/Completed
      if (deal.status === 'Approved' || deal.status === 'Completed') {
        const updatedDate = new Date(deal.updated_at || deal.created_at);
        return updatedDate >= weekAgo;
      }
      return false;
    }).length;
  }, [brandDeals, weekAgo]);

  const summaryItems = [
    {
      icon: <Briefcase className="h-5 w-5 text-blue-400" />,
      label: 'Deals Closed',
      value: dealsClosed,
      color: 'text-blue-400',
    },
    {
      icon: <FileText className="h-5 w-5 text-purple-400" />,
      label: 'Invoices Sent',
      value: invoicesSent,
      color: 'text-purple-400',
    },
    {
      icon: <DollarSign className="h-5 w-5 text-green-400" />,
      label: 'Payments Collected',
      value: `₹${Math.round(paymentsCollected / 1000)}k`,
      color: 'text-green-400',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-orange-400" />,
      label: 'Contracts Reviewed',
      value: contractsReviewed,
      color: 'text-orange-400',
    },
  ];

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">This Week's Summary</CardTitle>
        <p className="text-xs text-white/60 mt-1">Your performance at a glance</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThisWeeksSummary;

