import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ShieldCheck, CheckCircle2, ExternalLink,
  Filter, Sparkles, ArrowRight
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQSection } from "@/components/seo/FAQSection";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import { safeAvatarSrc } from "@/lib/utils/image";
import profilesData from "../../database_backups/profiles_latest.json";

interface Creator {
  id: string;
  first_name: string;
  last_name?: string | null;
  username: string;
  avatar_url?: string | null;
  creator_category?: string | null;
  followers_count?: number | null;
  instagram_followers?: number | null;
  avg_views?: number | null;
  avg_reel_views_manual?: number | null;
  engagement_rate?: number | null;
  starting_price?: number | null;
  location?: string | null;
  city?: string | null;
  is_verified?: boolean;
  bio?: string | null;
}

interface CityMeta {
  name: string;
  region: string;
  state: string;
  searchKeywords: string[];
}

const CITY_INFO: Record<string, CityMeta> = {
  patna: { name: "Patna", region: "Bihar", state: "Bihar", searchKeywords: ["patna", "bihar"] },
  delhi: { name: "Delhi NCR", region: "Delhi NCR", state: "Delhi", searchKeywords: ["delhi", "noida", "gurgaon", "ghaziabad", "ncr"] },
  mumbai: { name: "Mumbai", region: "Maharashtra", state: "Maharashtra", searchKeywords: ["mumbai", "thane", "navi mumbai"] },
  bangalore: { name: "Bangalore", region: "Karnataka", state: "Karnataka", searchKeywords: ["bangalore", "bengaluru", "karnataka"] },
  pune: { name: "Pune", region: "Maharashtra", state: "Maharashtra", searchKeywords: ["pune", "maharashtra"] },
  dehradun: { name: "Dehradun", region: "Uttarakhand", state: "Uttarakhand", searchKeywords: ["dehradun", "uttarakhand"] },
  lucknow: { name: "Lucknow", region: "Uttar Pradesh", state: "Uttar Pradesh", searchKeywords: ["lucknow", "up", "uttar pradesh"] },
  noida: { name: "Noida", region: "Uttar Pradesh", state: "Uttar Pradesh", searchKeywords: ["noida", "up", "uttar pradesh"] }
};

