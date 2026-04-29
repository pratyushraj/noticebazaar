import { useEffect } from 'react';

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    contactType: string;
    email: string;
  };
}

const organizationData: OrganizationData = {
  name: 'Creator Armour',
  url: 'https://creatorarmour.com',
  logo: 'https://creatorarmour.com/creator-armour-icon.svg',
  description: 'Close brand deals without Instagram DMs. The smart platform for creators to manage collaborations, negotiate rates, and get paid faster.',
  sameAs: [
    'https://twitter.com/creatorarmour',
    'https://linkedin.com/company/creatorarmour',
    'https://instagram.com/creatorarmour'
  ],
  contactPoint: {
    contactType: 'customer support',
    email: 'support@creatorarmour.com'
  }
};

export function StructuredData() {
  useEffect(() => {
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organizationData.name,
      url: organizationData.url,
      logo: organizationData.logo,
      description: organizationData.description,
      sameAs: organizationData.sameAs,
      contactPoint: organizationData.contactPoint ? {
        '@type': 'ContactPoint',
        ...organizationData.contactPoint
      } : undefined
    });

    document.head.appendChild(script);

    return () => {
      const script = document.getElementById('structured-data');
      if (script) script.remove();
    };
  }, []);

  return null;
}

// FAQ Structured Data for SEO
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQStructuredData({ items }: { items: FAQItem[] }) {
  useEffect(() => {
    const existingScript = document.getElementById('faq-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'faq-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    });

    document.head.appendChild(script);

    return () => {
      const script = document.getElementById('faq-structured-data');
      if (script) script.remove();
    };
  }, [items]);

  return null;
}

// Breadcrumb Structured Data
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  useEffect(() => {
    const existingScript = document.getElementById('breadcrumb-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'breadcrumb-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    });

    document.head.appendChild(script);

    return () => {
      const script = document.getElementById('breadcrumb-structured-data');
      if (script) script.remove();
    };
  }, [items]);

  return null;
}
