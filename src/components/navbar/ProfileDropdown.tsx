"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, Sparkles, Loader2 } from 'lucide-react';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { useSession } from '@/contexts/SessionContext';

interface ProfileDropdownProps {
  profilePath: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profilePath }) => {
  const { profile } = useSession();
  const signOutMutation = useSignOut();

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  const isCreator = profile?.role === 'creator';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 hover:bg-white/5 transition-all duration-200"
        >
          <Avatar className="h-9 w-9 ring-2 ring-white/10 hover:ring-blue-500/50 transition-all">
            <AvatarImage 
              src={profile?.avatar_url || DEFAULT_AVATAR_URL} 
              alt={profile?.first_name || "User"} 
            />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-medium">
              {getInitials(profile?.first_name || null, profile?.last_name || null)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-gradient-to-br from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#3B82F6]/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
        align="end"
      >
        <DropdownMenuLabel className="font-normal px-3 py-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-white">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs leading-none text-white/50 truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        
        <DropdownMenuItem asChild className="cursor-pointer px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors">
          <Link to={profilePath} className="flex items-center w-full">
            <User className="mr-3 h-4 w-4 text-white/60" />
            <span className="text-[15px] text-white/90">View Profile</span>
          </Link>
        </DropdownMenuItem>

        {isCreator && (
          <DropdownMenuItem 
            asChild
            className="cursor-pointer px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <Link to="/partner-program" className="flex items-center w-full">
              <Sparkles className="mr-3 h-4 w-4 text-white/60" />
              <span className="text-[15px] text-white/90">Partner Program</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="cursor-pointer px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors">
          <Link to={profilePath} className="flex items-center w-full">
            <Settings className="mr-3 h-4 w-4 text-white/60" />
            <span className="text-[15px] text-white/90">Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5 my-1" />
        
        <DropdownMenuItem
          onClick={async () => {
            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(30);
            }
            
            // Analytics tracking
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'logout', {
                event_category: 'engagement',
                event_label: 'user_logout',
                method: 'profile_dropdown'
              });
            }
            
            await handleLogout();
          }}
          disabled={signOutMutation.isPending}
          className="cursor-pointer px-3 py-2.5 text-red-400 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 active:bg-red-500/15 transition-colors min-h-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-400/50"
          aria-label="Log out of your account"
        >
          {signOutMutation.isPending ? (
            <>
              <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              <span className="text-[15px]">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-[15px]">Logout</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;

