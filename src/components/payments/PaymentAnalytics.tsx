"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, ChevronRight } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface PaymentAnalyticsProps {
  allDeals: BrandDeal[];
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ allDeals }) => {
  const navigate = useNavigate();

  const analytics = useMemo(() => {
    const completedDeals = allDeals.filter(deal => 
      deal.status === 'Completed' && deal.payment_received_date
    );

    // Calculate average payment time
    const paymentTimes = completedDeals
      .map(deal => {
        if (!deal.payment_received_date || !deal.payment_expected_date) return null;
        const expected = new Date(deal.payment_expected_date);
        const received = new Date(deal.payment_received_date);
        const diffTime = received.getTime() - expected.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      })
      .filter((time): time is number => time !== null);

    const avgPaymentTime = paymentTimes.length > 0
      ? Math.round(paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length)
      : 0;

    // Find fastest and slowest brands
    const brandPaymentTimes = new Map<string, number[]>();
    completedDeals.forEach(deal => {
      if (!deal.payment_received_date || !deal.payment_expected_date) return;
      const expected = new Date(deal.payment_expected_date);
      const received = new Date(deal.payment_received_date);
      const diffTime = received.getTime() - expected.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const existing = brandPaymentTimes.get(deal.brand_name) || [];
      existing.push(days);
      brandPaymentTimes.set(deal.brand_name, existing);
    });

    let fastestBrand = { name: 'N/A', days: 0 };
    let slowestBrand = { name: 'N/A', days: 0 };

    brandPaymentTimes.forEach((times, brand) => {
      const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
      if (fastestBrand.days === 0 || avg < fastestBrand.days) {
        fastestBrand = { name: brand, days: avg };
      }
      if (slowestBrand.days === 0 || avg > slowestBrand.days) {
        slowestBrand = { name: brand, days: avg };
      }
    });

    // Calculate payment success rate
    const totalExpected = allDeals
      .filter(deal => deal.status === 'Payment Pending' || deal.status === 'Completed')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    const totalReceived = completedDeals.reduce((sum, deal) => sum + deal.deal_amount, 0);

    const successRate = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    // Calculate recovered through reminders (mock - in real app, track this)
    const recoveredAmount = completedDeals
      .filter(deal => {
        // Mock: assume deals completed after expected date were recovered through reminders
        if (!deal.payment_received_date || !deal.payment_expected_date) return false;
        const expected = new Date(deal.payment_expected_date);
        const received = new Date(deal.payment_received_date);
        return received > expected;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    // Brands to watch (with late payments)
    const brandsToWatch = Array.from(brandPaymentTimes.entries())
      .map(([brand, times]) => {
        const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
        const lateCount = times.filter(t => t > 30).length;
        return { brand, avgDays: avg, lateCount };
      })
      .filter(b => b.lateCount > 0 || b.avgDays > 45)
      .slice(0, 2);

    return {
      avgPaymentTime,
      fastestBrand,
      slowestBrand,
      successRate,
      recoveredAmount,
      brandsToWatch,
    };
  }, [allDeals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-lg font-semibold text-white">Payment Insights</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-payments?analytics=true')}
              className="text-xs text-white/60 hover:text-white hover:bg-white/10"
            >
              View Full
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Average Payment Time */}
          <div>
            <div className="text-sm text-white/60 mb-1">Average Payment Time</div>
            <div className="text-2xl font-bold text-white">{analytics.avgPaymentTime} days</div>
            <div className="text-xs text-white/60 mt-1">
              Fastest: {analytics.fastestBrand.name} ({analytics.fastestBrand.days} days) | 
              Slowest: {analytics.slowestBrand.name} ({analytics.slowestBrand.days} days)
            </div>
          </div>

          {/* Payment Success Rate */}
          <div>
            <div className="flex items-center justify-between text-sm text-white/60 mb-2">
              <span>Payment Success Rate</span>
              <span className="font-semibold text-white">{analytics.successRate}%</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analytics.successRate}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full"
              />
            </div>
          </div>

          {/* Total Recovered */}
          {analytics.recoveredAmount > 0 && (
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="text-sm text-white/60 mb-1">Total Recovered</div>
              <div className="text-lg font-bold text-emerald-400">
                ₹{analytics.recoveredAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-white/60 mt-1">
                (through reminders)
              </div>
            </div>
          )}

          {/* Brands to Watch */}
          {analytics.brandsToWatch.length > 0 && (
            <div>
              <div className="text-sm font-medium text-white mb-2">Brands to Watch</div>
              <div className="space-y-2">
                {analytics.brandsToWatch.map((brand, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      brand.lateCount > 1 ? "bg-red-500/10 border border-red-500/20" :
                      "bg-yellow-500/10 border border-yellow-500/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {brand.lateCount > 1 ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-sm font-medium text-white">{brand.brand}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      {brand.lateCount > 1 ? `${brand.lateCount} late payments` : 'Reliable payer'} 
                      {' '}(avg {brand.avgDays} days)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PaymentAnalytics;

