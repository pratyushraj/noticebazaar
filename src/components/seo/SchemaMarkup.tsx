import { useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  datePublished: string; // ISO format
  dateModified?: string; // ISO format
  author?: {
    name: string;
    type: 'Organization' | 'Person';
  };
  publisher?: {
    name: string;
    logo?: string;
  };
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Article Schema Markup (Schema.org)
 */
export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
  title,
  description,
  image = 'https://creatorarmour.com/og-preview.png',
  datePublished,
  dateModified,
  author = { name: 'Creator Armour', type: 'Organization' },
  publisher = {
    name: 'Creator Armour',
    logo: 'https://creatorarmour.com/logo.png',
  },
}) => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: image,
      datePublished,
      dateModified: dateModified || datePublished,
      author: {
        '@type': author.type,
        name: author.name,
      },
      publisher: {
        '@type': 'Organization',
        name: publisher.name,
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo || 'https://creatorarmour.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': typeof window !== 'undefined' ? window.location.href : 'https://creatorarmour.com',
      },
    };

    // Remove existing article schema if any
    const existingScript = document.querySelector('script[data-schema="article"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'article');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="article"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, image, datePublished, dateModified, author, publisher]);

  return null;
};

/**
 * FAQ Schema Markup (Schema.org)
 */
export const FAQSchema: React.FC<FAQSchemaProps> = ({ faqs }) => {
  useEffect(() => {
    if (faqs.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    // Remove existing FAQ schema if any
    const existingScript = document.querySelector('script[data-schema="faq"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'faq');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="faq"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs]);

  return null;
};

/**
 * Breadcrumb Schema Markup (Schema.org)
 */
export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => {
  useEffect(() => {
    if (items.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };

    // Remove existing breadcrumb schema if any
    const existingScript = document.querySelector('script[data-schema="breadcrumb"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'breadcrumb');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="breadcrumb"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
};

interface VideoObjectSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string; // ISO format
  contentUrl: string;
  duration?: string; // ISO 8601 duration format (e.g., PT1M33S)
  embedUrl?: string;
}

/**
 * VideoObject Schema Markup (Schema.org)
 */
export const VideoObjectSchema: React.FC<VideoObjectSchemaProps> = ({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  duration,
  embedUrl,
}) => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name,
      description,
      thumbnailUrl,
      uploadDate,
      contentUrl,
      embedUrl,
      duration,
    };

    // Remove existing video schema if any
    const existingScript = document.querySelector('script[data-schema="video"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'video');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="video"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, thumbnailUrl, uploadDate, contentUrl, duration, embedUrl]);

  return null;
};
