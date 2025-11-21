/**
 * Navigation utility functions for the creator dashboard
 */

export type DashboardTab = 'overview' | 'deals' | 'payments' | 'protection';

export const DASHBOARD_TABS: DashboardTab[] = ['overview', 'deals', 'payments', 'protection'];

export const isValidTab = (tab: string | null): tab is DashboardTab => {
  return tab !== null && DASHBOARD_TABS.includes(tab as DashboardTab);
};

/**
 * Get the default tab if the provided tab is invalid
 */
export const getDefaultTab = (tab: string | null): DashboardTab => {
  return isValidTab(tab) ? tab : 'overview';
};

/**
 * Build URL with tab parameter
 */
export const buildDashboardUrl = (tab: DashboardTab, basePath: string = '/creator-dashboard'): string => {
  return `${basePath}?tab=${tab}`;
};

/**
 * Get tab from URL search params
 */
export const getTabFromSearchParams = (searchParams: URLSearchParams): DashboardTab => {
  const tab = searchParams.get('tab');
  return getDefaultTab(tab);
};

/**
 * Navigation paths for creator dashboard
 */
export const CREATOR_ROUTES = {
  dashboard: '/creator-dashboard',
  contracts: '/creator-contracts',
  payments: '/creator-payments',
  protection: '/creator-content-protection',
  profile: '/creator-profile',
  insights: '/insights',
  messages: '/messages',
} as const;

/**
 * Get route name from pathname
 */
export const getRouteName = (pathname: string): string => {
  if (pathname.startsWith(CREATOR_ROUTES.dashboard)) return 'Dashboard';
  if (pathname.startsWith(CREATOR_ROUTES.contracts)) return 'Deals';
  if (pathname.startsWith(CREATOR_ROUTES.payments)) return 'Payments';
  if (pathname.startsWith(CREATOR_ROUTES.protection)) return 'Protection';
  if (pathname.startsWith(CREATOR_ROUTES.profile)) return 'Profile';
  if (pathname.startsWith(CREATOR_ROUTES.insights)) return 'Insights';
  if (pathname.startsWith(CREATOR_ROUTES.messages)) return 'Messages';
  return 'Dashboard';
};

/**
 * Breadcrumb item type
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Generate breadcrumbs for creator routes
 */
export const generateBreadcrumbs = (pathname: string, searchParams?: URLSearchParams | null): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: CREATOR_ROUTES.dashboard },
  ];

  if (pathname.startsWith(CREATOR_ROUTES.dashboard)) {
    // Safely get tab from searchParams, handling case where searchParams might not be a URLSearchParams object
    let tab: string | null = null;
    try {
      // Double-check that searchParams is actually a URLSearchParams instance
      if (searchParams && 
          typeof searchParams === 'object' && 
          searchParams instanceof URLSearchParams) {
        tab = searchParams.get('tab');
      } else if (searchParams && 
                 typeof searchParams === 'object' && 
                 typeof (searchParams as any).get === 'function') {
        // Fallback for objects that have a get method but aren't URLSearchParams
        tab = (searchParams as any).get('tab');
      }
    } catch (e) {
      // Silently handle any errors getting the tab
      tab = null;
    }
    if (tab && tab !== 'overview') {
      breadcrumbs.push({
        label: tab.charAt(0).toUpperCase() + tab.slice(1),
      });
    }
  } else if (pathname.startsWith(CREATOR_ROUTES.contracts)) {
    breadcrumbs.push({ label: 'Deals', path: CREATOR_ROUTES.contracts });
  } else if (pathname.startsWith(CREATOR_ROUTES.payments)) {
    breadcrumbs.push({ label: 'Payments', path: CREATOR_ROUTES.payments });
  } else if (pathname.startsWith(CREATOR_ROUTES.protection)) {
    breadcrumbs.push({ label: 'Protection', path: CREATOR_ROUTES.protection });
  }

  return breadcrumbs;
};

