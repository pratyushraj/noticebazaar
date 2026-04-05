"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSignOut } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

interface NavTab {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

interface MobileMenuProps {
  tabs: NavTab[];
  profilePath: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ tabs, profilePath }) => {
  const location = useLocation();
  const { profile, user } = useSession();
  const signOutMutation = useSignOut();
  const [open, setOpen] = React.useState(false);

  const isActive = (path: string) =>
    path === '/creator-dashboard'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleTabs = tabs.filter(tab =>
    !tab.roles || tab.roles.includes(profile?.role || '')
  );

  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
    setOpen(false);
  };

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User';
  const email = user?.email || '';
  const role = profile?.role === 'creator' ? 'Creator' : profile?.role === 'admin' ? 'Admin' : 'Client';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden w-9 h-9 rounded-xl hover:bg-secondary active:scale-95 transition-all duration-150 flex items-center justify-center"
          aria-label="Open menu"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
            <div className="h-px bg-foreground w-full rounded-full" />
            <div className="h-px bg-foreground w-full rounded-full" />
            <div className="h-px bg-foreground w-2/3 rounded-full ml-auto" />
          </div>
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85%] sm:w-80 bg-card border-r border-border p-0 flex flex-col rounded-r-2xl"
      >
        {/* Profile Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-11 w-11 ring-2 ring-border rounded-xl">
              <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt={fullName} />
              <AvatarFallback className="bg-secondary text-muted-foreground text-sm font-medium">
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{fullName}</h3>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              profile?.role === 'creator'
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground"
            )}>
              {role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </Link>
            );
          })}

          <div className="h-px bg-border my-3" />

          <Link
            to={profilePath}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5",
              isActive(profilePath)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="flex-1">Settings</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-150",
              "text-destructive hover:bg-destructive/10 disabled:opacity-50"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{signOutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
