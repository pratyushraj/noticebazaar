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
  Hotel
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { isCreatorProSync } from '@/lib/subscription';
import ConsumerComplaintModal from '@/components/consumer-complaints/ConsumerComplaintModal';
import UpgradeModal from '@/components/consumer-complaints/UpgradeModal';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: 'ecommerce_marketplaces',
    name: 'E-commerce & Marketplaces',
    icon: ShoppingBag,
    color: '#FF6B35',
    bgColor: 'rgba(255, 107, 53, 0.15)',
  },
  {
    id: 'food_grocery',
    name: 'Food & Grocery Apps',
    icon: UtensilsCrossed,
    color: '#FF6B9D',
    bgColor: 'rgba(255, 107, 157, 0.15)',
  },
  {
    id: 'rides_transport',
    name: 'Rides, Transport & Delivery',
    icon: Car,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'home_services',
    name: 'Home & Local Services',
    icon: Wrench,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'travel_hotels',
    name: 'Travel & Hotels',
    icon: Plane,
    color: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
  },
  {
    id: 'telecom_internet',
    name: 'Telecom & Internet',
    icon: Phone,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'banking_wallets',
    name: 'Banking & Wallets',
    icon: Wallet,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  {
    id: 'healthcare_insurance',
    name: 'Healthcare & Insurance',
    icon: Heart,
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'others',
    name: 'Others',
    icon: MoreHorizontal,
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
];

const ConsumerComplaintsPage: React.FC = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  // Removed for testing phase - no upgrade modal needed
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Pro check removed for testing phase - available to all users
  // const isProUser = isCreatorProSync(profile);

  // Pro redirect removed for testing phase
  // React.useEffect(() => {
  //   if (profile && !isProUser) {
  //     navigate('/upgrade?source=consumer-complaints', { replace: true });
  //   }
  // }, [profile, isProUser, navigate]);

  const handleRaiseComplaint = (categoryId: string) => {
    // Pro check removed for testing phase - allow all users
    // if (!isProUser) {
    //   setShowUpgradeModal(true);
    //   return;
    // }
    setSelectedCategory(categoryId);
    setShowComplaintModal(true);
  };

  const handleComplaintSubmit = () => {
    // Mock submission - show success
    setShowComplaintModal(false);
    setSelectedCategory(null);
    // In a real implementation, you'd show a toast or success message here
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
    <>
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Consumer Complaints
              </h1>
            </div>
            <p className="text-white/70 text-lg mt-2">
              Resolve everyday refund and service issues without stress.
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  variant="tertiary"
                  interactive
                  className="group hover:scale-[1.02] transition-transform duration-200 bg-white/5 border-white/10"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Icon */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: category.bgColor,
                        }}
                      >
                        <Icon
                          className="w-8 h-8"
                          style={{ color: category.color }}
                        />
                      </div>

                      {/* Category Name */}
                      <h3 className="text-lg font-semibold text-white">
                        {category.name}
                      </h3>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleRaiseComplaint(category.id)}
                        className="w-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 text-purple-200 hover:text-purple-100 transition-all"
                      >
                        Raise Complaint
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      <ConsumerComplaintModal
        open={showComplaintModal}
        onOpenChange={setShowComplaintModal}
        category={selectedCategory}
        categoryName={categories.find(c => c.id === selectedCategory)?.name}
        onSubmit={handleComplaintSubmit}
      />

      {/* Upgrade Modal removed for testing phase - available to all users */}
      {/* <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      /> */}
    </>
  );
};

export default ConsumerComplaintsPage;





