"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { QuickAction } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';
import { DollarSign, FileText, Bot, ShieldCheck, PlusCircle } from 'lucide-react';

interface CreatorQuickActionsProps {
  quickActions: QuickAction[];
  onAddBrandDeal: () => void; // New prop for opening the brand deal form
  onAIScanContract: () => void; // New prop for opening the AI scan dialog
  onUploadContract: () => void; // Handler for 'Upload Contract' quick action
  onSendPaymentReminder: () => void; // NEW: Handler for 'Send Payment Reminder'
  onSendTakedownNotice: () => void; // NEW: Handler for 'Send Takedown Notice'
}

const CreatorQuickActions: React.FC<CreatorQuickActionsProps> = ({ quickActions, onAddBrandDeal, onAIScanContract, onUploadContract, onSendPaymentReminder, onSendTakedownNotice }) => {
  // Filter out the mock quick actions that will be replaced by specific buttons or real data
  const filteredQuickActions = quickActions.filter(action => 
    action.label !== 'Send Payment Reminder' && 
    action.label !== 'Upload Contract' && 
    action.label !== 'AI Scan Contract' && 
    action.label !== 'Send Takedown Notice'
  );

  const customQuickActions = [
    { label: 'Add Brand Deal', icon: PlusCircle, onClick: onAddBrandDeal, variant: 'default' as const },
    { label: 'Send Payment Reminder', icon: DollarSign, onClick: onSendPaymentReminder }, // Use new handler
    { label: 'Upload Contract', icon: FileText, onClick: onUploadContract },
    { label: 'AI Scan Contract', icon: Bot, onClick: onAIScanContract },
    { label: 'Send Takedown Notice', icon: ShieldCheck, onClick: onSendTakedownNotice, variant: 'destructive' as const }, // Use new handler
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
              "flex flex-col items-center justify-center p-4 h-24 rounded-xl", // Increased height to h-24, added rounded-xl
              action.variant === 'destructive' 
                ? 'quick-action-button-destructive-gradient text-destructive-foreground' // Apply destructive gradient
                : 'quick-action-button-gradient text-secondary-foreground' // Apply general gradient
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