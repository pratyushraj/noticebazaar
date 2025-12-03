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

  // Determine dashboard path based on role (all non-admin/CA users use Creator Dashboard)
  let dashboardPath = "/creator-dashboard";
  let profilePath = "/creator-profile";

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
  } else {
    // Default: Creator Dashboard (for 'creator', 'client', or any other role)
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
  }

  // Navbar hidden
  return null;
};

export default Navbar;

