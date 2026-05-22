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
          'goofy.timtim',
          'goldenasginger',
          'postothezippypuppy',
          'kingrufus_malhotra',
          'simba_bhimavaram_bullodu',
          'meowmate12',
          'thepawsomelifeofoso',
          'maxx_thegolden_retriever',
          'oreo_thegoldyboy_',
          '_its_bruno_the_beagle_',
          'helloiamsparkle',
          'mylos_kazoku'
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
                      muted
                      loop
                      playsInline
                      preload="none"
                      poster={creator.avatar_url}
                      onClick={handleVideoTap}
                      onMouseEnter={(e) => {
                        const playPromise = e.currentTarget.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(() => {});
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                      }}
                      onTouchStart={(e) => {
                        if (e.currentTarget.paused) {
                          e.currentTarget.play().catch(() => {});
                        } else {
                          e.currentTarget.pause();
                        }
                      }}
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

                  <div className="mt-4">
                    <Link
                      to={`/${creator.username}`}
                      target="_blank"
                      className="flex items-center justify-between w-full bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-black py-3 px-5 rounded-2xl transition-all duration-200 group/btn shadow-sm hover:shadow-md hover:shadow-emerald-800/10"
                    >
                      <span>View Portfolio</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Why Brands Love Section */}
      <section className="bg-white py-24 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-black text-slate-900 tracking-tight mb-4"
            >
              Why brands love collaborating through Creator Armour 🚀
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-500 max-w-2xl mx-auto"
            >
              We handle the heavy lifting so you can focus on scaling your brand.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: "Dedicated Dashboard",
                desc: "Manage all your creator collaborations in one unified place."
              },
              {
                icon: Package,
                title: "Shipment Tracking",
                desc: "Easily track shipments, creator status, and campaign progress."
              },
              {
                icon: ShieldCheck,
                title: "End-to-End Management",
                desc: "We handle the entire collab workflow from start to finish."
              },
              {
                icon: Gavel,
                title: "Legal Support",
                desc: "Free legal consultation for all creator-brand matters ⚖️"
              },
              {
                icon: Search,
                title: "Rapid Discovery",
                desc: "Find the right creators without manually scrolling Instagram."
              },
              {
                icon: CheckCircle,
                title: "Pre-Vetted Talent",
                desc: "Every creator is matched based on engagement and niche."
              },
              {
                icon: IndianRupee,
                title: "Flexible Campaigns",
                desc: "Full support for barter, affiliate, and paid collaborations."
              },
              {
                icon: MessageCircle,
                title: "Seamless Coordination",
                desc: "Smooth communication channels for effortless collaboration."
              },
              {
                icon: Clock,
                title: "Saves Massive Time",
                desc: "Focus on growth while we handle the operational headaches ✨"
              }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  <benefit.icon className="w-6 h-6 text-emerald-800" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{benefit.desc}</p>
              </motion.div>
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
