"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Home, Briefcase, Wallet, Shield, Sparkles, LayoutDashboard, FileText, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavTabs from './NavTabs';
import SearchBar from './SearchBar';
import Notifications from './Notifications';
import AppsMenu from './AppsMenu';

interface NavTab {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const Navbar: React.FC = () => {
  const { user, profile } = useSession();

  // Determine dashboard path based on role
  let dashboardPath = "/client-dashboard";
  let profilePath = "/client-profile";
  let navTabs: NavTab[] = [];

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
    navTabs = [
      { to: "/admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin-clients", icon: Users, label: "Clients" },
      { to: "/admin-cases", icon: FileText, label: "Cases" },
      { to: "/admin-documents", icon: FileText, label: "Documents" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
    ];
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
    navTabs = [
      { to: "/ca-dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin-clients", icon: Users, label: "Clients" },
      { to: "/admin-documents", icon: FileText, label: "Documents" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
    ];
  } else if (profile?.role === 'creator') {
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
    navTabs = [
      { to: "/creator-dashboard", icon: Home, label: "Overview", roles: ['creator'] },
      { to: "/creator-contracts", icon: Briefcase, label: "Deals", roles: ['creator'] },
      { to: "/creator-payments", icon: Wallet, label: "Payments", roles: ['creator'] },
      { to: "/creator-content-protection", icon: Shield, label: "Protection", roles: ['creator'] },
      { to: "/partner-program", icon: Sparkles, label: "Partner Program", roles: ['creator'] },
    ];
  } else {
    navTabs = [
      { to: "/client-dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/client-cases", icon: FileText, label: "Cases" },
      { to: "/client-documents", icon: FileText, label: "Documents" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
    ];
  }

  if (!user) {
    return null; // Don't render navbar if not logged in
  }

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full h-16",
        "bg-white/[0.08] backdrop-blur-[40px] border-b border-white/10",
        "shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
      )}
    >
      <div className="container mx-auto px-4 lg:px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Section: Logo + Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link 
              to={dashboardPath} 
              className="flex items-center space-x-2 group transition-all duration-200"
            >
              <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-200 ring-1 ring-blue-500/20 group-hover:ring-blue-500/40">
                <span className="text-sm font-bold text-blue-400">N</span>
              </div>
              <span className="text-base font-semibold text-white hidden sm:inline-block">
                NoticeBazaar
              </span>
            </Link>

            {/* Desktop Navigation Tabs */}
            <NavTabs tabs={navTabs} role={profile?.role || null} />
          </div>

          {/* Right Section: Search, Notifications, Apps Menu */}
          <div className="flex items-center gap-[14px] pr-4 lg:pr-0">
            {/* Search */}
            <SearchBar />

            {/* Notifications */}
            <Notifications />

            {/* Apps Menu (Google-style 9-dots) */}
            <AppsMenu profileRole={profile?.role || null} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

