/**
 * Route classification utilities.
 * Centralizes all route-matching logic so ProtectedRoute stays readable.
 */

const CREATOR_PREFIXES = [
  '/creator-dashboard',
  '/creator-contracts',
  '/creator-payments',
  '/creator-content-protection',
  '/messages',
  '/calendar',
  '/create-deal',
  '/payment',
  '/deal',
  '/contract-upload',
  '/contract-analyzer',
  '/contract-comparison',
  '/contract-protection',
  '/rate-calculator',
  '/ai-pitch-generator',
  '/creator-profile',
  '/creator-analytics',
  '/brand-directory',
  '/brands',
];

const ONBOARDING_PREFIXES = [
  '/creator-onboarding',
  '/creator-profile',
  '/collab/',
];

/** Check if a path matches any of the given prefixes */
function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some(p =>
    p.endsWith('/') ? path.startsWith(p) : (path === p || path.startsWith(p + '/'))
  );
}

export const routes = {
  isCreator: (path: string) => matchesPrefix(path, CREATOR_PREFIXES),
  isOnboarding: (path: string) => path === '/creator-onboarding',
  isAdmin: (path: string) => path.startsWith('/admin-'),
  isCA: (path: string) => path.startsWith('/ca-dashboard'),
  isLawyer: (path: string) => path.startsWith('/lawyer-dashboard'),
  isAdvisor: (path: string) => path.startsWith('/advisor-dashboard'),
  isClient: (path: string) => path.startsWith('/client-'),
  isBrand: (path: string) => path.startsWith('/brand-dashboard'),
  isAuth: (path: string) => path === '/login' || path === '/signup' || path === '/reset-password',
  isRoot: (path: string) => path === '/',
  isCollabBypass: (path: string, handle: string) => {
    if (matchesPrefix(path, ONBOARDING_PREFIXES)) return true;
    if (handle && path === `/${handle}`) return true;
    return false;
  },
  isDemoOverride: (path: string) =>
    path === '/creator-dashboard' || path === '/demo-dashboard',
  isFullScreen: (path: string) =>
    path === '/creator-dashboard' || path === '/brand-dashboard',
};
