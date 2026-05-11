import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import RateCalculator from './RateCalculator';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';

const RateCalculatorDynamic = () => {
  const { platform, niche } = useParams<{ platform: string; niche: string }>();

  // Validate params
  const validPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter'];
  const validNiches = ['finance', 'beauty', 'tech', 'education', 'entertainment'];

  if (!platform || !niche || !validPlatforms.includes(platform.toLowerCase()) || !validNiches.includes(niche.toLowerCase())) {
    return <Navigate to="/rate-calculator" replace />;
  }

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const nicheName = niche.charAt(0).toUpperCase() + niche.slice(1);

  const seoTitle = `${platformName} ${nicheName} Influencer Rate Calculator (2026)`;
  const seoDescription = `Calculate fair market rates for ${nicheName} influencers on ${platformName}. Get accurate pricing for Reels, Posts, and Videos based on current CPM data in India.`;
  const canonicalUrl = `https://creatorarmour.com/calculator/${platform.toLowerCase()}/${niche.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-[#020D0A]">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={[
          `${platform.toLowerCase()} ${niche.toLowerCase()} rates`,
          `${niche.toLowerCase()} influencer pricing`,
          `how much to pay ${niche.toLowerCase()} influencers`,
          `${platform.toLowerCase()} collab rates india`
        ]}
        canonicalUrl={canonicalUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://creatorarmour.com/' },
          { name: 'Rate Calculator', url: 'https://creatorarmour.com/rate-calculator' },
          { name: `${platformName} ${nicheName} Rates`, url: canonicalUrl },
        ]}
      />
      
      {/* Pass params as initial state if the RateCalculator component is updated to accept them */}
      {/* For now, we wrap the existing calculator which handles its own state */}
      <div className="pt-12">
        <div className="max-w-[1200px] mx-auto px-6 mb-8">
            <h2 className="text-xl md:text-2xl font-black text-emerald-500 uppercase italic tracking-tight">
                {platformName} × {nicheName} Pricing Guide
            </h2>
            <p className="text-slate-400 font-medium mt-2">
                Programmatic data powered by Creator Armour Systems. Updated May 2026.
            </p>
        </div>
        <RateCalculator initialPlatform={platform.toLowerCase()} initialCategory={niche.toLowerCase()} />
      </div>
    </div>
  );
};

export default RateCalculatorDynamic;
