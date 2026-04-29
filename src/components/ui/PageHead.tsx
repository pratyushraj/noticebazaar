import { useEffect } from 'react';

interface PageHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'Creator Armour - Close Brand Deals Without Instagram DMs';
const DEFAULT_DESCRIPTION = 'The smart platform for creators to manage collaborations, negotiate rates, and get paid faster. Stop chasing brand deals - let them come to you.';
const DEFAULT_KEYWORDS = ['creator economy', 'brand deals', 'influencer marketing', 'creator tools', 'collaboration platform', 'influencer rates', 'brand collaboration'];
const DEFAULT_OG_IMAGE = 'https://creatorarmour.com/og-image.png';

export function PageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false
}: PageHeadProps) {
  const fullTitle = title ? `${title} | Creator Armour` : DEFAULT_TITLE;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));
    
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:site_name', 'Creator Armour', true);
    updateMeta('og:locale', 'en_IN', true);
    
    if (canonicalUrl) {
      updateMeta('og:url', canonicalUrl, true);
    }

    // Twitter Card tags
    updateMeta('twitter:card', twitterCard);
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);
    updateMeta('twitter:site', '@creatorarmour');

    // Cleanup function - restore defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
      updateMeta('description', DEFAULT_DESCRIPTION);
    };
  }, [fullTitle, description, keywords, canonicalUrl, ogImage, ogType, twitterCard, noIndex]);

  return null;
}

// Preset configurations for common pages
export const pageHeadPresets = {
  home: {
    title: undefined,
    description: DEFAULT_DESCRIPTION,
    ogType: 'website' as const
  },
  pricing: {
    title: 'Pricing',
    description: 'Choose the perfect plan for your creator journey. Start free and upgrade as you grow. Transparent pricing with no hidden fees.',
    keywords: ['creator pricing', 'influencer tools pricing', 'brand deal platform cost']
  },
  features: {
    title: 'Features',
    description: 'Discover powerful tools to manage brand deals, negotiate contracts, track payments, and grow your creator business.',
    keywords: ['creator features', 'influencer tools', 'brand collaboration features']
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Manage your brand deals, track collaborations, and monitor your earnings all in one place.',
    noIndex: true // Private page
  },
  brandDashboard: {
    title: 'Brand Dashboard',
    description: 'Find and collaborate with creators, manage campaigns, and track ROI on your influencer marketing.',
    noIndex: true // Private page
  }
};
