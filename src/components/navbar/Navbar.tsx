"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';
import Notifications from './Notifications';
import ProfileDropdown from './ProfileDropdown';
import AppsMenu from './AppsMenu';

const Navbar: React.FC = () => {
  const { user, profile } = useSession();

  // Determine dashboard path based on role
  let dashboardPath = "/client-dashboard";
  let profilePath = "/client-profile";

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
  } else if (profile?.role === 'creator') {
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
  }

  // For preview mode, show navbar even without user
  const isPreview = window.location.pathname === '/dashboard-preview';
  
  if (!user && !isPreview) {
    return null; // Don't render navbar if not logged in (except in preview)
  }

  return (
    <header 
      className={cn(
        "sticky top-0 z-[200] w-full h-16 progressive-blur",
        "bg-white/[0.08] backdrop-blur-[40px] border-b border-white/10",
        "shadow-[0_4px_24px_rgba(0,0,0,0.2)]",
        "pt-[max(0px,env(safe-area-inset-top))]"
      )}
    >
      <div className="container mx-auto px-4 lg:px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Section: Hamburger Menu, Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu (AppsMenu) */}
            <AppsMenu profileRole={profile?.role || null} />
            
            <Link 
              to={dashboardPath} 
              className="flex items-center group transition-all duration-200"
            >
              <span className="text-base font-semibold text-white hidden sm:inline-block">
                NoticeBazaar
              </span>
            </Link>
          </div>

          {/* Right Section: Search, Notifications, User Avatar */}
          <div className="flex items-center gap-[14px] pr-4 lg:pr-0">
            {/* Search */}
            <SearchBar />

            {/* Notifications */}
            <Notifications />

            {/* User Avatar */}
            <ProfileDropdown profilePath={profilePath} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

