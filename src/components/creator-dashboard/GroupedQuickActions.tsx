"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Bot, DollarSign, Gavel, Briefcase, ShieldCheck, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupedQuickActionsProps {
  onAddBrandDeal?: () => void;
  onSendPaymentReminder?: () => void;
  onUploadContract?: () => void;
  onAIScanContract?: () => void;
  onFileTaxes?: () => void;
  onFixIssues?: () => void;
  onDraftLegalNotice?: () => void;
}

const GroupedQuickActions: React.FC<GroupedQuickActionsProps> = ({
  onAddBrandDeal,
  onSendPaymentReminder,
  onUploadContract,
  onAIScanContract,
  onFileTaxes,
  onFixIssues,
  onDraftLegalNotice,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brand Deals Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Deals</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={onAddBrandDeal}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Brand Deal
            </Button>
            <Button
              onClick={onSendPaymentReminder}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Send Payment Reminder
            </Button>
          </div>
        </div>

        {/* Contracts Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contracts</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={onUploadContract}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Contract
            </Button>
            <Button
              onClick={onAIScanContract}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Scan Contract
            </Button>
          </div>
        </div>

        {/* Compliance Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance</span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={onFileTaxes}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <Calculator className="h-4 w-4 mr-2" />
              File Taxes
            </Button>
            <Button
              onClick={onFixIssues}
              className="w-full justify-start quick-action-button-gradient text-secondary-foreground h-12"
              variant="default"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Fix Issues
            </Button>
          </div>
        </div>

        {/* Legal Notice Group */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Legal Notice</span>
          </div>
          <Button
            onClick={onDraftLegalNotice}
            className="w-full justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-24 font-semibold"
            variant="default"
          >
            <div className="flex flex-col items-center gap-2">
              <Gavel className="h-6 w-6" />
              <span>Draft Legal Notice (AI)</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupedQuickActions;
