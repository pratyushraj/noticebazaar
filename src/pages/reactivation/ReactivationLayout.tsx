import React, { type ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';
import {
  Bot,
  Users,
  Zap as ZapIcon,
  Star,
  Menu,
  X,
  CalendarDays,
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
    label: 'Patients',
    path: '/reactivation/customers',
    icon: Users,
  },
  {
    label: 'Live Scheduler',
    path: '/reactivation/scheduler',
    icon: CalendarDays,
  },
  {
    label: 'AI Receptionist',
    path: '/reactivation/receptionist',
    icon: Bot,
    badge: 'AI',
  },
  {
    label: 'Google Reviews',
    path: '/reactivation/reviews',
    icon: Star,
  },
];

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/reactivation/receptionist': 'AI Receptionist',
  '/reactivation/customers': 'Patients',
  '/reactivation/scheduler': 'Live Scheduler',
  '/reactivation/reviews': 'Google Reviews',
  '/reactivation': 'Patients',
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
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500"
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
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }
          `}
        >
          <Icon
            size={18}
            className={`flex-shrink-0 transition-colors duration-150 ${
              isActive ? 'text-indigo-600' : 'text-current'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { profile } = useSession();
  const activeClinic = profile?.business_name || 'Dental Clinic';

  React.useEffect(() => {
    document.title = `${pageTitle} | Dental CRM`;
  }, [pageTitle]);

  // Close sidebar on route change (for mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 flex flex-col h-full fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0
          transition-transform duration-300 ease-in-out bg-white border-r border-slate-200
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 260,
        }}
      >
        {/* Logo area */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between lg:block">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              {/* Lightning bolt logo mark */}
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <ZapIcon size={14} className="text-indigo-400" />
              </div>
              <span className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
                Dental CRM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider pl-[38px] font-medium">
              Patient records, follow-ups, and chairside notes
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-4 mb-3 h-px bg-slate-200" />

        {/* Navigation */}
        <nav className="flex-1 py-1 overflow-y-auto scrollbar-none">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.path} item={item} />
            ))}
          </div>
        </nav>


      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 bg-white border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            {/* Hamburger button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Page title */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={location.pathname}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="text-[15px] font-semibold text-slate-800 tracking-tight"
              >
                {pageTitle}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Right side chips */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Locked Clinic Branding Chip */}
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.2 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-indigo-500 tracking-widest hidden sm:inline shrink-0">Clinic:</span>
              <span className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 shrink-0 font-sans">
                {activeClinic}
              </span>
            </div>


          </div>
        </header>

        {/* Scrollable content area */}
        <main
          className="flex-1 overflow-y-auto bg-[#F1F5F9] p-4 sm:p-6"
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
