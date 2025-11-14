"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, Briefcase, ArrowRight, DollarSign } from 'lucide-react';
import { BrandDeal } from '@/types'; // Import BrandDeal type
import { cn } from '@/lib/utils';
import BrandPill from './BrandPill'; // Import the new BrandPill component
import { Link } from 'react-router-dom'; // Import Link

interface CreatorRevenuePaymentsProps {
  pendingBrandPayments: { amount: string; status: string; details: string };
  activeBrandDeals: BrandDeal[];
  previousBrands: string[];
  totalIncomeTracked: string;
  onEditBrandDeal: (deal: BrandDeal) => void; // New prop for editing
  onSendReminder?: (deal: BrandDeal) => void; // New prop for sending payment reminder
}

const CreatorRevenuePayments: React.FC<CreatorRevenuePaymentsProps> = ({
  pendingBrandPayments,
  activeBrandDeals,
  previousBrands,
  totalIncomeTracked,
  onEditBrandDeal,
  onSendReminder,
}) => {
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
      <h2 className="text-xl font-semibold text-foreground">Revenue & Payments</h2>
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

        {/* Active Brand Deals - Mini CRM */}
        <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Brand Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-0 pb-0 flex-grow">
            <div className="space-y-3 mt-2">
              {activeBrandDeals.length > 0 ? (
                activeBrandDeals
                  .filter(deal => deal.status === 'Payment Pending')
                  .slice(0, 3) // Show max 3 deals
                  .map((deal, index) => {
                    const overdueDays = calculateOverdueDays(deal.payment_expected_date);
                    const daysUntilDue = overdueDays === 0 ? Math.ceil((new Date(deal.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isOverdue = overdueDays > 0;
                    const hasInvoice = !!deal.invoice_file_url;
                    
                    // Get brand emoji or first letter
                    const getBrandIcon = (brandName: string) => {
                      const name = brandName.toLowerCase();
                      if (name.includes('nike')) return '🎯';
                      if (name.includes('mamaearth') || name.includes('mama')) return '🌿';
                      if (name.includes('amazon')) return '📦';
                      if (name.includes('flipkart')) return '🛒';
                      if (name.includes('zomato')) return '🍔';
                      if (name.includes('swiggy')) return '🚗';
                      return brandName.charAt(0).toUpperCase();
                    };

                    return (
                      <div key={index} className={cn(
                        "p-4 rounded-lg border",
                        isOverdue ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"
                      )}>
                        <div className="flex items-start gap-3">
                          {/* Brand Logo/Icon */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg border border-border">
                            {getBrandIcon(deal.brand_name)}
                          </div>
                          
                          {/* Brand Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{deal.brand_name}</h3>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                              <span className="font-bold text-foreground">₹{deal.deal_amount.toLocaleString('en-IN')}</span>
                              <span className="text-muted-foreground">•</span>
                              {isOverdue ? (
                                <span className="text-red-400 font-medium">Overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}</span>
                              ) : (
                                <span className="text-muted-foreground">Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</span>
                              )}
                              {hasInvoice && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">1 invoice pending</span>
                                </>
                              )}
                            </div>
                            
                            {/* Send Reminder Button */}
                            {deal.status === 'Payment Pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-8 text-xs"
                                onClick={() => {
                                  // This will be handled by the parent component
                                  if (onSendReminder) {
                                    onSendReminder(deal);
                                  }
                                }}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Send Reminder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-muted-foreground text-sm">No active deals.</p>
              )}
            </div>
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
    </div>
  );
};

export default CreatorRevenuePayments;