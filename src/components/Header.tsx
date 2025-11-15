"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Search, Bell, Menu, LayoutDashboard, FileText, DollarSign, ShieldCheck, Calculator, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProfileMenu from '@/components/ProfileMenu';
import MobileMenu from '@/components/MobileMenu';

const Header = () => {
  const { user, profile } = useSession();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine paths and nav items based on role
  let dashboardPath = "/client-dashboard";
  let profilePath = "/client-profile";
  let mainNavItems: Array<{ to: string; icon: React.ReactNode; label: string }> = [];

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
    mainNavItems = [
      { to: "/admin-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/admin-clients", icon: <FileText className="h-4 w-4" />, label: "Clients" },
      { to: "/admin-cases", icon: <FileText className="h-4 w-4" />, label: "Cases" },
      { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
    mainNavItems = [
      { to: "/ca-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/admin-clients", icon: <FileText className="h-4 w-4" />, label: "Clients" },
      { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else if (profile?.role === 'creator') {
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
    mainNavItems = [
      { to: "/creator-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/creator-contracts", icon: <FileText className="h-4 w-4" />, label: "Brand Deals" },
      { to: "/creator-payments", icon: <DollarSign className="h-4 w-4" />, label: "Payments & Recovery" },
      { to: "/creator-content-protection", icon: <ShieldCheck className="h-4 w-4" />, label: "Content Protection" },
      { to: "/creator-tax-compliance", icon: <Calculator className="h-4 w-4" />, label: "Taxes" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else {
    mainNavItems = [
      { to: "/client-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/client-cases", icon: <FileText className="h-4 w-4" />, label: "Cases" },
      { to: "/client-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Left Section: Logo + Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link to={dashboardPath} className="flex items-center space-x-2 group">
              <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <span className="text-xs font-bold text-primary">N</span>
              </div>
              <span className="text-base font-semibold text-foreground hidden sm:inline-block">
                NoticeBazaar
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden lg:flex items-center space-x-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                      isActive(item.to)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive(item.to) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right Section: Search, Notifications, Profile */}
          {user && (
            <div className="flex items-center space-x-2">
              {/* Search Icon */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Notification Bell */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
              </Button>

              {/* Profile Menu */}
              <ProfileMenu 
                profile={profile} 
                user={user} 
                profilePath={profilePath}
              />

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {user && (
        <MobileMenu
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          navItems={mainNavItems}
          profilePath={profilePath}
          isActive={isActive}
        />
      )}
    </header>
  );
};

export default Header;