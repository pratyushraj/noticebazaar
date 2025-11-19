"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Briefcase, Wallet, Shield, Sparkles, Settings, LogOut } from 'lucide-react';
import AppsGridIcon from '@/components/icons/AppsGridIcon';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';

interface NavTab {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

interface MobileMenuProps {
  tabs: NavTab[];
  profilePath: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ tabs, profilePath }) => {
  const location = useLocation();
  const { profile, user } = useSession();
  const signOutMutation = useSignOut();
  const [open, setOpen] = React.useState(false);

  // Fetch partner stats for earnings badge
  const { data: partnerStats } = usePartnerStats(profile?.id);
  const totalEarnings = partnerStats?.total_earnings || 0;
  const showRewardBadge = totalEarnings > 0 && profile?.role === 'creator';

  // Get plan name - default to Starter for creators, or show from subscription
  const getPlanName = () => {
    if (profile?.role === 'creator') {
      // For creators, we can infer plan from partner tier
      const tier = partnerStats?.tier || 'starter';
      if (tier === 'pro') return 'Pro';
      if (tier === 'elite') return 'Elite';
      if (tier === 'growth') return 'Growth';
      if (tier === 'partner') return 'Partner';
      return 'Starter';
    }
    return 'Standard';
  };

  const isActive = (path: string) => {
    if (path === '/creator-dashboard') {
      return location.pathname === path || location.pathname === '/creator-dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter tabs based on role
  const visibleTabs = tabs.filter(tab => {
    if (!tab.roles) return true;
    return tab.roles.includes(profile?.role || '');
  });

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
    setOpen(false);
  };

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';
  const email = user?.email || '';
  const role = profile?.role === 'creator' ? 'Creator' : profile?.role === 'admin' ? 'Admin' : profile?.role === 'chartered_accountant' ? 'CA' : 'Client';
  const plan = getPlanName();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div 
          className="lg:hidden w-[38px] h-[38px] rounded-full hover:bg-[#1f1f1f] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
        >
          <AppsGridIcon />
        </div>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[84%] sm:w-[320px] bg-[#0C111C] backdrop-blur-xl border-r border-white/10 p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col rounded-r-2xl"
      >
        {/* Profile Header at Top */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500/40 border-2 border-blue-500/20 rounded-full flex-shrink-0">
              <AvatarImage 
                src={profile?.avatar_url || DEFAULT_AVATAR_URL} 
                alt={fullName}
              />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-semibold">
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate mb-0.5">
                {fullName}
              </h3>
              <p className="text-sm text-[#b0b0b0] truncate">
                {email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium",
              profile?.role === 'creator' 
                ? "bg-[#6740FF] text-white" 
                : "bg-[#363636] text-gray-300"
            )}>
              {role}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#363636] text-gray-300">
              {plan}
            </span>
          </div>
        </div>

        {/* Divider after Profile */}
        <div className="h-[1px] bg-[#1A2333] mb-4" />

        {/* Main Navigation - Scrollable */}
        <nav className="flex-1 flex flex-col space-y-1 overflow-y-auto min-h-0 -mx-2 px-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);
            
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150",
                    "hover:bg-[#1C2433] active:scale-[0.98]",
                    active
                      ? "bg-gradient-to-r from-[#0A3AFF] to-[#003A9F] text-white"
                      : "text-[#9FA8B7] hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-all duration-150",
                    active ? "text-white" : "text-[#A8B0C0] group-hover:text-white"
                  )} />
                  <span className="flex-1 relative z-10">{tab.label}</span>
                  {tab.to === '/partner-program' && showRewardBadge && (
                    <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-medium relative z-10">
                      +₹{totalEarnings.toLocaleString('en-IN')}
                    </span>
                  )}
                </Link>
              );
          })}

          {/* Divider before Settings */}
          <div className="h-[1px] bg-[#1A2333] my-3" />
          
          <Link
            to={profilePath}
            onClick={() => setOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150",
              "hover:bg-[#1C2433] active:scale-[0.98]",
              isActive(profilePath)
                ? "bg-gradient-to-r from-[#0A3AFF] to-[#003A9F] text-white"
                : "text-[#9FA8B7] hover:text-white"
            )}
          >
            <Settings className={cn(
              "h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-all duration-150",
              isActive(profilePath) ? "text-white" : "text-[#A8B0C0] group-hover:text-white"
            )} />
            <span className="relative z-10">Settings</span>
          </Link>

          {/* Divider before Logout */}
          <div className="h-[1px] bg-[#1A2333] my-3" />

          <button
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/10 active:scale-[0.98] w-full text-left transition-all duration-150 disabled:opacity-50"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
            <span>Logout</span>
          </button>

          {/* Bottom Safe Padding for Thumb Reach */}
          <div className="h-10 flex-shrink-0" />
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
