"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { QuickAction } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';
import { DollarSign, Bot, ShieldCheck, PlusCircle } from 'lucide-react';

interface CreatorQuickActionsProps {
  quickActions: QuickAction[];
  onAddBrandDeal: () => void;
  onAIScanContract: () => void;
  onUploadContract: () => void;
  onLinkSocialAccounts: () => void; // Kept for backward compatibility but not used
  onSendPaymentReminder: () => void;
  onSendTakedownNotice: () => void;
}

const CreatorQuickActions: React.FC<CreatorQuickActionsProps> = ({ quickActions, onAddBrandDeal, onAIScanContract, onUploadContract, onLinkSocialAccounts, onSendPaymentReminder, onSendTakedownNotice }) => {
  // Filter out the mock quick actions that will be replaced by specific buttons or real data
  const filteredQuickActions = quickActions.filter(action => 
    action.label !== 'Send Payment Reminder' && 
    action.label !== 'Upload Contract' && 
    action.label !== 'AI Scan Contract' && 
    action.label !== 'Send Takedown Notice' &&
    action.label !== 'Link Social Accounts'
  );

  const customQuickActions = [
    { label: 'Add Brand Deal', icon: PlusCircle, onClick: onAddBrandDeal, variant: 'default' as const },
    { label: 'Send Payment Reminder', icon: DollarSign, onClick: onSendPaymentReminder },
    { label: 'Scan New Contract', icon: Bot, onClick: () => {
      // Combined action: First open upload dialog, then allow AI scan
      onUploadContract();
    }},
    { label: 'Send Takedown Notice', icon: ShieldCheck, onClick: onSendTakedownNotice, variant: 'primary' as const },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {customQuickActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-4 h-24 rounded-xl",
              action.variant === 'primary'
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all' // High-contrast amber for Send Takedown Notice
                : action.variant === 'destructive'
                  ? 'quick-action-button-destructive-gradient text-destructive-foreground'
                  : 'quick-action-button-gradient text-secondary-foreground'
            )}
          >
            <action.icon className="h-6 w-6 mb-2" /> {/* Increased icon size */}
            <span className="text-sm font-semibold">{action.label}</span> {/* Added font-semibold */}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CreatorQuickActions;