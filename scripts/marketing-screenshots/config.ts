/**
 * Screenshot Capture Config
 * Centralized config for all marketing screenshot capture settings
 */

export const SCREENSHOT_CONFIG = {
  // Output directory (relative to project root)
  outputDir: 'marketing-screenshots',

  // Base URL for the running dev server
  baseUrl: process.env.SCREENSHOT_BASE_URL || 'http://localhost:8080',

  // Viewport settings for different use cases
  viewports: {
    // Standard marketing / ads (1080p)
    marketing: { width: 1920, height: 1080 },
    // Social media story/ad format
    story: { width: 1080, height: 1920 },
    // Presentation slides
    slide: { width: 1280, height: 720 },
    // Mobile
    mobile: { width: 390, height: 844 },
    // Tablet
    tablet: { width: 768, height: 1024 },
  },

  // Screenshot categories
  categories: {
    landing: 'landing',
    dashboard: 'dashboard',
    states: 'states',
    components: 'components',
  },

  // Device frame overlays (optional post-processing)
  deviceFrames: ['iphone', 'macbook', 'browser'] as const,
};

export type DeviceType = keyof typeof SCREENSHOT_CONFIG['viewports'];
export type CategoryType = keyof typeof SCREENSHOT_CONFIG['categories'];
