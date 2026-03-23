import { useEffect } from 'react';

/**
 * SEO Props Interface
 * @property title - Page title (required)
 * @property description - Meta description (required)
 * @property image - Open Graph image URL (optional)
 * @property url - Canonical URL (optional, defaults to current page URL)
 * @property type - Open Graph type: 'website' or 'article' (default: 'website')
 * @property structuredData - JSON-LD structured data object (optional)
 */
interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  structuredData?: object;
}

/**
 * Default site configuration
 * Update these values based on your site's configuration
 */
const DEFAULT_SITE_CONFIG = {
  siteName: 'NoticeBazaar',
  defaultImage: '/og-image.png', // Default OG image path
  twitterHandle: '@noticebazaar', // Your Twitter handle
  baseUrl: typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : '',
};

/**
 * SEO Component for dynamic meta tags
 * Handles title, description, Open Graph, Twitter Cards, canonical URL, and JSON-LD
 * 
 * @example
 * ```tsx
 * <SEO
 *   title="Home | NoticeBazaar"
 *   description="Welcome to NoticeBazaar"
 *   image="/custom-og-image.png"
 *   type="website"
 * />
 * ```
 */
const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData,
}: SEOProps) => {
  useEffect(() => {
    // Construct the canonical URL
    const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const ogImage = image 
      ? (image.startsWith('http') ? image : `${DEFAULT_SITE_CONFIG.baseUrl}${image}`)
      : `${DEFAULT_SITE_CONFIG.baseUrl}${DEFAULT_SITE_CONFIG.defaultImage}`;

    // Set document title
    document.title = title;

    // Helper function to update or create meta tag
    const setMetaTag = (
      name: string,
      content: string,
      property?: boolean = false
    ) => {
      const selector = property 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Helper function to update or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (link) {
        link.setAttribute('href', href);
      } else {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        document.head.appendChild(link);
      }
    };

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('robots', 'index, follow');

    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', DEFAULT_SITE_CONFIG.siteName, true);
    setMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:site', DEFAULT_SITE_CONFIG.twitterHandle);

    // Canonical URL
    setLinkTag('canonical', canonicalUrl);

    // JSON-LD Structured Data
    if (structuredData) {
      let scriptTag = document.querySelector(
        'script[type="application/ld+json"]'
      ) as HTMLScriptElement;

      if (scriptTag) {
        scriptTag.textContent = JSON.stringify(structuredData);
      } else {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.textContent = JSON.stringify(structuredData);
        document.head.appendChild(scriptTag);
      }
    }

    // Cleanup function - restore defaults when component unmounts
    return () => {
      // Note: We don't remove meta tags on unmount to avoid flickering
      // The next page's SEO component will update them
    };
  }, [title, description, image, url, type, structuredData]);

  return null;
};

export default SEO;

/**
 * Helper function to generate common structured data
 */
export const generateStructuredData = {
  website: (overrides = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SITE_CONFIG.siteName,
    url: DEFAULT_SITE_CONFIG.baseUrl,
    ...overrides,
  }),

  organization: (overrides = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SITE_CONFIG.siteName,
    url: DEFAULT_SITE_CONFIG.baseUrl,
    logo: `${DEFAULT_SITE_CONFIG.baseUrl}/logo.png`,
    sameAs: [
      `https://twitter.com/${DEFAULT_SITE_CONFIG.twitterHandle.replace('@', '')}`,
      // Add other social media URLs here
    ],
    ...overrides,
  }),

  article: (overrides = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SITE_CONFIG.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SITE_CONFIG.baseUrl}/logo.png`,
      },
    },
    ...overrides,
  }),

  breadcrumbList: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') 
        ? item.url 
        : `${DEFAULT_SITE_CONFIG.baseUrl}${item.url}`,
    })),
  }),

  faq: (questions: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }),
};
