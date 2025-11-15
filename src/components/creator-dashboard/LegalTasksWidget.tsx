"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Calendar, ArrowRight } from 'lucide-react';
import { BrandDeal } from '@/types';
import { format } from 'date-fns';

interface LegalTasksWidgetProps {
  brandDeals: BrandDeal[];
  upcomingDeadlines: Array<{
    date: string;
    task: string;
    urgency: 'High' | 'Medium' | 'Low';
  }>;
  onViewContracts: () => void;
  onViewDeadlines: () => void;
}

const LegalTasksWidget: React.FC<LegalTasksWidgetProps> = ({
  brandDeals,
  upcomingDeadlines,
  onViewContracts,
  onViewDeadlines,
}) => {
  const contractsNeedingReview = useMemo(() => {
    return brandDeals?.filter(deal => 
      deal.contract_file_url && 
      (deal.status === 'Active' || deal.status === 'Payment Pending')
    ) || [];
  }, [brandDeals]);

  const urgentDeadlines = useMemo(() => {
    return upcomingDeadlines?.filter(deadline => deadline.urgency === 'High') || [];
  }, [upcomingDeadlines]);

  const totalTasks = contractsNeedingReview.length + urgentDeadlines.length;

  return (
    <Card className="h-full border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Legal Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalTasks === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No pending tasks</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {contractsNeedingReview.length > 0 && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={onViewContracts}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {contractsNeedingReview.length} contract{contractsNeedingReview.length !== 1 ? 's' : ''} to review
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {urgentDeadlines.length > 0 && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={onViewDeadlines}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">
                      {urgentDeadlines.length} urgent deadline{urgentDeadlines.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={onViewContracts}
            >
              Review Contracts
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalTasksWidget;

