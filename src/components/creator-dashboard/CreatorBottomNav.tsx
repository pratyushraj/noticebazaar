"use client";

import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Link2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';

const navItems = [
  { to: "/creator-dashboard", icon: LayoutDashboard, label: "Home", matchPaths: ["/creator-dashboard"] },
  { to: "/creator-dashboard?tab=deals", icon: Briefcase, label: "Deals", matchPaths: ["creator-dashboard", "deals"] },
  { to: "/creator-dashboard?tab=payments", icon: Wallet, label: "Payments", matchPaths: ["creator-dashboard", "payments"] },
  { to: "/creator-dashboard?tab=deals&subtab=pending", icon: Link2, label: "Requests", matchPaths: ["creator-dashboard", "collab"] },
  { to: "/creator-dashboard?tab=profile", icon: User, label: "Profile", matchPaths: ["creator-dashboard", "profile"] },
];

const CreatorBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isKeyboardVisible } = useKeyboardAware();

  const isActive = (item: typeof navItems[0]) =>
    item.matchPaths.some(path => location.pathname.startsWith(path));

  const handleClick = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    navigate(to);
  };

  const content = (
    <div
      data-bottom-nav="true"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-xl border-t border-border",
        "transition-transform duration-300",
        isKeyboardVisible && "translate-y-full"
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <nav
        className="flex justify-around items-center h-[70px] min-h-[70px]"
        role="navigation"
        aria-label="Bottom navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={(e) => handleClick(e, item.to)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                "text-[11px] font-medium transition-colors duration-150",
                "min-w-[68px] min-h-[60px] px-1",
                "focus-visible:outline-none focus-visible:bg-secondary rounded-lg",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              {/* Active indicator dot */}
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-150",
                    active && "text-primary"
                  )}
                />
                {active && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(active && "text-primary")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
};

export default CreatorBottomNav;
