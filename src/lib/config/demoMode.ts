/**
 * Demo Mode Configuration
 * 
 * Enables demo-ready features for investor presentations:
 * - Enforces skeleton-on-load for all pages
 * - Injects test data for empty dashboards
 * - Smoothly animates charts when loaded
 * - Shows premium transitions system-wide
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || false;

export const demoModeConfig = {
  enabled: DEMO_MODE,
  
  // Force skeleton loading states
  forceSkeletons: DEMO_MODE,
  
  // Inject test data for empty states
  injectTestData: DEMO_MODE,
  
  // Enable smooth chart animations
  animateCharts: DEMO_MODE,
  
  // Enable premium transitions
  premiumTransitions: DEMO_MODE,
  
  // Show demo watermark (optional)
  showWatermark: false,
  
  // Auto-advance demo flows
  autoAdvance: false,
} as const;

export const isDemoMode = () => demoModeConfig.enabled;

