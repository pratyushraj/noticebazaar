"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Briefcase, Wallet, Shield, Sparkles, Menu, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { motion } from 'framer-motion';

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

  // Get plan badge color based on tier
  const getPlanBadgeClass = () => {
    const tier = partnerStats?.tier || 'starter';
    if (tier === 'pro') return 'bg-purple-600/20 text-purple-300 border-purple-500/20';
    if (tier === 'elite') return 'bg-indigo-600/20 text-indigo-300 border-indigo-500/20';
    if (tier === 'growth') return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20';
    if (tier === 'partner') return 'bg-blue-600/20 text-blue-300 border-blue-500/20';
    return 'bg-gray-600/20 text-gray-300 border-gray-500/20';
  };

  // Get role badge color
  const getRoleBadgeClass = () => {
    if (profile?.role === 'creator') return 'bg-purple-600/20 text-purple-300 border-purple-500/20';
    if (profile?.role === 'admin') return 'bg-red-600/20 text-red-300 border-red-500/20';
    if (profile?.role === 'chartered_accountant') return 'bg-orange-600/20 text-orange-300 border-orange-500/20';
    return 'bg-blue-600/20 text-blue-300 border-blue-500/20';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] bg-[#0F121A]/95 backdrop-blur-xl border-r border-white/10 p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col"
      >
        {/* Profile Card at Top - Premium Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mb-4 flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500/40 rounded-full flex-shrink-0">
              <AvatarImage 
                src={profile?.avatar_url || DEFAULT_AVATAR_URL} 
                alt={fullName}
              />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-semibold">
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {fullName}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Role:</span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium border",
                getRoleBadgeClass()
              )}>
                {role}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Plan:</span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium border",
                getPlanBadgeClass()
              )}>
                {plan}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Divider after Profile */}
        <div className="border-t border-white/10 mb-4" />

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
                    "group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                    "hover:bg-white/5 active:scale-[0.98]",
                    "before:absolute before:inset-0 before:rounded-lg before:bg-blue-500/10 before:blur-md before:opacity-0 before:transition-opacity before:duration-300",
                    "group-hover:before:opacity-100",
                    active
                      ? "bg-blue-600/20 text-white before:opacity-100"
                      : "text-gray-300 hover:text-gray-200"
                  )}
                >
                  {/* Active Left Indicator Bar */}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md z-20"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-transform duration-150 group-hover:translate-x-0.5",
                    active ? "text-blue-400" : "text-gray-400"
                  )} />
                  <span className="flex-1 relative z-10">{tab.label}</span>
                  {tab.to === '/partner-program' && showRewardBadge && (
                    <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-md font-medium relative z-10">
                      +₹{totalEarnings.toLocaleString('en-IN')}
                    </span>
                  )}
                </Link>
              );
          })}

          {/* Divider after Protection (if exists) */}
          {visibleTabs.some(tab => tab.label === 'Protection') && (
            <div className="border-t border-white/10 my-3" />
          )}

          {/* Divider before Settings */}
          <div className="border-t border-white/10 my-3" />
          
          <Link
            to={profilePath}
            onClick={() => setOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
              "hover:bg-white/5 active:scale-[0.98]",
              "before:absolute before:inset-0 before:rounded-lg before:bg-blue-500/10 before:blur-md before:opacity-0 before:transition-opacity before:duration-300",
              "group-hover:before:opacity-100",
              isActive(profilePath)
                ? "bg-blue-600/20 text-white before:opacity-100"
                : "text-gray-300 hover:text-gray-200"
            )}
          >
            {/* Active Left Indicator Bar */}
            {isActive(profilePath) && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-md z-20"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
            
            <Settings className={cn(
              "h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-transform duration-150 group-hover:translate-x-0.5",
              isActive(profilePath) ? "text-blue-400" : "text-gray-400"
            )} />
            <span className="relative z-10">Settings</span>
          </Link>

          {/* Divider before Logout */}
          <div className="border-t border-white/10 my-3" />

          <button
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 active:scale-[0.98] w-full text-left transition-all duration-150 disabled:opacity-50"
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
