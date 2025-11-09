"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Briefcase, FileText, CalendarDays, MessageSquare, Activity, CreditCard, LayoutDashboard, Settings, Home, FolderOpen, LogOut, Calculator, ShieldCheck, DollarSign, Bell } from 'lucide-react'; // Import LogOut, Calculator, ShieldCheck, DollarSign, Bell icons
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { profile, isAdmin, isCreator } = useSession(); // Get profile to check role
  const signOutMutation = useSignOut();

  const adminMainNavItems = [
    { to: "/admin-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { to: "/admin-clients", icon: <Users className="h-4 w-4" />, label: "Clients" },
    { to: "/admin-cases", icon: <Briefcase className="h-4 w-4" />, label: "Cases" },
    { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
    { to: "/admin-consultations", icon: <CalendarDays className="h-4 w-4" />, label: "Consultations" },
    { to: "/admin-subscriptions", icon: <CreditCard className="h-4 w-4" />, label: "Subscriptions" },
    { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    { to: "/admin-activity-log", icon: <Activity className="h-4 w-4" />, label: "Activity Log" },
  ];
  const adminProfileSettingsItem = { to: "/admin-profile", icon: <Settings className="h-4 w-4" />, label: "Profile Settings" };

  const clientMainNavItems = [
    { to: "/client-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { to: "/client-subscription", icon: <CreditCard className="h-4 w-4" />, label: "Subscription" },
    { to: "/client-cases", icon: <Briefcase className="h-4 w-4" />, label: "Cases" },
    { to: "/client-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
    { to: "/client-consultations", icon: <CalendarDays className="h-4 w-4" />, label: "Consultations" },
    { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    { to: "/client-activity-log", icon: <Activity className="h-4 w-4" />, label: "Activity Log" },
  ];
  const clientProfileSettingsItem = { to: "/client-profile", icon: <Settings className="h-4 w-4" />, label: "Profile Settings" };

  const caMainNavItems = [
    { to: "/ca-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { to: "/admin-clients", icon: <Users className="h-4 w-4" />, label: "Clients" },
    { to: "/admin-documents", icon: <FileText className="h-4 w-4" />, label: "Documents" },
    { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    { to: "/admin-activity-log", icon: <Activity className="h-4 w-4" />, label: "Activity Log" },
  ];
  const caProfileSettingsItem = { to: "/admin-profile", icon: <Settings className="h-4 w-4" />, label: "Profile Settings" };

  const creatorMainNavItems = [ // New navigation items for Creator
    { to: "/creator-dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { to: "/creator-contracts", icon: <FileText className="h-4 w-4" />, label: "Brand Deals" },
    { to: "/creator-payments", icon: <DollarSign className="h-4 w-4" />, label: "Payments & Recovery" },
    { to: "/creator-content-protection", icon: <ShieldCheck className="h-4 w-4" />, label: "Content Protection" },
    { to: "/creator-tax-compliance", icon: <Calculator className="h-4 w-4" />, label: "Taxes & Compliance" },
    { to: "/messages", icon: <MessageSquare className="h-4 w-4" />, label: "Messages" },
    { to: "/creator-support", icon: <Bell className="h-4 w-4" />, label: "Support" }, // Placeholder for support page
  ];
  const creatorProfileSettingsItem = { to: "/creator-profile", icon: <Settings className="h-4 w-4" />, label: "Profile Settings" };

  let mainNavItems;
  let profileSettingsItem;

  if (profile?.role === 'admin') {
    mainNavItems = adminMainNavItems;
    profileSettingsItem = adminProfileSettingsItem;
  } else if (profile?.role === 'chartered_accountant') {
    mainNavItems = caMainNavItems;
    profileSettingsItem = caProfileSettingsItem;
  } else if (profile?.role === 'creator') { // Conditional for Creator role
    mainNavItems = creatorMainNavItems;
    profileSettingsItem = creatorProfileSettingsItem;
  } else {
    mainNavItems = clientMainNavItems;
    profileSettingsItem = clientProfileSettingsItem;
  }

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  return (
    <div className={cn("flex h-full flex-col space-y-4 border-r border-border bg-sidebar p-4", className)}>
      {/* Main navigation items */}
      <div className="flex-1 space-y-3">
        {mainNavItems.map((item) => (
          <Button
            key={item.to}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            asChild
          >
            <Link to={item.to}>
              <span className="flex items-center">
                <span className="mr-2 h-4 w-4 flex items-center justify-center">{item.icon}</span>
                {item.label}
              </span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Profile Settings and Logout items, pushed to the bottom */}
      <div className="mt-auto space-y-3">
        <Button
          key={profileSettingsItem.to}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <Link to={profileSettingsItem.to}>
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 flex items-center justify-center">{profileSettingsItem.icon}</span>
              {profileSettingsItem.label}
            </span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
          disabled={signOutMutation.isPending}
        >
          <span className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;