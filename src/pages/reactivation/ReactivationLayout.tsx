import React, { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  BarChart3,
  Zap,
  Zap as ZapIcon,
  MessageCircle,
  Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

interface ReactivationLayoutProps {
  children: ReactNode;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: 'AI Receptionist',
    path: '/reactivation/receptionist',
    icon: Bot,
    badge: 'CORE',
  },
  {
    label: 'Dashboard',
    path: '/reactivation',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Customers',
    path: '/reactivation/customers',
    icon: Users,
  },
  {
    label: 'Segments',
    path: '/reactivation/segments',
    icon: Layers,
  },
  {
    label: 'Campaigns',
    path: '/reactivation/campaigns',
    icon: Megaphone,
  },
  {
    label: 'Analytics',
    path: '/reactivation/analytics',
    icon: BarChart3,
  },
  {
    label: 'Automations',
    path: '/reactivation/automations',
    icon: Zap,
  },
  {
    label: 'Google Reviews',
    path: '/reactivation/reviews',
    icon: Star,
    badge: 'AI',
  },
];

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/reactivation': 'Dashboard',
  '/reactivation/receptionist': 'AI Receptionist',
  '/reactivation/customers': 'Customers',
  '/reactivation/segments': 'Segments',
  '/reactivation/campaigns': 'Campaigns',
  '/reactivation/analytics': 'Analytics',
  '/reactivation/automations': 'Automations',
  '/reactivation/reviews': 'Google Reviews',
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

const SidebarNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const location = useLocation();
  const isActive = item.exact
    ? location.pathname === item.path
    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className="block"
    >
      <motion.div
        className="relative"
        whileHover={{ x: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Active left accent bar */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="nav-accent"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </AnimatePresence>

        <div
          className={`
            flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer select-none
            transition-all duration-150
            ${isActive
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
            }
          `}
        >
          <Icon
            size={18}
            className={`flex-shrink-0 transition-colors duration-150 ${
              isActive ? 'text-indigo-400' : 'text-current'
            }`}
          />
          <span className="text-[13px] font-medium tracking-wide flex-1 leading-none">
            {item.label}
          </span>
          {item.badge && (
            <span
              className={`
                text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded
                ${isActive
                  ? 'bg-indigo-500/40 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/[0.06] text-white/30 border border-white/10'
                }
              `}
            >
              {item.badge}
            </span>
          )}
        </div>
      </motion.div>
    </NavLink>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────

const ReactivationLayout: React.FC<ReactivationLayoutProps> = ({ children }) => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'AI Reactivation';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080C14' }}>
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col h-full"
        style={{
          width: 260,
          background: '#0A0F1C',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo area */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            {/* Lightning bolt logo mark */}
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <ZapIcon size={14} className="text-indigo-400" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight leading-none">
              AI Reactivation
            </span>
          </div>
          <p className="text-[10px] text-white/25 tracking-wider pl-[38px] font-medium">
            Powered by CreatorArmour
          </p>
        </div>

        {/* Separator */}
        <div className="mx-4 mb-3 h-px bg-white/[0.05]" />

        {/* Navigation */}
        <nav className="flex-1 py-1 overflow-y-auto scrollbar-none">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.path} item={item} />
            ))}
          </div>
        </nav>

        {/* Separator */}
        <div className="mx-4 h-px bg-white/[0.05]" />

        {/* AI Status indicator */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
            {/* Pulsing green dot */}
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-emerald-400 leading-none">
                Receptionist Active
              </span>
              <span className="text-[9px] text-emerald-500/60 font-medium tracking-wide leading-none">
                AI Status
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 h-14"
          style={{
            background: 'rgba(10,15,28,0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Page title */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={location.pathname}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="text-[15px] font-semibold text-white tracking-tight"
            >
              {pageTitle}
            </motion.h1>
          </AnimatePresence>

          {/* Right side chips */}
          <div className="flex items-center gap-3">
            {/* WhatsApp connection chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08]">
              <div className="relative flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
              </div>
              <MessageCircle size={12} className="text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-wide whitespace-nowrap">
                WhatsApp Connected
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: '#080C14', padding: 24 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ReactivationLayout;
