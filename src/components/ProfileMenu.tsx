"use client";

import React from 'react';
import { Link } from 'react-router-dom';
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
import { LogOut, User as UserIcon, Settings, HelpCircle, UserPlus } from 'lucide-react';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { toast } from 'sonner';

interface ProfileMenuProps {
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
  user: {
    email?: string | null;
  } | null;
  profilePath: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ profile, user, profilePath }) => {
  const signOutMutation = useSignOut();

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full p-0 hover:bg-accent/50 transition-all"
        >
          <Avatar className="h-9 w-9 ring-2 ring-border/50 hover:ring-primary/50 transition-all">
            <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt={profile?.first_name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(profile?.first_name, profile?.last_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-card/95 backdrop-blur-sm border-border/50 shadow-lg" 
        align="end"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent/50">
          <Link to={profilePath} className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile / My Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent/50">
          <Link to={profilePath} className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent/50">
          <Link to="/messages" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Support / Help</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={async () => {
            const referText = `Join NoticeBazaar - Your complete legal and financial compliance platform! ${window.location.origin}`;
            try {
              if (navigator.share) {
                await navigator.share({
                  title: 'Join NoticeBazaar',
                  text: referText,
                  url: window.location.origin,
                });
                toast.success('Referral link shared!');
              } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(referText);
                toast.success('Referral link copied to clipboard!');
              }
            } catch (error: any) {
              // User cancelled share or error occurred
              if (error.name !== 'AbortError') {
                try {
                  await navigator.clipboard.writeText(referText);
                  toast.success('Referral link copied to clipboard!');
                } catch (clipboardError) {
                  toast.error('Failed to copy referral link');
                }
              }
            }
          }}
          className="cursor-pointer hover:bg-accent/50"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Refer a Friend</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
          onClick={handleLogout} 
          disabled={signOutMutation.isPending} 
          className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out / Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;

