"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Briefcase, FileText, AlertCircle, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthSummaryProps {
  earningsReceived?: number;
  paymentsPending?: number;
  newDeals?: number;
  contractsReviewed?: number;
  aiFlagsFound?: number;
}

const MonthSummary: React.FC<MonthSummaryProps> = ({
  earningsReceived = 0,
  paymentsPending = 0,
  newDeals = 0,
  contractsReviewed = 0,
  aiFlagsFound = 0,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="creator-card-base shadow-lg p-6 border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="absolute inset-0 rounded-full opacity-30 blur-sm bg-primary"></span>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">This Month at a Glance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4 text-green-500" />
              <span>Earnings Received</span>
            </div>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(earningsReceived)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span>Payments Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">
              {formatCurrency(paymentsPending)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <span>New Deals</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {newDeals}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>Contracts Reviewed</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">
              {contractsReviewed}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>AI Flags Found</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {aiFlagsFound} <span className="text-sm font-normal text-muted-foreground">issues</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthSummary;
