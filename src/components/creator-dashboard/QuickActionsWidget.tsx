"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp, Bot, Send, Zap } from 'lucide-react';

interface QuickActionsWidgetProps {
  onAddBrandDeal: () => void;
  onUploadContract: () => void;
  onAIScan: () => void;
  onSendReminder: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onAddBrandDeal,
  onUploadContract,
  onAIScan,
  onSendReminder,
}) => {
  const actions = [
    {
      label: 'Add Brand Deal',
      icon: PlusCircle,
      onClick: onAddBrandDeal,
      variant: 'default' as const,
    },
    {
      label: 'Upload Contract',
      icon: FileUp,
      onClick: onUploadContract,
      variant: 'outline' as const,
    },
    {
      label: 'AI Scan',
      icon: Bot,
      onClick: onAIScan,
      variant: 'outline' as const,
    },
    {
      label: 'Send Reminder',
      icon: Send,
      onClick: onSendReminder,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="h-full border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
          <Zap className="h-4 w-4 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="w-full justify-start"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;

