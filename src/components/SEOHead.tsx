import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO-optimized meta tags and structured data for Creator Armour
 */

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  creator?: {
    name: string;
    handle: string;
    platform: string;
    followers?: number;
    verified?: boolean;
  };
  brand?: {
    name: string;
    website?: string;
    industry?: string;
  };
}

// Default SEO values
const DEFAULT_SEO = {
  title: 'Creator Armour - Safe Instagram Collaborations for Creators & Brands',
  description: 'Connect Indian Instagram creators with brands for authentic collaborations. Get paid securely, protect your work with legal agreements, and grow your influence.',
  keywords: [
    'Instagram creators',
    'brand collaborations',
    'influencer marketing',
    'content creators India',
    'brand deals',
    'Instagram partnerships',
    'creator economy',
    'digital marketing India',
    'influencer platform',
    'brand creator collaboration'
  ],
  image: '/og-preview.png',
  url: 'https://creatorarmour.com',
  type: 'website' as const,
};

export const SEOHead: React.FC<SEOProps> = ({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  image = DEFAULT_SEO.image,
  url = DEFAULT_SEO.url,
  type = DEFAULT_SEO.type,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  creator,
  brand,
}) => {
  const fullTitle = title.includes('Creator Armour') ? title : `${title} | Creator Armour`;
  const fullUrl = url.startsWith('http') ? url : `${DEFAULT_SEO.url}${url}`;
  const fullImage = image.startsWith('http') ? image : `${DEFAULT_SEO.url}${image}`;

  // Generate structured data
  const structuredData = generateStructuredData({
    title: fullTitle,
    description,
    url: fullUrl,
    image: fullImage,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags,
    creator,
    brand,
  });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Creator Armour" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@creatorarmour" />
      {author && <meta name="twitter:creator" content={author} />}

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Creator Armour" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Theme Color */}
      <meta name="theme-color" content="#0B0F14" />
      <meta name="msapplication-TileColor" content="#0B0F14" />
    </Helmet>
  );
};

/**
 * Generate structured data (JSON-LD) for better SEO
 */
function generateStructuredData(props: SEOProps & { title: string; description: string; url: string; image: string }) {
  const { title, description, url, image, type, author, publishedTime, modifiedTime, section, tags, creator, brand } = props;

  // Base structured data
  const baseData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Creator Armour',
    description: DEFAULT_SEO.description,
    url: DEFAULT_SEO.url,
    logo: `${DEFAULT_SEO.url}/og-preview.png`,
    sameAs: [
      'https://twitter.com/creatorarmour',
      'https://www.instagram.com/creatorarmour',
      'https://www.linkedin.com/company/creator-armour'
    ],
  };

  // Creator profile structured data
  if (creator) {
    return {
      ...baseData,
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: creator.name,
        alternateName: creator.handle,
        description: `${creator.name} is an Instagram creator with ${creator.followers?.toLocaleString() || 'growing'} followers, specializing in authentic brand collaborations.`,
        image: image,
        sameAs: [
          `https://instagram.com/${creator.handle}`,
          ...(creator.platform !== 'instagram' ? [`https://youtube.com/${creator.handle}`] : [])
        ],
        ...(creator.verified && { additionalProperty: { '@type': 'PropertyValue', name: 'Verified Creator', value: 'true' } }),
        ...(creator.followers && { interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          userInteractionCount: creator.followers
        }}),
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: DEFAULT_SEO.url },
          { '@type': 'ListItem', position: 2, name: 'Creators', item: `${DEFAULT_SEO.url}/creators` },
          { '@type': 'ListItem', position: 3, name: creator.name, item: url }
        ]
      }
    };
  }

  // Brand page structured data
  if (brand) {
    return {
      ...baseData,
      '@type': 'Organization',
      name: brand.name,
      description: `Connect with ${brand.name} for authentic Instagram collaborations. ${brand.industry ? `${brand.name} specializes in ${brand.industry} products and services.` : ''}`,
      url: brand.website || url,
      logo: image,
      industry: brand.industry,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: 'en'
      }
    };
  }

  // Article/Blog post structured data
  if (type === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image,
      url,
      datePublished: publishedTime,
      dateModified: modifiedTime,
      author: author ? {
        '@type': 'Person',
        name: author
      } : {
        '@type': 'Organization',
        name: 'Creator Armour',
        url: DEFAULT_SEO.url
      },
      publisher: {
        '@type': 'Organization',
        name: 'Creator Armour',
        logo: {
          '@type': 'ImageObject',
          url: `${DEFAULT_SEO.url}/og-preview.png`
        }
      },
      ...(section && { articleSection: section }),
      ...(tags && { keywords: tags.join(', ') }),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      }
    };
  }

  // Default website structured data
  return baseData;
}

/**
 * Pre-configured SEO components for different page types
 */

export const CreatorProfileSEO: React.FC<{ creator: NonNullable<SEOProps['creator']> }> = ({ creator }) => (
  <SEOHead
    title={`${creator.name} - Instagram Creator | Creator Armour`}
    description={`${creator.name} (@${creator.handle}) is an Instagram creator with ${creator.followers?.toLocaleString() || 'growing'} followers. Connect for authentic brand collaborations.`}
    keywords={[creator.name, creator.handle, 'Instagram creator', 'influencer', 'brand collaborations']}
    type="profile"
    creator={creator}
  />
);

export const BrandPageSEO: React.FC<{ brand: NonNullable<SEOProps['brand']> }> = ({ brand }) => (
  <SEOHead
    title={`${brand.name} - Brand Collaborations | Creator Armour`}
    description={`Partner with ${brand.name} for authentic Instagram collaborations. Connect with verified creators in India.`}
    keywords={[brand.name, brand.industry || 'brand', 'Instagram marketing', 'influencer partnerships']}
    brand={brand}
  />
);

export const BlogPostSEO: React.FC<{
  title: string;
  description: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  tags?: string[];
  image?: string;
}> = ({ title, description, publishedTime, modifiedTime, author, tags, image }) => (
  <SEOHead
    title={title}
    description={description}
    type="article"
    author={author}
    publishedTime={publishedTime}
    modifiedTime={modifiedTime}
    tags={tags}
    image={image}
  />
);
