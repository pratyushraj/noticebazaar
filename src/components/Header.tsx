"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { LogOut, User as UserIcon, Settings, FileText, MessageSquare, Briefcase, Users, CalendarDays, Activity, CreditCard, FolderOpen, Bell, Calculator } from 'lucide-react'; // Added Calculator icon
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

const Header = () => {
  const { user, profile, isAdmin } = useSession();
  const signOutMutation = useSignOut();

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  let dashboardPath = "/client-dashboard";
  let profilePath = "/client-profile";
  if (profile?.role === 'admin') {
    dashboardPath = "/admin-dashboard";
    profilePath = "/admin-profile";
  } else if (profile?.role === 'chartered_accountant') { // New: CA dashboard and profile
    dashboardPath = "/ca-dashboard";
    profilePath = "/admin-profile"; // CA uses admin profile settings for now
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between py-4 px-3 md:px-4"> {/* Changed container to flex and added responsive padding */}
        <Link to={dashboardPath} className="text-2xl font-bold text-primary">
          NoticeBazaar
        </Link>
        <nav className="flex items-center space-x-4">
          {user && (
            <>
              {/* Notification Bell Icon */}
              <Button variant="ghost" size="icon" className="relative">
                <span>
                  <Bell className="h-5 w-5 text-foreground" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-xs text-white items-center justify-center"></span>
                  </span>
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt={profile?.first_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card text-card-foreground border-border" align="end">
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
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                    <Link to={profilePath} className="flex items-center">
                      <span>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'client' && ( // Only show client-specific items for clients
                    <>
                      <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                        <Link to="/client-subscription" className="flex items-center">
                          <span>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Subscription</span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                        <Link to="/client-activity-log" className="flex items-center">
                          <span>
                            <Activity className="mr-2 h-4 w-4" />
                            <span>Activity Log</span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {profile?.role === 'chartered_accountant' && ( // New: CA-specific items
                    <>
                      <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                        <Link to="/admin-clients" className="flex items-center">
                          <span>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Manage Clients</span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                        <Link to="/admin-documents" className="flex items-center">
                          <span>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Manage Documents</span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild className="hover:bg-accent hover:text-accent-foreground">
                    <Link to={profilePath} className="flex items-center">
                      <span>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild onClick={handleLogout} disabled={signOutMutation.isPending} className="hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-center w-full">
                      <span>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;