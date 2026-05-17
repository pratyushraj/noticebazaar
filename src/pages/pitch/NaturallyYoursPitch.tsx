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

const NaturallyYoursPitch = () => {
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
          'prachisculinarycanvas', 
          'krishnavi_healthy_bites', 
          'littleexplorermommy', 
          'cookku_with_chikku', 
          '_cookingwithvineet', 
          'monika.urs', 
          'homechef_duggu', 
          'temptingtreat',
          '_small_home_kitchen',
          'blogsbysnehaaa',
          'chroniclesofffoods',
          'myspace_vlogs',
          'we_are_chefing',
          'shinyyy.05',
          'thegurgaonfoodie',
          'jaya_the_explorer',
          'aasthakumari7662',
          'd_dollypatel',
          'rounak_agarwal'
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
        console.error('Error fetching creators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const flowSteps = [
    {
      title: "1. Lightweight Box Dispatch",
      desc: "Noodles and pasta are dry, lightweight, and unbreakable. Ship healthy packs at ultra-low logistics costs directly via unified labels.",
      icon: Package,
    },
    {
      title: "2. Automated WhatsApp Sync",
      desc: "No DM chasing. Creators receive automatic campaign briefs, agreements, and schedule reminders directly via WhatsApp.",
      icon: MessageCircle,
    },
    {
      title: "3. Smart Escrow Payouts",
      desc: "Funds are held securely. Payouts release automatically only after the creator's recipe post meets brand tags and compliance.",
      icon: ShieldCheck,
    },
  ];

  const brandBenefits = [
    {
      title: "Aesthetic Cooking Demos",
      desc: "Get premium, high-converting recipe reels showing millets, moringa, and whole-wheat noodle unboxings.",
      icon: Sparkles,
    },
    {
      title: "Zero-Effort Logistics",
      desc: "Our automated dashboard handles all creator shipping, delivery tracking, and milestone syncs.",
      icon: LayoutDashboard,
    },
    {
      title: "Verified Audience Reach",
      desc: "Access verified metrics directly from Meta APIs—no photoshopped media kits, 100% real demographic insights.",
      icon: Users,
    },
  ];

  // Helper to toggle play on mobile tap
  const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play().catch(err => console.log("Play interrupted:", err));
    } else {
      video.pause();
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-slate-800 selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      <SEOHead 
        title="CreatorArmour x Naturally Yours" 
        description="Curated healthy cooking, recipe, and organic food creator profiles shortlisted for Naturally Yours campaigns."
      />

      {/* Premium Header Accent */}
      <div className="bg-gradient-to-r from-amber-400/80 via-emerald-600 to-emerald-800 text-white py-2 px-4 text-center text-xs font-bold tracking-wider relative z-50">
        ✨ PRE-VETTED COLLABORATION PORTAL FOR NATURALLY YOURS
      </div>

      {/* Navigation Header */}
      <header className="border-b border-emerald-900/10 py-6 px-8 relative z-50 bg-[#FCFBF7]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black tracking-tight text-2xl text-emerald-800">
              Creator<span className="text-amber-500">Armour</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-black tracking-tight text-2xl text-emerald-800">
              x
            </span>
            <span className="font-black tracking-tight text-2xl text-emerald-800">
              Naturally Yours
            </span>
          </div>
          <Link 
            to="/" 
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 border border-emerald-800/20 rounded-full px-4 py-2 hover:bg-emerald-50 transition-colors"
          >
            Go to Website
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent opacity-70 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-emerald-800 text-xs font-black uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Noodles Reinvented: Creator Squad
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-emerald-950 tracking-tight leading-[1.1] mb-6"
          >
            Curated Healthy Cooking & Home-Chef Creators for Naturally Yours 🍜🌾
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-emerald-900/70 max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Handpicked diet-conscious food vloggers, organic recipe developers, and healthy-eating family moms perfectly aligned to showcase Naturally Yours' Moringa Noodles, Millets Pasta, and whole-wheat items.
          </motion.p>
        </div>
      </section>

      {/* Main Content Grid (Creators Showcase) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-emerald-900/10 pb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 flex items-center gap-2">
              The Healthy Food Shortlist
              <span className="text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black">
                {creators.length} ACTIVE
              </span>
            </h2>
            <p className="text-sm text-emerald-800/60 mt-1">Tap/Hover on any creator profile card to preview their high-fidelity recipe video reels.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
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
                      preload="auto"
                      poster={creator.avatar_url}
                      onClick={handleVideoTap}
                      onMouseOver={e => {
                        const video = e.target as HTMLVideoElement;
                        video.play().catch(() => {});
                      }}
                      onMouseOut={e => {
                        const video = e.target as HTMLVideoElement;
                        video.pause();
                        video.currentTime = 0;
                      }}
                      onError={(e) => {
                        console.error('Video playback failed:', e);
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const img = document.createElement('img');
                          img.src = creator.avatar_url || 'https://via.placeholder.com/400x500';
                          img.className = 'w-full h-full object-cover';
                          parent.appendChild(img);
                        }
                      }}
                    />
                  ) : (
                    <img
                      src={creator.avatar_url}
                      alt={creator.username}
                      className="w-full h-full object-cover opacity-80"
                    />
                  )}
                  
                  {/* Elite Verified Overlay Badge */}
                  {creator.is_elite_verified && (
                    <div className="absolute top-4 left-4 bg-emerald-800 text-emerald-100 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                      <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                      Elite Verified
                    </div>
                  )}

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                      <Play className="w-5 h-5 text-emerald-800 fill-emerald-800 ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Creator Details overlay on video */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 text-white pt-20 pointer-events-none">
                    <div className="flex items-center gap-3 mb-2">
                      <img 
                        src={creator.avatar_url} 
                        alt={creator.username} 
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          {creator.first_name} {creator.last_name || ''}
                        </h3>
                        <p className="text-xs text-amber-300">@{creator.username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creator Stats */}
                <div className="p-6 bg-white flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                      "{creator.bio || 'Healthy recipe developer & kitchen vlogger.'}"
                    </p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Followers</p>
                        <p className="font-black text-sm text-slate-800">{formatFollowers(creator.followers_count)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Views</p>
                        <p className="font-black text-sm text-slate-800">{formatViews(creator.avg_views)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eng. Rate</p>
                        <p className="font-black text-sm text-slate-800">
                          {creator.engagement_rate && creator.engagement_rate > 0 ? `${creator.engagement_rate}%` : '---'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/${creator.username}`}
                    className="mt-6 w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Verified Media Kit
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightweight Operations section (The Core Moat) */}
      <section className="bg-emerald-950 py-24 px-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-70 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Naturally Yours loves collaborating through Creator Armour 🚀
            </h2>
            <p className="text-emerald-100/70 leading-relaxed text-sm">
              We handle the heavy lifting (logistics, coordination, follow-ups) so your marketing team can focus on scaling Noodles Reinvented.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {flowSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-md mb-6">
                  <step.icon className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-emerald-100/60 leading-relaxed text-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 px-6 bg-[#FCFBF7]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brandBenefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-[32px] border border-emerald-950/5 bg-white shadow-xs"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-xs mb-6">
                  <benefit.icon className="w-6 h-6 text-emerald-800" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed text-xs">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Call To Action Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-20 p-12 rounded-[40px] bg-slate-900 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent" />
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4 relative z-10">Start your Naturally Yours pilot campaign</h2>
            <p className="text-amber-100/70 max-w-xl mx-auto mb-8 relative z-10">
              Get all 19 verified healthy-recipe and organic cooking creators for your next whole-wheat and moringa noodles campaign.
            </p>
            <Link 
              to="/signup?mode=brand" 
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold py-4 px-8 rounded-2xl hover:bg-amber-50 transition-colors relative z-10"
            >
              Get Started with Naturally Yours Shortlist
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default NaturallyYoursPitch;
