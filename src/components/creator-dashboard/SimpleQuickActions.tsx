"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Bot, DollarSign, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleQuickActionsProps {
  onAddBrandDeal?: () => void;
  onUploadContract?: () => void;
  onAIScanContract?: () => void;
  onSendPaymentReminder?: () => void;
  onSendTakedownNotice?: () => void;
}

const SimpleQuickActions: React.FC<SimpleQuickActionsProps> = ({
  onAddBrandDeal,
  onUploadContract,
  onAIScanContract,
  onSendPaymentReminder,
  onSendTakedownNotice,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Button
          onClick={onAddBrandDeal}
          className="flex flex-col items-center justify-center gap-2 h-20 quick-action-button-gradient text-secondary-foreground"
          variant="default"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">Add Brand Deal</span>
        </Button>
        
        <Button
          onClick={onUploadContract}
          className="flex flex-col items-center justify-center gap-2 h-20 quick-action-button-gradient text-secondary-foreground"
          variant="default"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs font-semibold">Upload Contract</span>
        </Button>
        
        <Button
          onClick={onAIScanContract}
          className="flex flex-col items-center justify-center gap-2 h-20 quick-action-button-gradient text-secondary-foreground"
          variant="default"
        >
          <Bot className="h-5 w-5" />
          <span className="text-xs font-semibold">AI Scan Contract</span>
        </Button>
        
        <Button
          onClick={onSendPaymentReminder}
          className="flex flex-col items-center justify-center gap-2 h-20 quick-action-button-gradient text-secondary-foreground"
          variant="default"
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-xs font-semibold">Payment Reminder</span>
        </Button>
        
        <Button
          onClick={onSendTakedownNotice}
          className="flex flex-col items-center justify-center gap-2 h-20 quick-action-button-gradient text-secondary-foreground"
          variant="default"
        >
          <ShieldAlert className="h-5 w-5" />
          <span className="text-xs font-semibold">Send Takedown Notice</span>
        </Button>
      </div>
    </div>
  );
};

export default SimpleQuickActions;
