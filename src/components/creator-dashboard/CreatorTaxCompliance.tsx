"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { MOCK_TAX_COMPLIANCE_STATUS } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorTaxComplianceProps {
  taxComplianceStatus: typeof MOCK_TAX_COMPLIANCE_STATUS;
}

const CreatorTaxCompliance: React.FC<CreatorTaxComplianceProps> = ({ taxComplianceStatus }) => {
  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Tax Compliance Status</CardTitle>
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold text-foreground">{taxComplianceStatus.amount}</div>
          <div className="text-sm text-muted-foreground">{taxComplianceStatus.deals}</div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Next Due: <span className="font-bold text-foreground">{taxComplianceStatus.nextDue}</span></p>
        <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          File Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreatorTaxCompliance;