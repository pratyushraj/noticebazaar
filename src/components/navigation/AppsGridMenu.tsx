/**
 * Premium 9-Dot Grid Menu (iOS-style)
 * Replaces traditional navigation with a modern grid interface
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  Wallet, 
  Shield, 
  MessageSquare,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  color: string;
  bgColor: string;
}

const apps: AppItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    path: '/creator-dashboard',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: Briefcase,
    path: '/creator-contracts',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: Wallet,
    path: '/creator-payments',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    id: 'protection',
    label: 'Protection',
    icon: Shield,
    path: '/creator-content-protection',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/messages',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    path: '/calendar',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/creator-analytics',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
  },
  {
    id: 'contracts',
    label: 'Contracts',
    icon: FileText,
    path: '/contract-upload',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/creator-profile',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
];

interface AppsGridMenuProps {
  trigger?: React.ReactNode;
  className?: string;
}

export const AppsGridMenu = ({ trigger, className }: AppsGridMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAppClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className={className}>
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95",
            className
          )}
          aria-label="Open apps menu"
        >
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none"
            className="text-white"
          >
            <circle cx="4" cy="4" r="2.2" fill="currentColor"/>
            <circle cx="12" cy="4" r="2.2" fill="currentColor"/>
            <circle cx="20" cy="4" r="2.2" fill="currentColor"/>
            <circle cx="4" cy="12" r="2.2" fill="currentColor"/>
            <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
            <circle cx="20" cy="12" r="2.2" fill="currentColor"/>
            <circle cx="4" cy="20" r="2.2" fill="currentColor"/>
            <circle cx="12" cy="20" r="2.2" fill="currentColor"/>
            <circle cx="20" cy="20" r="2.2" fill="currentColor"/>
          </svg>
        </button>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-[#1E263A] via-[#182133] to-[#121722] border-t border-white/10 rounded-t-3xl shadow-2xl"
              style={{ 
                paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`,
                maxHeight: '80vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Apps</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Grid */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                <div className="grid grid-cols-3 gap-4">
                  {apps.map((app) => {
                    const Icon = app.icon;
                    const active = isActive(app.path);
                    
                    return (
                      <motion.button
                        key={app.id}
                        onClick={() => handleAppClick(app.path)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all",
                          active 
                            ? "bg-white/10 border-2 border-white/20" 
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        )}
                        aria-label={app.label}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          app.bgColor,
                          active && "ring-2 ring-white/30"
                        )}>
                          <Icon className={cn("w-6 h-6", app.color)} />
                        </div>
                        <span className={cn(
                          "text-xs font-medium text-center",
                          active ? "text-white" : "text-white/70"
                        )}>
                          {app.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

