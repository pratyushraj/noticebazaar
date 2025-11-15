"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndianRupee, Briefcase, ArrowRight, DollarSign, Edit, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import BrandPill from './BrandPill';
import { Link } from 'react-router-dom';

interface CreatorRevenuePaymentsProps {
  pendingBrandPayments: { amount: string; status: string; details: string };
  activeBrandDeals: BrandDeal[];
  previousBrands: string[];
  totalIncomeTracked: string;
  onEditBrandDeal: (deal: BrandDeal) => void;
  allBrandDeals?: BrandDeal[]; // Add prop for all deals to calculate paid/recovered
}

const CreatorRevenuePayments: React.FC<CreatorRevenuePaymentsProps> = ({
  pendingBrandPayments,
  activeBrandDeals,
  previousBrands,
  totalIncomeTracked,
  onEditBrandDeal,
  allBrandDeals = [],
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');

  // Calculate paid/recovered deals
  const paidAndRecoveredDeals = allBrandDeals.filter(deal => 
    deal.status === 'Completed' || (deal.status === 'Approved' && deal.payment_received === true)
  );

  const totalPaidAmount = paidAndRecoveredDeals.reduce((sum, deal) => sum + deal.deal_amount, 0);
  const calculateOverdueDays = (paymentExpectedDate: string) => {
    const today = new Date();
    const expectedDate = new Date(paymentExpectedDate);
    today.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);

    if (expectedDate < today) {
      const diffTime = Math.abs(today.getTime() - expectedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'paid')}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Revenue & Payments</h2>
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid & Recovered</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="pending" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Brand Payments */}
            <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Brand Payments</CardTitle>
            <IndianRupee className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-0 pb-0 flex-grow">
            <div className="flex items-center mt-2">
              <IndianRupee className="h-6 w-6 text-yellow-400 mr-2" />
              <div className="text-4xl font-bold text-yellow-400">{pendingBrandPayments.amount}</div>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full mr-2",
                pendingBrandPayments.status === 'Overdue' ? 'bg-red-500' : 'bg-blue-500'
              )}></span>
              <p className="text-muted-foreground">{pendingBrandPayments.details}</p>
            </div>
            {pendingBrandPayments.status === 'Overdue' && (
              <p className="text-xs text-red-400 mt-1">
                {pendingBrandPayments.details.split(' ')[0]} invoice{pendingBrandPayments.details.split(' ')[0] !== '1' ? 's' : ''} overdue!
              </p>
            )}
          </CardContent>
          <Button asChild variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
            <Link to="/creator-payments">
              View Recovery Cases <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        {/* Active Brand Deals */}
        <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Brand Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-0 pb-0 flex-grow">
            <ul className="space-y-2 mt-2">
              {activeBrandDeals.length > 0 ? (
                activeBrandDeals.map((deal, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-foreground mr-2">{deal.brand_name}</span>
                      {deal.status === 'Payment Pending' && calculateOverdueDays(deal.payment_expected_date) > 0 && (
                        <span className="text-xs text-red-400">({calculateOverdueDays(deal.payment_expected_date)} days overdue)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          deal.status === 'Drafting' 
                            ? 'badge-drafting-gradient' 
                            : deal.status === 'Payment Pending'
                              ? 'badge-payment-pending-gradient'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                        )}
                      >
                        {deal.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => onEditBrandDeal(deal)} className="h-6 w-6 text-muted-foreground hover:bg-secondary">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No active deals.</p>
              )}
            </ul>
          </CardContent>
          <Button asChild variant="link" className="p-0 w-full text-primary hover:text-primary/80 mt-4">
            <Link to="/creator-contracts">
              View All Deals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        {/* Previous Brands */}
        <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Previous Brands</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-0 pb-0 flex-grow">
            <div className="flex flex-wrap gap-2 mb-4 mt-2">
              {previousBrands.length > 0 ? (
                previousBrands.map((brand, index) => (
                  <BrandPill key={index} brandName={brand} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No previous brands.</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total income tracked: <span className="font-bold text-foreground">{totalIncomeTracked}</span></p>
          </CardContent>
          <Button asChild variant="link" className="p-0 w-full text-primary hover:text-primary/80 mt-4">
            <Link to="/creator-contracts">
              View All Brands <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="paid" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Paid & Recovered Payments */}
            <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid & Recovered</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-0 pb-0 flex-grow">
                <div className="flex items-center mt-2">
                  <IndianRupee className="h-6 w-6 text-green-400 mr-2" />
                  <div className="text-4xl font-bold text-green-400">₹{totalPaidAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="flex items-center text-sm mt-2">
                  <span className="h-2.5 w-2.5 rounded-full mr-2 bg-green-500"></span>
                  <p className="text-muted-foreground">{paidAndRecoveredDeals.length} payment{paidAndRecoveredDeals.length !== 1 ? 's' : ''} recovered</p>
                </div>
              </CardContent>
              <Button asChild variant="default" className="w-full bg-green-600 text-white hover:bg-green-700 mt-4">
                <Link to="/creator-payments">
                  View Recovery History <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>

            {/* Recovered Brand Deals */}
            <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recovered Deals</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-0 pb-0 flex-grow">
                <ul className="space-y-2 mt-2">
                  {paidAndRecoveredDeals.length > 0 ? (
                    paidAndRecoveredDeals.slice(0, 5).map((deal, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-foreground mr-2">{deal.brand_name}</span>
                        </div>
                        <Badge 
                          variant="outline"
                          className="bg-green-500/20 text-green-400 border-green-500/30 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        >
                          Paid
                        </Badge>
                      </li>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No recovered deals yet.</p>
                  )}
                </ul>
              </CardContent>
              {paidAndRecoveredDeals.length > 5 && (
                <Button asChild variant="link" className="p-0 w-full text-primary hover:text-primary/80 mt-4">
                  <Link to="/creator-payments">
                    View All Recovered <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </Card>

            {/* Success Metrics */}
            <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recovery Success</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-0 pb-0 flex-grow">
                <div className="mt-2">
                  <p className="text-2xl font-bold text-green-400 mb-2">
                    {paidAndRecoveredDeals.length > 0 ? Math.round((paidAndRecoveredDeals.length / allBrandDeals.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Recovery rate</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {paidAndRecoveredDeals.length} of {allBrandDeals.length} deals successfully recovered
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorRevenuePayments;