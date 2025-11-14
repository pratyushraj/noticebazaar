"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyright, FileText, DollarSign, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LegalHealthOverviewProps {
  copyrightHealth?: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    pendingTakedowns?: number;
  };
  contractHealth?: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    reviewedContracts?: number;
    pendingReviews?: number;
  };
  paymentHealth?: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    overdueInvoices?: number;
    pendingPayments?: number;
  };
}

const LegalHealthOverview: React.FC<LegalHealthOverviewProps> = ({
  copyrightHealth = { status: 'healthy', message: 'No takedowns pending' },
  contractHealth = { status: 'healthy', message: '2 contracts reviewed', reviewedContracts: 2 },
  paymentHealth = { status: 'warning', message: '1 invoice overdue', overdueInvoices: 1 },
}) => {
  const getStatusConfig = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          emoji: '✔',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          emoji: '⚠️',
        };
      case 'critical':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          emoji: '🔴',
        };
    }
  };

  const copyrightConfig = getStatusConfig(copyrightHealth.status);
  const contractConfig = getStatusConfig(contractHealth.status);
  const paymentConfig = getStatusConfig(paymentHealth.status);

  const CopyrightIcon = copyrightConfig.icon;
  const ContractIcon = contractConfig.icon;
  const PaymentIcon = paymentConfig.icon;

  return (
    <Card className="creator-card-base shadow-lg p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
        <CardTitle className="text-lg font-semibold text-foreground">Legal Health Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Copyright Health */}
          <div className={cn(
            "p-4 rounded-lg border",
            copyrightConfig.bgColor,
            copyrightConfig.borderColor
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Copyright className={cn("h-5 w-5", copyrightConfig.color)} />
              <span className="text-sm font-medium text-foreground">Copyright Health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{copyrightConfig.emoji}</span>
              <p className="text-sm text-foreground">{copyrightHealth.message}</p>
            </div>
            {copyrightHealth.pendingTakedowns !== undefined && copyrightHealth.pendingTakedowns > 0 && (
              <Badge variant="outline" className={cn("mt-2", copyrightConfig.borderColor, copyrightConfig.color)}>
                {copyrightHealth.pendingTakedowns} pending
              </Badge>
            )}
          </div>

          {/* Contract Health */}
          <div className={cn(
            "p-4 rounded-lg border",
            contractConfig.bgColor,
            contractConfig.borderColor
          )}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className={cn("h-5 w-5", contractConfig.color)} />
              <span className="text-sm font-medium text-foreground">Contract Health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{contractConfig.emoji}</span>
              <p className="text-sm text-foreground">{contractHealth.message}</p>
            </div>
            {contractHealth.reviewedContracts !== undefined && (
              <Badge variant="outline" className={cn("mt-2", contractConfig.borderColor, contractConfig.color)}>
                {contractHealth.reviewedContracts} reviewed
              </Badge>
            )}
          </div>

          {/* Payment Health */}
          <div className={cn(
            "p-4 rounded-lg border",
            paymentConfig.bgColor,
            paymentConfig.borderColor
          )}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={cn("h-5 w-5", paymentConfig.color)} />
              <span className="text-sm font-medium text-foreground">Payment Health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{paymentConfig.emoji}</span>
              <p className="text-sm text-foreground">{paymentHealth.message}</p>
            </div>
            {paymentHealth.overdueInvoices !== undefined && paymentHealth.overdueInvoices > 0 && (
              <Badge variant="outline" className={cn("mt-2", paymentConfig.borderColor, paymentConfig.color)}>
                {paymentHealth.overdueInvoices} overdue
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegalHealthOverview;
