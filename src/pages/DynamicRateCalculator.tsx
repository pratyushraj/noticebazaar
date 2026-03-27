import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import InfluencerRateCalculator from '@/components/InfluencerRateCalculator';

const DynamicRateCalculator = () => {
  const { platform = 'instagram', niche = 'lifestyle' } = useParams<{ platform: string; niche: string }>();

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const nicheName = niche.charAt(0).toUpperCase() + niche.slice(1);

  const seoTitle = `${nicheName} Creator Rate Calculator for ${platformName} | Creator Armour`;
  const seoDescription = `Find out how much ${niche} creators should charge on ${platformName}. Get accurate rate estimates based on followers, engagement, and deliverables.`;

  const canonicalUrl = `https://creatorarmour.com/rate-calculator/${platform}/${niche}`;

  const breadcrumbItems = [
    { name: 'Home', url: 'https://creatorarmour.com' },
    { name: 'Rate Calculator', url: 'https://creatorarmour.com/rate-calculator' },
    { name: `${platformName} - ${nicheName}`, url: canonicalUrl },
  ];

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={[`${platform} influencer rates`, `${niche} creator pricing`, 'influencer rate calculator', 'creator armour']}
        canonicalUrl={canonicalUrl}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      
      <div className="min-h-screen bg-[#0B0F14] text-white font-inter">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/rate-calculator" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Rate Calculator
            </Link>
          </div>
          
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              {nicheName} Creator Rate<br />Calculator for {platformName}
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
              Get an accurate estimate of what {niche} creators should charge on {platformName}. Factor in your follower count, engagement rate, and deliverables to price your brand deals with confidence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <InfluencerRateCalculator />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-3">Why Niche Matters</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {nicheName} creators often command higher or lower rates based on market demand, audience purchasing power, and brand collaboration frequency in that vertical.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-3">Platform Influence</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {platformName} has its own creator economy dynamics. Rates differ based on content format (Reels, Stories, Long-form) and audience demographics.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-3">Next Step: Protected Deal</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Once you've calculated your rate, use Creator Armour to share a collab link and manage collaborations professionally.
                </p>
                <Link to="/signup" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                  Get Protected
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DynamicRateCalculator;
