"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Send, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingPaymentsWidgetProps {
  amount: string;
  invoiceCount: number;
  status: 'No Pending Payments' | 'Payment Pending' | 'Overdue';
  onSendReminder: () => void;
}

const PendingPaymentsWidget: React.FC<PendingPaymentsWidgetProps> = ({
  amount,
  invoiceCount,
  status,
  onSendReminder,
}) => {
  const isOverdue = status === 'Overdue';
  const hasPayments = status !== 'No Pending Payments';

  return (
    <Card className="h-full border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Pending Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {amount}
          </div>
          {hasPayments && (
            <p className="text-sm text-muted-foreground">
              {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
            </p>
          )}
          {!hasPayments && (
            <p className="text-sm text-muted-foreground">All payments up to date</p>
          )}
        </div>
        
        {hasPayments && (
          <Button
            onClick={onSendReminder}
            className={cn(
              "w-full",
              isOverdue
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
        )}
        
        {isOverdue && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Payment overdue</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingPaymentsWidget;