const LocalInfluencers = () => {
  const { city } = useParams<{ city: string }>();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Food", "Fashion", "Travel", "Lifestyle"];

  const currentCityKey = String(city || "patna").trim().toLowerCase();
  
  // Fallback metadata generator if city isn't pre-configured in CITY_INFO
  const cityMeta: CityMeta = CITY_INFO[currentCityKey] || {
    name: currentCityKey.charAt(0).toUpperCase() + currentCityKey.slice(1),
    region: currentCityKey.charAt(0).toUpperCase() + currentCityKey.slice(1),
    state: "India",
    searchKeywords: [currentCityKey]
  };

  useEffect(() => {
    const rawData = (profilesData as any[]) || [];
    const mapped: Creator[] = rawData.map(c => ({
      id: c.id,
      first_name: c.first_name || c.username,
      last_name: c.last_name,
      username: c.username,
      avatar_url: c.avatar_url,
      creator_category: c.creator_category,
      followers_count: c.followers_count,
      instagram_followers: c.instagram_followers,
      avg_views: c.avg_views,
      avg_reel_views_manual: c.avg_reel_views_manual,
      engagement_rate: c.engagement_rate,
      starting_price: c.starting_price,
      location: c.location,
      city: c.city,
      is_verified: c.is_verified,
      bio: c.bio
    }));

    // Dynamic filtering for city based on name and searchKeywords keywords
    const filteredByCity = mapped.filter(c => {
      if (!c.username) return false;
      const cCity = String(c.city || '').toLowerCase();
      const cLoc = String(c.location || '').toLowerCase();
      
      // Check if profile has explicit city match or location field contains keywords
      return cCity === currentCityKey || 
             cLoc.includes(currentCityKey) || 
             cityMeta.searchKeywords.some(keyword => cLoc.includes(keyword) || cCity.includes(keyword));
    });

    setCreators(filteredByCity);
    setSelectedCategory("All"); // Reset filter on city change
  }, [currentCityKey, cityMeta.searchKeywords]);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredCreators(creators);
    } else {
      setFilteredCreators(
        creators.filter(c => 
          String(c.creator_category || '').toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );
    }
  }, [creators, selectedCategory]);



  const formatFollowers = (count?: number | null) => {
    if (!count) return "—";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return `${count}`;
  };

  const formatViews = (views?: number | null) => {
    if (!views) return "—";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return `${views}`;
  };

  const faqs = [
    {
      question: `How do I find and collaborate with top Instagram influencers in ${cityMeta.name}?`,
      answer: `You can find pre-vetted, highly engaged local creators in ${cityMeta.name} using Creator Armour. Simply filter creators by niche (Food, Fashion, Travel, Lifestyle) and check their verified metrics like reach, engagement, and content history before proposing a campaign.`
    },
    {
      question: `What are the average rates of micro-influencers in ${cityMeta.name}?`,
      answer: `In 2026, micro-influencers in ${cityMeta.name} with 10k–50k followers typically charge ₹2,000–₹8,000 per Reel, while macro-influencers with 100k+ followers can charge ₹15,000–₹35,000. Creator Armour guarantees transparent pricing with zero middleman commissions.`
    },
    {
      question: `Why should brands target local creators in ${cityMeta.region}?`,
      answer: `Hyperlocal marketing represents a high-growth market for D2C brands. ${cityMeta.name}-based creators hold extremely high trust scores and organic regional recall. Collaborating with them drives up to a 40% higher conversion rate compared to generic national influencer outreach.`
    },
    {
      question: "How does Creator Armour protect influencer campaigns?",
      answer: "Creator Armour uses standard agreements, automated milestone payment escrows (Razorpay), and a unified proof-collection workflow. This ensures creators get paid on time and brands receive their deliverables exactly as agreed."
    }
  ];



  return (
    <div className="min-h-screen bg-[#020D0A] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      <SEOHead
        title={`${cityMeta.name} Influencers | Creator Armour`}
        description={`Discover verified Instagram and UGC creators in ${cityMeta.name}, ${cityMeta.region} across food, fashion, travel, and lifestyle.`}
        keywords={[
          `${cityMeta.name} influencers`, 
          `Instagram influencers ${cityMeta.name}`, 
          `best creators ${cityMeta.region}`, 
          `influencer marketing ${cityMeta.name}`, 
          `${cityMeta.name} food bloggers`
        ]}
        jsonLd={undefined}
        canonicalUrl={`https://creatorarmour.com/local-creators/${currentCityKey}`}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#020D0A]/90 backdrop-blur-xl border-b border-emerald-500/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="text-[16px] sm:text-[17px] font-black tracking-tight text-white whitespace-nowrap">
              Creator Armour
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Log In</Link>
            <Link 
              to="/signup?mode=brand" 
              onClick={() => triggerHaptic(HapticPatterns.success)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-full text-xs font-black transition-all shadow-lg shadow-emerald-500/10"
            >
              Get Creator Shortlist
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="relative rounded-[32px] overflow-hidden border border-emerald-500/10 bg-[#061B15]/30 p-8 md:p-16 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-emerald-500/10 to-transparent blur-[80px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Hyperlocal Influencer Guide</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
            Top Instagram Influencers <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              in {cityMeta.name} ({new Date().getFullYear()})
            </span>
          </h1>

          <div className="mx-auto max-w-2xl mb-6 rounded-[24px] border border-emerald-500/10 bg-white/5 px-4 py-3 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Direct answer</p>
            <p className="text-sm text-slate-300">
              If you need verified {cityMeta.name} creators for a campaign, this page list local influencers with audited engagement, categories, and direct collaboration links.
            </p>
          </div>

          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-8">
            Access verified audience metrics, engagement stats, and secure contract workflows for the top content creators in {cityMeta.name}. Boost your D2C brand ROI in {cityMeta.state}.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup?mode=brand"
              onClick={() => triggerHaptic(HapticPatterns.medium)}
              className="cta-primary bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm px-6 py-3.5 rounded-full flex items-center justify-center gap-2 w-full sm:w-auto shadow-xl shadow-emerald-500/10"
            >
              Hire {cityMeta.name} Creators <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/signup?mode=creator"
              onClick={() => triggerHaptic(HapticPatterns.light)}
              className="px-6 py-3.5 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-black text-sm rounded-full w-full sm:w-auto transition-colors"
            >
              Join as a Creator
            </Link>
          </div>
        </section>

        {/* Directory Filters */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-emerald-500/10 pb-6">
            <div>
              <h2 className="text-2xl font-black text-white">Verified Creators Directory</h2>
              <p className="text-xs text-slate-400 mt-1">Showing {filteredCreators.length} {cityMeta.name}-based creators with API-audited profiles.</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <Filter className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setSelectedCategory(category);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === category
                      ? "bg-emerald-500 text-black font-black shadow-md"
                      : "bg-[#061B15] text-slate-400 hover:text-white border border-emerald-500/5 hover:border-emerald-500/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Grid */}
          {filteredCreators.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-emerald-500/15 bg-[#061B15]/20 p-12 text-center">
              <Sparkles className="w-10 h-10 text-emerald-400/40 mx-auto mb-4" />
              <h3 className="font-bold text-white text-base">No Creators Listed Yet</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mt-2">
                We are currently onboarding creators in {cityMeta.name}. If you are a creator based in {cityMeta.name}, join us to get listed!
              </p>
              <Link 
                to="/signup?mode=creator"
                className="inline-flex items-center gap-2 bg-emerald-500 text-black font-black text-xs px-5 py-2.5 rounded-full mt-6"
              >
                Join Creator Directory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <div 
                  key={creator.id}
                  className="group relative bg-[#061B15]/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-emerald-500/10 shadow-2xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    {/* Avatar & Header */}
                    <div className="flex items-center gap-4">
                      <img 
                        src={safeAvatarSrc(creator.avatar_url, `${creator.first_name}`)} 
                        alt={`${creator.first_name}`} 
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/10"
                        loading="lazy"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-white text-base tracking-tight leading-tight">{creator.first_name} {creator.last_name || ""}</h3>
                          {creator.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-black shrink-0" />}
                        </div>
                        <p className="text-emerald-400 text-xs font-black tracking-wider uppercase mt-0.5">@{creator.username}</p>
                      </div>
                    </div>

                    {creator.bio && (
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {creator.bio}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/15">
                        {creator.creator_category || "Creator"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-white/5">
                        {creator.location || `${cityMeta.name}, ${cityMeta.state}`}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-3 text-center">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Followers</p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {formatFollowers(creator.followers_count || creator.instagram_followers)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Avg. Views</p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {formatViews(creator.avg_reel_views_manual || creator.avg_views)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Engagement</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">
                          {creator.engagement_rate ? `${creator.engagement_rate}%` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      to={`/${creator.username}`}
                      className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg hover:shadow-emerald-500/10 transition-all"
                    >
                      View Portfolio & Rates <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Campaign ROI & Highlights */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white leading-tight">
              Why {cityMeta.name} Creators Drive <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Higher Campaign ROI</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Standard national campaigns overlook local cultural nuances. Collaborating with creators who understand {cityMeta.name}'s unique food culture, lifestyle preferences, and regional dialects results in genuine consumer trust and higher purchase intent.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Authentic Local Engagement</p>
                  <p className="text-slate-400 text-xs mt-0.5">Audience pools concentrated inside {cityMeta.state} and neighboring regions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Escrow Payment Protection</p>
                  <p className="text-slate-400 text-xs mt-0.5">Payments are released only after content is delivered and verified.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#061B15]/20 border border-emerald-500/10 rounded-[32px] p-8 md:p-12 space-y-6">
            <h3 className="text-xl font-black text-white">Submit Campaign Brief</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Let us know what creators you want to work with in {cityMeta.name}. We'll share a vetted shortlist and secure deal contracts within 24 hours.</p>
            <Link 
              to="/signup?mode=brand"
              className="flex items-center justify-center gap-2 w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Get Started for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <FAQSection
          title="Frequently Asked Questions"
          description="Find answers regarding campaigns, pricing, and onboarding for local influencers."
          items={faqs}
          containerClassName="border-t border-emerald-500/10 mt-16"
        />
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-emerald-500/10 bg-[#010806]/80 mt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Creator Armour</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold">
            <Link to="/" className="hover:text-emerald-400">Home</Link>
            <span>·</span>
            <Link to="/privacy-policy" className="hover:text-emerald-400">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms-of-service" className="hover:text-emerald-400">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">© {new Date().getFullYear()} Creator Armour. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LocalInfluencers;
