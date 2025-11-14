"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeliverableStatus = 'pending' | 'in_progress' | 'review_pending' | 'completed';

export interface Deliverable {
  id: string;
  name: string;
  status: DeliverableStatus;
  dueDate?: string;
  notes?: string;
}

interface DeliverablesTrackerProps {
  deliverables: Deliverable[];
  brandDealId?: string;
  onUpdateDeliverable?: (deliverable: Deliverable) => void;
  onAddDeliverable?: () => void;
}

const DeliverablesTracker: React.FC<DeliverablesTrackerProps> = ({
  deliverables = [],
  brandDealId,
  onUpdateDeliverable,
  onAddDeliverable,
}) => {
  const getStatusIcon = (status: DeliverableStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
      case 'review_pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Done
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'review_pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Review Pending
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-gray-500/30 text-gray-400">
            <XCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const completedCount = deliverables.filter(d => d.status === 'completed').length;
  const totalCount = deliverables.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="creator-card-base shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-foreground">Deliverables Tracker</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} completed
          </span>
          {onAddDeliverable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddDeliverable}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {totalCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold text-foreground">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  completionPercentage === 100
                    ? 'bg-green-500'
                    : completionPercentage >= 50
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {deliverables.length > 0 ? (
            deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm',
                  deliverable.status === 'completed'
                    ? 'bg-green-500/5 border-green-500/20'
                    : deliverable.status === 'review_pending'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-card border-border'
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(deliverable.status)}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium text-foreground',
                        deliverable.status === 'completed' && 'line-through text-muted-foreground'
                      )}
                    >
                      {deliverable.name}
                    </p>
                    {deliverable.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due: {new Date(deliverable.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    )}
                    {deliverable.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{deliverable.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(deliverable.status)}
                  {onUpdateDeliverable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const nextStatus: DeliverableStatus =
                          deliverable.status === 'pending'
                            ? 'in_progress'
                            : deliverable.status === 'in_progress'
                            ? 'review_pending'
                            : deliverable.status === 'review_pending'
                            ? 'completed'
                            : 'completed';
                        onUpdateDeliverable({ ...deliverable, status: nextStatus });
                      }}
                      className="h-7 text-xs"
                      disabled={deliverable.status === 'completed'}
                    >
                      {deliverable.status === 'pending'
                        ? 'Start'
                        : deliverable.status === 'in_progress'
                        ? 'Mark Review'
                        : deliverable.status === 'review_pending'
                        ? 'Complete'
                        : 'Done'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No deliverables added yet</p>
              {onAddDeliverable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddDeliverable}
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deliverable
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliverablesTracker;
