"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, Briefcase, ArrowRight, DollarSign, CheckCircle, XCircle, AlertCircle, Plus, AlertTriangle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import BrandPill from './BrandPill';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentFilter = 'all' | 'paid' | 'pending' | 'overdue';

interface CreatorRevenuePaymentsProps {
  pendingBrandPayments: { amount: string; status: string; details: string };
  activeBrandDeals: BrandDeal[];
  previousBrands: string[];
  totalIncomeTracked: string;
  onEditBrandDeal: (deal: BrandDeal) => void;
  onSendReminder?: (deal: BrandDeal) => void;
  onAddPaymentReceived?: (deal: BrandDeal) => void;
  onDisputePayment?: (deal: BrandDeal) => void;
}

const CreatorRevenuePayments: React.FC<CreatorRevenuePaymentsProps> = ({
  pendingBrandPayments,
  activeBrandDeals,
  previousBrands,
  totalIncomeTracked,
  onSendReminder,
  onAddPaymentReceived,
  onDisputePayment,
}) => {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

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

  const getBrandLogo = (deal: BrandDeal) => {
    if (deal.brand_logo_url) {
      return (
        <img
          src={deal.brand_logo_url}
          alt={deal.brand_name}
          className="w-10 h-10 rounded-full object-cover border border-border"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = getBrandIcon(deal.brand_name);
            }
          }}
        />
      );
    }
    return (
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg border border-border">
        {getBrandIcon(deal.brand_name)}
      </div>
    );
  };

  // Filter and sort payments
  const filteredPayments = activeBrandDeals
    .filter(deal => {
      if (paymentFilter === 'all') return true;
      if (paymentFilter === 'paid') return deal.status === 'Completed' || deal.payment_received_date !== null;
      if (paymentFilter === 'pending') return deal.status === 'Payment Pending' && calculateOverdueDays(deal.payment_expected_date) === 0;
      if (paymentFilter === 'overdue') return deal.status === 'Payment Pending' && calculateOverdueDays(deal.payment_expected_date) > 0;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.payment_received_date || a.payment_expected_date).getTime();
      const dateB = new Date(b.payment_received_date || b.payment_expected_date).getTime();
      return dateB - dateA;
    });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Revenue & Payments</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Brand Payments Card */}
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
                  .slice(0, 3)
                  .map((deal, index) => {
                    const overdueDays = calculateOverdueDays(deal.payment_expected_date);
                    const daysUntilDue = overdueDays === 0 
                      ? Math.ceil((new Date(deal.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    const isOverdue = overdueDays > 0;
                    const hasInvoice = !!deal.invoice_file_url;

                    return (
                      <div key={index} className={cn(
                        "p-4 rounded-lg border",
                        isOverdue ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"
                      )}>
                        <div className="flex items-start gap-3">
                          {getBrandLogo(deal)}
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
                            {deal.status === 'Payment Pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-8 text-xs"
                                onClick={() => {
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
            <p className="text-sm text-muted-foreground">
              Total income tracked: <span className="font-bold text-foreground">{totalIncomeTracked}</span>
            </p>
          </CardContent>
          <Button asChild variant="link" className="p-0 w-full text-primary hover:text-primary/80 mt-4">
            <Link to="/creator-contracts">
              View All Brands <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>

      {/* Payment Timeline Section */}
      <Card className="creator-card-base shadow-sm p-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
          <CardTitle className="text-lg font-semibold text-foreground">Payment Timeline</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const firstPendingDeal = activeBrandDeals.find(d => d.status === 'Payment Pending');
              if (firstPendingDeal && onAddPaymentReceived) {
                onAddPaymentReceived(firstPendingDeal);
              }
            }}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Payment Received
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {/* Filter Tabs */}
          <div className="mb-4">
            <Tabs value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  All ({activeBrandDeals.length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Paid ({activeBrandDeals.filter(d => d.status === 'Completed' || d.payment_received_date).length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pending ({activeBrandDeals.filter(d => d.status === 'Payment Pending' && calculateOverdueDays(d.payment_expected_date) === 0).length})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Overdue ({activeBrandDeals.filter(d => d.status === 'Payment Pending' && calculateOverdueDays(d.payment_expected_date) > 0).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Payment List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((deal, index) => {
                const overdueDays = calculateOverdueDays(deal.payment_expected_date);
                const isOverdue = overdueDays > 0;
                const isPaid = deal.status === 'Completed' || deal.payment_received_date !== null;
                const paymentDate = deal.payment_received_date 
                  ? new Date(deal.payment_received_date) 
                  : new Date(deal.payment_expected_date);

                return (
                  <div
                    key={deal.id || index}
                    className={cn(
                      "p-4 rounded-lg border flex items-start gap-4",
                      isPaid
                        ? "bg-green-500/5 border-green-500/20"
                        : isOverdue
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-card border-border"
                    )}
                  >
                    {getBrandLogo(deal)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{deal.brand_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isPaid
                              ? `Paid on ${paymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                              : `Due on ${paymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            ₹{deal.deal_amount.toLocaleString('en-IN')}
                          </div>
                          <Badge
                            variant={isPaid ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                            className="mt-1 text-xs"
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </>
                            ) : isOverdue ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Overdue {overdueDays}d
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      {!isPaid && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              if (onAddPaymentReceived) {
                                onAddPaymentReceived(deal);
                              }
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Payment Received
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => {
                              if (onDisputePayment) {
                                onDisputePayment(deal);
                              }
                            }}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Dispute Payment
                          </Button>
                        </div>
                      )}
                      {isPaid && deal.utr_number && (
                        <p className="text-xs text-muted-foreground mt-2">
                          UTR: {deal.utr_number}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payments found for this filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorRevenuePayments;
