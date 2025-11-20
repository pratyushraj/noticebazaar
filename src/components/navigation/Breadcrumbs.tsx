"use client";

import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateBreadcrumbs } from '@/lib/utils/navigation';

interface BreadcrumbsProps {
  className?: string;
  showHome?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className, showHome = true }) => {
  const location = useLocation();
  const searchParams = useSearchParams();
  const breadcrumbs = generateBreadcrumbs(location.pathname, searchParams);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if we're at the root
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      {showHome && (
        <>
          <Link
            to="/creator-dashboard"
            className="text-white/60 hover:text-[#F472B6] transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-white/40" />
        </>
      )}
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;

        return (
          <React.Fragment key={index}>
            {crumb.path && !isLast ? (
              <Link
                to={crumb.path}
                className="text-white/60 hover:text-[#F472B6] transition-colors flex items-center gap-1"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{crumb.label}</span>
              </Link>
            ) : (
              <span className="text-white flex items-center gap-1">
                {Icon && <Icon className="h-4 w-4" />}
                <span className="font-medium">{crumb.label}</span>
              </span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4 text-white/40" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

