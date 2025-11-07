"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, Briefcase, ArrowRight, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_PENDING_BRAND_PAYMENTS, MOCK_ACTIVE_BRAND_DEALS, MOCK_PREVIOUS_BRANDS, MOCK_TOTAL_INCOME_TRACKED, BrandDeal } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorRevenuePaymentsProps {
  pendingBrandPayments: typeof MOCK_PENDING_BRAND_PAYMENTS;
  activeBrandDeals: BrandDeal[];
  previousBrands: string[];
  totalIncomeTracked: string;
}

const CreatorRevenuePayments: React.FC<CreatorRevenuePaymentsProps> = ({
  pendingBrandPayments,
  activeBrandDeals,
  previousBrands,
  totalIncomeTracked,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Revenue & Payments</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Brand Payments */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Brand Payments</CardTitle>
            <IndianRupee className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{pendingBrandPayments.amount}</div>
            <p className="text-sm text-muted-foreground">{pendingBrandPayments.details}</p>
            <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
              View Recovery Cases <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Active Brand Deals */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Brand Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {activeBrandDeals.map((deal, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-foreground">{deal.name}</span>
                  <Badge variant={deal.status === 'Drafting' ? 'secondary' : 'default'}>
                    {deal.status}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button variant="link" className="p-0 mt-4 text-primary hover:text-primary/80">
              View All Deals <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Previous Brands */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Previous Brands</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {previousBrands.map((brand, index) => (
                <Badge key={index} variant="outline" className="text-muted-foreground">
                  {brand}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Total income tracked: <span className="font-bold text-foreground">{totalIncomeTracked}</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorRevenuePayments;