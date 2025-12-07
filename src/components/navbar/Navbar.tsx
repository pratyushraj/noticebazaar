"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import SearchBar from './SearchBar';
import Notifications from './Notifications';
import ProfileDropdown from './ProfileDropdown';
import AppsMenu from './AppsMenu';

const Navbar: React.FC = () => {
  const { user, profile, session } = useSession();

  // Don't show navbar if user is not logged in
  if (!session || !user) {
    return null;
  }

  // Determine dashboard path based on role (all non-admin/CA users use Creator Dashboard)
  // For new accounts, default to creator dashboard
  let dashboardPath = "/creator-dashboard";
  let profilePath = "/creator-profile";

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
  } else {
    // Default: Creator Dashboard (for 'creator', 'client', null role, or any other role)
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo/Brand */}
        <Link 
          to={dashboardPath}
          className="flex items-center gap-2 font-bold text-white hover:opacity-80 transition-opacity"
        >
          <span className="text-lg">NoticeBazaar</span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <SearchBar />
          <Notifications />
          <AppsMenu profileRole={profile?.role || null} />
          <ProfileDropdown profilePath={profilePath} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

