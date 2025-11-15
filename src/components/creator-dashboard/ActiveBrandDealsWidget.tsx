"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, ArrowRight } from 'lucide-react';
import { BrandDeal } from '@/types';

interface ActiveBrandDealsWidgetProps {
  deals: BrandDeal[];
  onViewAll: () => void;
  onEditDeal: (deal: BrandDeal) => void;
}

const ActiveBrandDealsWidget: React.FC<ActiveBrandDealsWidgetProps> = ({
  deals,
  onViewAll,
  onEditDeal,
}) => {
  const activeDeals = deals?.filter(deal => deal.status === 'Active' || deal.status === 'Payment Pending') || [];
  const displayDeals = activeDeals.slice(0, 3);

  return (
    <Card className="h-full border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Active Brand Deals
          </span>
          {activeDeals.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayDeals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No active deals</p>
          </div>
        ) : (
          <>
            {displayDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onEditDeal(deal)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {deal.brand_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{deal.deal_amount.toLocaleString('en-IN')}
                  </p>
                  {deal.payment_expected_date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Due {new Date(deal.payment_expected_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={onViewAll}
            >
              View All Deals
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveBrandDealsWidget;

