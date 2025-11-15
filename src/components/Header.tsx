"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LogOut, User as UserIcon, Settings, FileText, MessageSquare, Briefcase, Users, CalendarDays, Activity, CreditCard, FolderOpen, Bell, Calculator, LayoutDashboard, Menu, X, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';

const Header = () => {
  const { user, profile, isAdmin, isCreator } = useSession();
  const signOutMutation = useSignOut();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  let dashboardPath = "/client-dashboard";
  let profilePath = "/client-profile";
  let mainNavItems: Array<{ to: string; icon: React.ReactNode; label: string }> = [];

  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
    mainNavItems = [
      { to: "/admin-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/admin-clients", icon: <Users className="h-4 w-4" />, label: "Clients" },
      { to: "/admin-cases", icon: <Briefcase className="h-4 w-4" />, label: "Cases" },
      { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/admin-consultations", icon: <CalendarDays className="h-4 w-4" />, label: "Consultations" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else if (profile?.role === 'chartered_accountant') {
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile";
    mainNavItems = [
      { to: "/ca-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/admin-clients", icon: <Users className="h-4 w-4" />, label: "Clients" },
      { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else if (profile?.role === 'creator') {
    dashboardPath = "/creator-dashboard";
    profilePath = "/creator-profile";
    mainNavItems = [
      { to: "/creator-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/creator-contracts", icon: <FileText className="h-4 w-4" />, label: "Brand Deals" },
      { to: "/creator-payments", icon: <DollarSign className="h-4 w-4" />, label: "Payments" },
      { to: "/creator-content-protection", icon: <ShieldCheck className="h-4 w-4" />, label: "Protection" },
      { to: "/creator-tax-compliance", icon: <Calculator className="h-4 w-4" />, label: "Taxes" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  } else {
    mainNavItems = [
      { to: "/client-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
      { to: "/client-subscription", icon: <CreditCard className="h-4 w-4" />, label: "Subscription" },
      { to: "/client-cases", icon: <Briefcase className="h-4 w-4" />, label: "Cases" },
      { to: "/client-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
      { to: "/client-consultations", icon: <CalendarDays className="h-4 w-4" />, label: "Consultations" },
      { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    ];
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              NoticeBazaar
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <>
              <nav className="hidden md:flex items-center space-x-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.to)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Right side actions */}
              <div className="flex items-center space-x-2">
                {/* Notification Bell */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt={profile?.first_name || "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(profile?.first_name, profile?.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={profilePath} className="flex items-center cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === 'client' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/client-subscription" className="flex items-center cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Subscription</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/client-activity-log" className="flex items-center cursor-pointer">
                            <Activity className="mr-2 h-4 w-4" />
                            <span>Activity Log</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {(profile?.role === 'chartered_accountant' || profile?.role === 'admin') && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin-clients" className="flex items-center cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            <span>Manage Clients</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin-documents" className="flex items-center cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Manage Documents</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to={profilePath} className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={signOutMutation.isPending} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-col space-y-2">
            {user && mainNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pt-4 border-t">
              <Link
                to={profilePath}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                disabled={signOutMutation.isPending}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;