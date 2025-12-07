"use client";

import React from 'react';
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

  return null;
};

export default Navbar;

