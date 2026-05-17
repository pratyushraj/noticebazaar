import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CheckCircle, IndianRupee, Clock, Gavel, Instagram, LayoutDashboard, MessageCircle, Package, Play, Search, ShieldCheck, Sparkles, Star, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Skeleton } from '@/components/ui/skeleton';

interface CreatorProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  business_name: string;
  avatar_url: string;
  followers_count: number;
  engagement_rate: number;
  avg_views: number;
  is_elite_verified: boolean;
  creator_category: string;
  location: string;
  discovery_video_url: string;
  bio: string;
}

const PetBrandPitch = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const formatFollowers = (n?: number | null) => {
    if (n === null || n === undefined || Number.isNaN(n)) return 'Verified';
    if (n === 0) return '---';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const formatViews = (n?: number | null) => {
    if (n === null || n === undefined || Number.isNaN(n) || n === 0) return '---';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
  };

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const targetUsernames = [
          'simba_bhimavaram_bullodu',
          'helloiamsparkle',
          'meowmate12',
          'thepawsomelifeofoso',
          'oreo_thegoldyboy_',
          'mylos_kazoku',
          '_its_bruno_the_beagle_'
        ];

        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, business_name, avatar_url, followers_count, engagement_rate, avg_views, is_elite_verified, creator_category, location, discovery_video_url, bio')
          .in('username', targetUsernames);
          
        if (error) throw error;

        // Order the creators logically to match target preferences
        const orderedData = [];
        if (data) {
          targetUsernames.forEach(username => {
            const found = data.find(c => c.username === username);
            if (found) orderedData.push(found);
          });
        }
        
        setCreators(orderedData as CreatorProfile[]);
      } catch (err) {
        console.error('Error fetching pet creators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const flowSteps = [
    {
      title: "1. Premium Sample Box Dispatch",
      desc: "Pet food, grooming kits, and toys can be fragile or heavy. Track shipments automatically with integrated labels and automated dispatch.",
      icon: Package,
    },
    {
      title: "2. Automated WhatsApp Sync",
      desc: "No chasing pet moms on Instagram DMs. Creators get automatic brief briefs, onboarding setup links, and reminders via WhatsApp.",
      icon: MessageCircle,
    },
    {
      title: "3. Direct Escrow Payouts",
      desc: "Safety first. Creator funds are held in secure escrow and released automatically only after compliant video content is live with your brand tags.",
      icon: ShieldCheck,
    },
  ];

  const brandBenefits = [
    {
      title: "Heart-Warming UGC Demos",
      desc: "Get premium, funny, and beautiful reels showing dog & cat reactions, organic chew tests, and grooming tutorials.",
      icon: Sparkles,
    },
    {
      title: "Zero-Effort Campaign Ops",
      desc: "Our automated dashboard coordinates creator shipping, delivery tracking, and video approvals.",
      icon: LayoutDashboard,
    },
    {
      title: "100% Verified Performance",
      desc: "Access authentic metrics directly from Meta APIs—no screenshots or outdated media kits.",
      icon: Users,
    },
  ];

  const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play().catch(err => console.log("Play interrupted:", err));
    } else {
      video.pause();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 selection:bg-amber-200 selection:text-amber-950 font-sans">
      <SEOHead 
        title="CreatorArmour x Pet Brands" 
        description="Curated verified pet and animal creator profiles shortlisted for premium D2C pet care campaigns."
      />

      {/* Header Accent banner */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-700 to-emerald-900 text-white py-2 px-4 text-center text-xs font-bold tracking-wider relative z-50">
        🐾 PRE-VETTED COLLABORATION PORTAL FOR PREMIER PET BRANDS
      </div>

      {/* Navigation Header */}
      <header className="border-b border-emerald-900/10 py-6 px-8 relative z-50 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black tracking-tight text-2xl text-emerald-800">
              Creator<span className="text-amber-500">Armour</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-bold tracking-tight text-lg text-emerald-800/80">
              Pet Care Squad
            </span>
          </div>
          <Link 
            to="/" 
            className="text-xs font-bold text-emerald-850 hover:text-emerald-900 border border-emerald-800/20 rounded-full px-4 py-2 hover:bg-emerald-50 transition-colors"
          >
            Go to Website
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-200/30 via-transparent to-transparent opacity-70 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full text-amber-800 text-xs font-black uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Warm Snugs, Clean Coats: Pre-Vetted Creator Squad
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-emerald-950 tracking-tight leading-[1.1] mb-6"
          >
            Curated verified Pet & Animal Creators for Pet Brands 🐾🐶🐈
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-emerald-900/70 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Handpicked golden retrievers, playful huskies, rescue packs, and cute cats perfectly pre-configured to showcase premium pet foods, organic treats, supplements, and grooming collections.
          </motion.p>
        </div>
      </section>

      {/* Main Content Grid (Creators Showcase) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-emerald-900/10 pb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 flex items-center gap-2">
              The Premium Pet Shortlist
              <span className="text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black">
                {creators.length} ACTIVE
              </span>
            </h2>
            <p className="text-sm text-emerald-800/60 mt-1">Tap or hover on any pet profile card to preview their high-fidelity video reels.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
                <Skeleton className="h-[340px] w-full rounded-2xl bg-slate-100" />
                <Skeleton className="h-6 w-3/4 bg-slate-100" />
                <Skeleton className="h-4 w-1/2 bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {creators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-[32px] overflow-hidden border border-emerald-900/5 hover:border-emerald-600/20 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Media Container (Video Playback or Static Image) */}
                <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden cursor-pointer">
                  {creator.discovery_video_url ? (
                    <video
                      src={creator.discovery_video_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      onClick={handleVideoTap}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-950/20 text-emerald-800 text-center p-6">
                      <Play className="w-12 h-12 text-emerald-800/40 mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider">Video Upload Pending</p>
                    </div>
                  )}

                  {/* Top Overlay Badge */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                      🇮🇳 {creator.location || 'India'}
                    </span>
                    {creator.is_elite_verified && (
                      <span className="bg-amber-400/90 backdrop-blur-md text-amber-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300/20 flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-amber-950 stroke-none" /> ELITE
                      </span>
                    )}
                  </div>

                  {/* Bottom Overlay Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-6 pt-16 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-xl text-white tracking-tight">
                        {creator.first_name} {creator.last_name || ''}
                      </h3>
                      <BadgeCheck className="w-5 h-5 text-emerald-450 fill-white" />
                    </div>
                    <p className="text-slate-350 text-xs font-bold tracking-wider">
                      @{creator.username}
                    </p>
                  </div>
                </div>

                {/* Creator Details Panel */}
                <div className="p-6 bg-white flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Verified Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 bg-[#FCFBF8] border border-emerald-900/5 rounded-2xl p-3 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Audience</p>
                        <p className="text-sm font-black text-emerald-950">{formatFollowers(creator.followers_count)}</p>
                      </div>
                      <div className="border-x border-emerald-900/5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Avg Views</p>
                        <p className="text-sm font-black text-emerald-950">{formatViews(creator.avg_views)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Eng Rate</p>
                        <p className="text-sm font-black text-emerald-950">
                          {creator.engagement_rate ? `${creator.engagement_rate.toFixed(1)}%` : '---'}
                        </p>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {creator.bio || 'Verified professional pet creator registered under Creator Armour discovery system.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full">
                      🐾 {creator.creator_category || 'Pet Care'}
                    </span>
                    <a
                      href={`https://instagram.com/${creator.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Operational Moat Section */}
      <section className="bg-[#1E3F20] text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="bg-amber-400/25 border border-amber-400/30 px-4 py-1 rounded-full text-amber-300 text-xs font-bold tracking-widest uppercase mb-4 inline-block">
              Scale Your Campaigns Cleanly
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Brands Chill. We Handle Operations. 🛡️
            </h2>
            <p className="text-emerald-100/70 text-base sm:text-lg mt-4 leading-relaxed">
              Skip back-and-forth negotiations, spreadsheets, and delayed delivery. Creator Armour provides automated, secure infrastructure for reliable scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {flowSteps.map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold mb-6 shadow-lg shadow-amber-400/10 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-emerald-100/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="border-t border-white/10 pt-16 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center sm:text-left">
            {brandBenefits.map((b, i) => (
              <div key={i} className="space-y-3">
                <h4 className="text-amber-400 font-black text-lg flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  {b.title}
                </h4>
                <p className="text-emerald-100/60 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-emerald-950 tracking-tight leading-tight mb-4">
          Want a Custom Shortlist for Your Campaign? 🚀🐾
        </h2>
        <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          We configure tailored cohorts with verified performance metrics and take care of contract protection, shipping, and automated payouts.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/discover"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 text-white font-black hover:bg-emerald-900 px-8 py-4 rounded-full shadow-lg hover:shadow-emerald-800/10 transition-all duration-300"
          >
            Explore Pet Niche <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="mailto:partnerships@creatorarmour.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 px-8 py-4 rounded-full transition-all duration-300"
          >
            Email Partnerships
          </a>
        </div>
      </section>
    </div>
  );
};

export default PetBrandPitch;
