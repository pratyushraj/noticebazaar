"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Clock, FileText, Send, CheckCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface TasksWorkflowCardProps {
  brandDeals?: BrandDeal[];
}

type WorkflowTab = 'tasks' | 'pending' | 'drafts' | 'submitted' | 'completed';

const TasksWorkflowCard: React.FC<TasksWorkflowCardProps> = ({ brandDeals = [] }) => {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('tasks');

  // Categorize deals by status
  const categorizedDeals = useMemo(() => {
    const now = new Date();
    
    return {
      tasks: brandDeals.filter(deal => {
        // Tasks: deals that need action (drafting, approved with deliverables due soon)
        if (deal.status === 'Drafting') return true;
        if (deal.status === 'Approved' && deal.due_date) {
          const dueDate = new Date(deal.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDue <= 7 && daysUntilDue >= 0;
        }
        return false;
      }),
      pending: brandDeals.filter(deal => deal.status === 'Payment Pending'),
      drafts: brandDeals.filter(deal => deal.status === 'Drafting'),
      submitted: brandDeals.filter(deal => deal.status === 'Approved'),
      completed: brandDeals.filter(deal => deal.status === 'Completed' || deal.payment_received_date),
    };
  }, [brandDeals]);

  const getTabIcon = (tab: WorkflowTab) => {
    switch (tab) {
      case 'tasks':
        return <Circle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'drafts':
        return <FileText className="h-4 w-4" />;
      case 'submitted':
        return <Send className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: WorkflowTab) => {
    const count = categorizedDeals[tab].length;
    switch (tab) {
      case 'tasks':
        return `Tasks (${count})`;
      case 'pending':
        return `Pending (${count})`;
      case 'drafts':
        return `Drafts (${count})`;
      case 'submitted':
        return `Submitted (${count})`;
      case 'completed':
        return `Completed (${count})`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays}d`;
  };

  const renderDealItem = (deal: BrandDeal) => (
    <div
      key={deal.id}
      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {activeTab === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5 text-white/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{deal.brand_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/50">
              {deal.payment_expected_date && formatDate(deal.payment_expected_date)}
            </span>
            {deal.deal_amount > 0 && (
              <>
                <span className="text-xs text-white/30">•</span>
                <span className="text-xs text-white/50">₹{deal.deal_amount.toLocaleString('en-IN')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white">Tasks & Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkflowTab)}>
          <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10 rounded-lg p-1">
            {(['tasks', 'pending', 'drafts', 'submitted', 'completed'] as WorkflowTab[]).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-all",
                  "data-[state=active]:bg-white/10 data-[state=active]:text-white",
                  "data-[state=inactive]:text-white/50"
                )}
              >
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">{categorizedDeals[tab].length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(['tasks', 'pending', 'drafts', 'submitted', 'completed'] as WorkflowTab[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {categorizedDeals[tab].length === 0 ? (
                  <div className="text-center py-8 text-white/50 text-sm">
                    No items in {tab}
                  </div>
                ) : (
                  categorizedDeals[tab].map(renderDealItem)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TasksWorkflowCard;

