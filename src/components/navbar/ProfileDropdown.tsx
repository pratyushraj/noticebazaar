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
import { User, Settings, LogOut, Sparkles } from 'lucide-react';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { useSession } from '@/contexts/SessionContext';

interface ProfileDropdownProps {
  profilePath: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profilePath }) => {
  const { profile, user } = useSession();
  const navigate = useNavigate();
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
              {getInitials(profile?.first_name, profile?.last_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-[#0F121A]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl"
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs leading-none text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5">
          <Link to={profilePath} className="flex items-center">
            <User className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-gray-300">View Profile</span>
          </Link>
        </DropdownMenuItem>

        {isCreator && (
          <DropdownMenuItem 
            asChild
            className="cursor-pointer hover:bg-white/5"
          >
            <Link to="/partner-program" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-gray-400" />
              <span className="text-gray-300">Partner Program</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5">
          <Link to={profilePath} className="flex items-center">
            <Settings className="mr-2 h-4 w-4 text-gray-400" />
            <span className="text-gray-300">Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={signOutMutation.isPending}
          className="cursor-pointer text-red-400 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;

