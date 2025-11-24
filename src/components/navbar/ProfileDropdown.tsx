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
import { User, Settings, LogOut, Sparkles, Fingerprint } from 'lucide-react';
import { useSignOut } from '@/lib/hooks/useAuth';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { useSession } from '@/contexts/SessionContext';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BiometricLogin from '@/components/auth/BiometricLogin';
import { toast } from 'sonner';

interface ProfileDropdownProps {
  profilePath: string;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profilePath }) => {
  const { profile, user } = useSession();
  const signOutMutation = useSignOut();
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false);

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  const handlePasskeyRegisterSuccess = () => {
    toast.success('Passkey registered! You can now use Face ID to sign in.');
    setShowPasskeyDialog(false);
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
        className="w-56 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0C] backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
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

        <DropdownMenuItem 
          onClick={() => setShowPasskeyDialog(true)}
          className="cursor-pointer px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <Fingerprint className="mr-3 h-4 w-4 text-white/60" />
          <span className="text-[15px] text-white/90">Register Passkey</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5 my-1" />
        
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={signOutMutation.isPending}
          className="cursor-pointer px-3 py-2.5 text-red-400 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 active:bg-red-500/15 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-[15px]">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Passkey Registration Dialog */}
      <Dialog open={showPasskeyDialog} onOpenChange={setShowPasskeyDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#0F121A]/95 backdrop-blur-xl border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Register Passkey</DialogTitle>
            <DialogDescription className="text-gray-400">
              Register a passkey for faster, more secure sign-ins using Face ID or Touch ID.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <BiometricLogin 
              mode="register"
              onSuccess={handlePasskeyRegisterSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
};

export default ProfileDropdown;

