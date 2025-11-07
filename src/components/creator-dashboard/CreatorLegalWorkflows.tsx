"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { ContractReview, TakedownAlert } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorLegalWorkflowsProps {
  contractsRequiringReview: ContractReview[];
  takedownAlerts: TakedownAlert[];
}

const CreatorLegalWorkflows: React.FC<CreatorLegalWorkflowsProps> = ({
  contractsRequiringReview,
  takedownAlerts,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Legal Workflows</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts Requiring Review */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contracts Requiring Review</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-4">
              {contractsRequiringReview.map((contract, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-foreground">{contract.title}</span>
                </li>
              ))}
            </ul>
            <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Review Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Takedown Alerts */}
        <Card className="bg-destructive/20 shadow-sm border border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Takedown Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-4">
              {takedownAlerts.map((alert, index) => (
                <li key={index} className="flex flex-col">
                  <span className="font-semibold text-foreground">{alert.description}</span>
                  <span className="text-sm text-muted-foreground">{alert.action}</span>
                </li>
              ))}
            </ul>
            <Button variant="destructive" className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              View Matches <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorLegalWorkflows;