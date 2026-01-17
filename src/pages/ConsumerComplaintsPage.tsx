"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Plane, 
  Phone, 
  Wallet, 
  MoreHorizontal,
  Shield,
  ArrowRight,
  Car,
  Wrench,
  Heart,
  Hotel,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { isCreatorProSync } from '@/lib/subscription';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  helperText?: string;
}

const categories: Category[] = [
  {
    id: 'ecommerce_marketplaces',
    name: 'E-commerce & Marketplaces',
    icon: ShoppingBag,
    color: '#FF6B35',
    bgColor: 'rgba(255, 107, 53, 0.15)',
    helperText: 'Issues with orders, refunds, or missing items',
  },
  {
    id: 'food_grocery',
    name: 'Food & Grocery Apps',
    icon: UtensilsCrossed,
    color: '#FF6B9D',
    bgColor: 'rgba(255, 107, 157, 0.15)',
    helperText: 'Issues with orders, refunds, or missing items',
  },
  {
    id: 'rides_transport',
    name: 'Rides, Transport & Delivery',
    icon: Car,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    helperText: 'Problems with rides, deliveries, or transport services',
  },
  {
    id: 'home_services',
    name: 'Home & Local Services',
    icon: Wrench,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    helperText: 'Issues with home repairs, cleaning, or local services',
  },
  {
    id: 'travel_hotels',
    name: 'Travel & Hotels',
    icon: Plane,
    color: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
    helperText: 'Problems with bookings, cancellations, or hotel services',
  },
  {
    id: 'telecom_internet',
    name: 'Telecom & Internet',
    icon: Phone,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    helperText: 'Issues with phone, internet, or connectivity services',
  },
  {
    id: 'banking_wallets',
    name: 'Banking & Wallets',
    icon: Wallet,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    helperText: 'Problems with payments, transactions, or account access',
  },
  {
    id: 'healthcare_insurance',
    name: 'Healthcare & Insurance',
    icon: Heart,
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    helperText: 'Issues with medical services, claims, or coverage',
  },
  {
    id: 'others',
    name: 'Others',
    icon: MoreHorizontal,
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    helperText: 'Any other consumer service issue',
  },
];

const ConsumerComplaintsPage: React.FC = () => {
  const { profile } = useSession();
  const navigate = useNavigate();

  const handleRaiseComplaint = (categoryId: string, categoryName: string) => {
    navigate(`/lifestyle/consumer-complaints/form?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

  // Show loading or nothing while checking Pro status
  if (!profile) {
    return (
      <div className="nb-screen-height flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Pro check removed for testing phase - show page to all users
  // if (!isProUser) {
  //   return (
  //     <>
  //       <div className="nb-screen-height flex items-center justify-center p-4">
  //         <div className="text-center">
  //           <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
  //           <h2 className="text-2xl font-bold text-white mb-2">Lifestyle Shield is a Creator Pro benefit</h2>
  //           <p className="text-white/70 mb-6">Get unlimited consumer complaints, faster resolutions, and priority support.</p>
  //           <Button
  //             onClick={() => navigate('/upgrade?source=consumer-complaints')}
  //             className="bg-emerald-500 hover:bg-emerald-600 text-white"
  //           >
  //             Upgrade to Creator Pro
  //           </Button>
  //         </div>
  //       </div>
  //       <UpgradeModal
  //         open={showUpgradeModal}
  //         onOpenChange={setShowUpgradeModal}
  //       />
  //     </>
  //   );
  // }

  return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/creator-dashboard')}
            className="mb-4 text-white/70 hover:text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">
                Consumer Complaints
              </h1>
            </div>
          <p className="text-white/70 text-base">
              Resolve everyday refund and service issues without stress.
            </p>
          </div>

        {/* Category List */}
        <div className="space-y-4 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
              <button
                  key={category.id}
                onClick={() => handleRaiseComplaint(category.id, category.name)}
                className="w-full p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                >
                <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: category.bgColor,
                        }}
                      >
                        <Icon
                      className="w-7 h-7"
                          style={{ color: category.color }}
                        />
                      </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">
                        {category.name}
                      </h3>
                    {category.helperText && (
                      <p className="text-sm text-white/60">
                        {category.helperText}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
              </button>
              );
            })}
        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-900 via-purple-800 to-transparent border-t border-purple-500/20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/consumer-complaints/how-it-works')}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 text-white font-medium flex items-center justify-center gap-2 transition-all"
            >
              <HelpCircle className="w-5 h-5" />
              Need help choosing?
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerComplaintsPage;





