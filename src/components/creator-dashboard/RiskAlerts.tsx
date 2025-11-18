"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, DollarSign, Shield, FileText, TrendingDown } from 'lucide-react';
import { BrandDeal } from '@/types';

interface RiskAlertsProps {
  brandDeals?: BrandDeal[];
}

interface RiskAlert {
  id: string;
  type: 'missing_deliverable' | 'delayed_payment' | 'flagged_brand';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const RiskAlerts: React.FC<RiskAlertsProps> = ({ brandDeals = [] }) => {
  const alerts: RiskAlert[] = React.useMemo(() => {
    const items: RiskAlert[] = [];
    const now = new Date();

    // Check for missing deliverable dates
    const dealsWithoutDeliverables = brandDeals.filter(deal => 
      deal.status === 'Approved' && !deal.deliverables?.includes('date')
    );
    
    if (dealsWithoutDeliverables.length > 0) {
      items.push({
        id: 'missing-deliverable-1',
        type: 'missing_deliverable',
        title: 'Missing Deliverable Date',
        description: `${dealsWithoutDeliverables.length} deal(s) missing deliverable timeline`,
        severity: 'medium',
        icon: <Calendar className="h-4 w-4" />,
      });
    }

    // Check for GST filing due (mock - based on quarterly dates)
    const today = new Date();
    const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 2, 31);
    const daysUntilGSTDue = Math.ceil((quarterEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilGSTDue <= 30 && daysUntilGSTDue > 0) {
      items.push({
        id: 'gst-filing-due',
        type: 'flagged_brand',
        title: 'GST Filing Due Soon',
        description: `Quarterly GST filing due in ${daysUntilGSTDue} days. Contact your CA.`,
        severity: 'high',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Check for low collection ratio
    const totalExpected = brandDeals
      .filter(deal => deal.status === 'Payment Pending' || deal.status === 'Completed')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const paidAmount = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const collectionRatio = totalExpected > 0 ? (paidAmount / totalExpected) * 100 : 100;
    
    if (collectionRatio < 70 && brandDeals.length > 0) {
      items.push({
        id: 'low-collection',
        type: 'delayed_payment',
        title: 'Low Collection Ratio This Week',
        description: `Collection rate at ${Math.round(collectionRatio)}%. Review pending payments.`,
        severity: 'medium',
        icon: <TrendingDown className="h-4 w-4" />,
      });
    }

    // Check for unread contract reviews
    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );
    
    if (contractsNeedingReview.length > 0) {
      items.push({
        id: 'unread-review',
        type: 'missing_deliverable',
        title: 'Unread Contract Review',
        description: `${contractsNeedingReview.length} contract(s) waiting for your review`,
        severity: 'medium',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Check for possible delayed payments (based on history)
    const dealsWithDelayedHistory = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue > 0;
    });

    if (dealsWithDelayedHistory.length > 0) {
      items.push({
        id: 'delayed-payment-1',
        type: 'delayed_payment',
        title: 'Payment Risk Detected',
        description: `${dealsWithDelayedHistory.length} payment(s) due within 3 days`,
        severity: 'high',
        icon: <DollarSign className="h-4 w-4" />,
      });
    }

    // Check for overdue payments
    const overdueDeals = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });

    if (overdueDeals.length > 0) {
      items.push({
        id: 'overdue-payment-1',
        type: 'delayed_payment',
        title: 'Overdue Payments',
        description: `${overdueDeals.length} payment(s) past due date`,
        severity: 'high',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    return items.slice(0, 3); // Limit to 3 alerts
  }, [brandDeals]);

  if (alerts.length === 0) {
    return (
      <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Smart Alerts
        </CardTitle>
        <p className="text-xs text-white/60 mt-1">AI-powered insights for your business</p>
      </CardHeader>
        <CardContent>
          <p className="text-sm text-white/60 text-center py-4">No risk alerts at this time</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'medium':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'low':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Smart Alerts
        </CardTitle>
        <p className="text-xs text-white/60 mt-1">AI-powered insights for your business</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${getSeverityStyles(alert.severity)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{alert.title}</p>
              <p className="text-xs text-white/60 mt-0.5">{alert.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RiskAlerts;

