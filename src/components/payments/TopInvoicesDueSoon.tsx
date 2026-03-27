"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface TopInvoicesDueSoonProps {
  brandDeals?: BrandDeal[];
}

const TopInvoicesDueSoon: React.FC<TopInvoicesDueSoonProps> = ({ brandDeals = [] }) => {
  const navigate = useNavigate();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

  const upcomingInvoices = useMemo(() => {
    const pending = brandDeals
      .filter(deal => {
        if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
        const dueDate = new Date(deal.payment_expected_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0; // Only future or today
      })
      .map(deal => {
        const dueDate = new Date(deal.payment_expected_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { deal, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    // For demo mode, return demo data
    if (brandDeals.length <= 6 && pending.length === 0) {
      return [
        { deal: brandDeals.find(d => d.brand_name === 'Ajio'), daysUntil: 2 },
        { deal: brandDeals.find(d => d.brand_name === 'Zepto'), daysUntil: 5 },
        { deal: brandDeals.find(d => d.brand_name === 'Nike'), daysUntil: 10 },
      ].filter(item => item.deal) as Array<{ deal: BrandDeal; daysUntil: number }>;
    }

    return pending;
  }, [brandDeals, now]);

  if (upcomingInvoices.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/40 hover:border-blue-600/60 transition-all shadow-inner">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Top 5 Invoices Due Soon
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => navigate('/creator-payments')}
            >
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <style dangerouslySetInnerHTML={{__html: `
            .premium-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .premium-scrollbar::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 10px;
            }
            .premium-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 10px;
              transition: background 0.2s ease;
            }
            .premium-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.35);
            }
            .premium-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            }
          `}} />
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 premium-scrollbar">
            {upcomingInvoices.map(({ deal, daysUntil }) => (
                <div
                key={deal.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/creator-contracts/${deal.id}`)}
                >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <BrandLogo brandName={deal.brand_name} size="sm" />
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                        {deal.brand_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>₹{deal.deal_amount.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <div className={cn(
                        "flex items-center gap-1",
                        daysUntil <= 3 ? "text-orange-400" : "text-muted-foreground"
                        )}>
                        <Calendar className="h-3 w-3" />
                        <span>{daysUntil === 0 ? 'Due today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}</span>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopInvoicesDueSoon;
