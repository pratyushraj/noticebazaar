"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Briefcase, FileText, CalendarDays, MessageSquare, Activity, CreditCard, LayoutDashboard, Settings, Home, FolderOpen, LogOut, Calculator } from 'lucide-react'; // Import LogOut and Calculator icons
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { profile, isAdmin } = useSession(); // Get profile to check role
  const signOutMutation = useSignOut();

  const adminMainNavItems = [
    { to: "/admin-dashboard", icon: '🏠', label: "Dashboard" },
    { to: "/admin-clients", icon: '👥', label: "Clients" },
    { to: "/admin-cases", icon: '💼', label: "Cases" },
    { to: "/admin-documents", icon: '📁', label: "Documents" },
    { to: "/admin-consultations", icon: '📅', label: "Consultations" },
    { to: "/admin-subscriptions", icon: '💳', label: "Subscriptions" },
    { to: "/messages", icon: '💬', label: "Messages" },
    { to: "/admin-activity-log", icon: '⚡', label: "Activity Log" },
  ];
  const adminProfileSettingsItem = { to: "/admin-profile", icon: '⚙️', label: "Profile Settings" };

  const clientMainNavItems = [
    { to: "/client-dashboard", icon: '🏠', label: "Dashboard" },
    { to: "/client-subscription", icon: '💳', label: "Subscription" }, // Changed from "My Subscription"
    { to: "/client-cases", icon: '💼', label: "Cases" }, // Changed from "My Cases"
    { to: "/client-documents", icon: '📁', label: "Documents" }, // Changed from "My Documents"
    { to: "/client-consultations", icon: '📅', label: "Consultations" }, // Changed from "My Consultations"
    { to: "/messages", icon: '💬', label: "Messages" },
    { to: "/client-activity-log", icon: '⚡', label: "Activity Log" },
  ];
  const clientProfileSettingsItem = { to: "/client-profile", icon: '⚙️', label: "Profile Settings" };

  const caMainNavItems = [ // New navigation items for Chartered Accountant
    { to: "/ca-dashboard", icon: '🏠', label: "Dashboard" },
    { to: "/admin-clients", icon: '👥', label: "Clients" }, // CA can also manage clients
    { to: "/admin-documents", icon: '📁', label: "Documents" }, // CA can also manage documents
    { to: "/messages", icon: '💬', label: "Messages" },
    { to: "/admin-activity-log", icon: '⚡', label: "Activity Log" }, // CA can view activity log
  ];
  const caProfileSettingsItem = { to: "/admin-profile", icon: '⚙️', label: "Profile Settings" }; // CA uses admin profile settings for now

  let mainNavItems;
  let profileSettingsItem;

  if (profile?.role === 'admin') {
    mainNavItems = adminMainNavItems;
    profileSettingsItem = adminProfileSettingsItem;
  } else if (profile?.role === 'chartered_accountant') { // Conditional for CA role
    mainNavItems = caMainNavItems;
    profileSettingsItem = caProfileSettingsItem;
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