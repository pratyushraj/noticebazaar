"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import { MessageSquare, FileUp, DollarSign, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, generateAvatarUrl } from '@/lib/utils/avatar';
// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

interface RecentActivityProps {
  brandDeals?: BrandDeal[];
}

interface Activity {
  id: string;
  type: 'contract_reviewed' | 'advisor_replied' | 'upload_successful' | 'payment_received';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  avatarUrl?: string;
  avatarName?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ brandDeals = [] }) => {
  // Generate mock activities from brand deals
  const activities: Activity[] = React.useMemo(() => {
    const items: Activity[] = [];

    // Get recent deals with contracts
    const dealsWithContracts = brandDeals
      .filter(deal => deal.contract_file_url)
      .slice(0, 2);

    dealsWithContracts.forEach((deal, index) => {
      items.push({
        id: `contract-${deal.id}`,
        type: 'contract_reviewed',
        title: 'Contract reviewed',
        description: `${deal.brand_name} contract`,
        timestamp: new Date(deal.created_at),
        icon: <FileText className="w-4 h-4 text-blue-400" />,
      });
    });

    // Add mock advisor reply
    if (brandDeals.length > 0) {
      items.push({
        id: 'advisor-1',
        type: 'advisor_replied',
        title: 'Advisor replied',
        description: 'Legal advisor responded to your query',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
        avatarUrl: generateAvatarUrl('Prateek', 'Sharma'),
        avatarName: 'Adv. Prateek Sharma',
      });
    }

    // Add mock upload successful
    if (brandDeals.length > 0) {
      items.push({
        id: 'upload-1',
        type: 'upload_successful',
        title: 'Upload successful',
        description: 'Contract document uploaded',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        icon: <FileUp className="w-4 h-4 text-green-400" />,
      });
    }

    // Get deals with payments received
    const paidDeals = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .slice(0, 1);

    paidDeals.forEach(deal => {
      items.push({
        id: `payment-${deal.id}`,
        type: 'payment_received',
        title: 'Payment marked as received',
        description: `₹${deal.deal_amount.toLocaleString('en-IN')} from ${deal.brand_name}`,
        timestamp: new Date(deal.payment_received_date!),
        icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      });
    });

    // Sort by timestamp (newest first) and limit to 5
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [brandDeals]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_0_25px_-6px_rgba(0,0,0,0.45)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/10"></div>
          
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-3 pl-2"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-white/20 border-2 border-gray-950 z-10"></div>
                
                {/* Avatar or Icon */}
                <div className="flex-shrink-0 mt-1 relative z-10">
                  {activity.avatarUrl ? (
                    <Avatar className="h-8 w-8 border-2 border-gray-950">
                      <AvatarImage src={activity.avatarUrl} alt={activity.avatarName} />
                      <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {activity.avatarName ? getInitials(activity.avatarName.split(' ')[0], activity.avatarName.split(' ')[1] || '') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                      {activity.icon}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-white/60 mt-0.5">{activity.description}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;

