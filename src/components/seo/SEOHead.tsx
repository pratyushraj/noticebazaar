import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title: string; // 55-60 characters
  description: string; // 150-160 characters
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string; // ISO format
  modifiedTime?: string; // ISO format
  author?: string;
  canonicalUrl?: string;
}

/**
 * SEO Head Component
 * Updates meta tags, title, and Open Graph tags for better SEO
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  image = 'https://creatorarmour.com/og-preview.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'CreatorArmour',
  canonicalUrl,
}) => {
  const location = useLocation();
  const baseUrl = 'https://creatorarmour.com';
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    // Canonical URL
    updateLinkTag('canonical', currentUrl);

    // Robots meta tag
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph tags
    updateMetaTag('og:type', type);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:site_name', 'CreatorArmour');

    // Article-specific OG tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime);
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime);
      }
      if (author) {
        updateMetaTag('article:author', author);
      }
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Cleanup function
    return () => {
      // Optionally restore default meta tags when component unmounts
    };
  }, [title, description, keywords, image, type, publishedTime, modifiedTime, author, currentUrl]);

  return null; // This component doesn't render anything
};

