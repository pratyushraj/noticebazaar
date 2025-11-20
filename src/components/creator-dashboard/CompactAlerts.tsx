"use client";

import React from 'react';
import { Calendar, FileWarning, DollarSign } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface CompactAlertsProps {
  brandDeals?: BrandDeal[];
}

const CompactAlerts: React.FC<CompactAlertsProps> = ({ brandDeals = [] }) => {
  const now = new Date();
  
  // Calculate alerts
  const upcomingDeadlines = brandDeals?.filter(deal => {
    if (deal.status === 'Completed') return false;
    const dueDate = new Date(deal.payment_expected_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 0 && daysUntilDue <= 7;
  }).length || 0;

  const overduePayments = brandDeals?.filter(deal => {
    if (deal.status !== 'Payment Pending') return false;
    const dueDate = new Date(deal.payment_expected_date);
    return dueDate < now;
  }).length || 0;

  const missingDocuments = brandDeals?.filter(deal => 
    deal.status === 'Drafting' && !deal.contract_file_url
  ).length || 0;

  const alerts = [
    {
      id: 'deadlines',
      label: 'Upcoming deadlines',
      count: upcomingDeadlines,
      icon: Calendar,
    },
    {
      id: 'overdue',
      label: 'Payment overdue',
      count: overduePayments,
      icon: DollarSign,
    },
    {
      id: 'documents',
      label: 'Missing documents',
      count: missingDocuments,
      icon: FileWarning,
    },
  ].filter(alert => alert.count > 0);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-red-500/10 border border-red-500/30",
              "text-red-400 text-xs font-medium",
              "hover:bg-red-500/20 transition-colors cursor-pointer"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{alert.label}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
              {alert.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CompactAlerts;

