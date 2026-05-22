import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Play, Pause, Share2, ShieldCheck, Grid, Layers, 
  ExternalLink, CheckCircle2, Flame, Users, Sparkles,
  Search, SlidersHorizontal, Volume2, VolumeX, ArrowLeft,
  Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  is_verified?: boolean;
  discovery_video_url?: string | null;
  bio?: string | null;
  content_vibes?: string[] | null;
}

// Custom Video Player component with IntersectionObserver to only autoplay when visible
const AutoplayVideoCard = ({ 
  creator, 
  isGlobalMuted, 
  onToggleMute,
  onShare
}: { 
  creator: Creator; 
  isGlobalMuted: boolean; 
  onToggleMute: () => void;
  onShare: (username: string) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false));
              }
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 } // Play when at least 50% of the card is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    triggerHaptic(HapticPatterns.light);
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleLocalShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(creator.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <motion.div 
      ref={containerRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-[#061B15]/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-emerald-500/10 shadow-2xl hover:border-emerald-500/30 transition-all duration-300 aspect-[9/16] flex flex-col justify-end"
    >
      {/* Background Autoplay Video */}
      {creator.discovery_video_url ? (
        <div className="absolute inset-0 w-full h-full bg-slate-950">
          <video
            ref={videoRef}
            src={creator.discovery_video_url}
            className="w-full h-full object-cover"
            loop
            muted={isGlobalMuted}
            playsInline
            preload="metadata"
            onClick={handlePlayPause}
          />
          {/* Custom Action Overlays on Video */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(HapticPatterns.light);
                onToggleMute();
              }}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all"
            >
              {isGlobalMuted ? <VolumeX className="w-4 h-4 text-emerald-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={handleLocalShare}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all relative"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Share2 className="w-4 h-4 text-white" />}
            </button>
          </div>

          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-md">
              {creator.creator_category || "Lifestyle"}
            </span>
          </div>

          {/* Large Center Play/Pause Indicator (Only shows momentarily or when paused) */}
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-all cursor-pointer z-10"
          >
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/80 backdrop-blur-md flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-[#061B15]">
          <img
            src={safeAvatarSrc(creator.avatar_url, `${creator.first_name}`)}
            alt={creator.first_name}
            className="w-full h-full object-cover opacity-60 filter grayscale group-hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleLocalShare}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
            </button>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-md">
              {creator.creator_category || "Creator"}
            </span>
          </div>
        </div>
      )}

      {/* Glassmorphic Profile Card Overlay */}
      <div className="relative z-20 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white tracking-tight leading-none">
              {creator.first_name} {creator.last_name || ""}
            </h3>
            {creator.is_verified && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-black shrink-0" />
            )}
          </div>
          <p className="text-emerald-400/80 text-xs font-black uppercase tracking-widest mt-1">
            @{creator.username}
          </p>
        </div>

        {creator.bio && (
          <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}

        {/* Dynamic Vibe Tags */}
        {creator.content_vibes && creator.content_vibes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {creator.content_vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/5">
                #{vibe}
              </span>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-2 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-3 text-center mt-2">
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Followers</p>
            <p className="text-sm font-black text-white mt-0.5">
              {formatFollowers(creator.followers_count || creator.instagram_followers)}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Avg. Views</p>
            <p className="text-sm font-black text-emerald-400 mt-0.5">
              {formatViews(creator.avg_reel_views_manual || creator.avg_views)}
            </p>
          </div>
        </div>

        {/* Portfolio Button */}
        <Link
          to={`/${creator.username}`}
          className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all mt-2"
        >
          View Full Portfolio <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};

const AutoplayDirectory = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [showOnlyWithVideo, setShowOnlyWithVideo] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Categories list derived dynamically
  const categories = ["All", "Tech", "Fitness", "Travel", "Fashion", "Beauty", "Pet Care", "Food & Travel", "Motherhood"];

  useEffect(() => {
    // Cast and cast fallback arrays
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
      is_verified: c.is_verified,
      discovery_video_url: c.discovery_video_url,
      bio: c.bio,
      content_vibes: c.content_vibes
    }));

    // Filter to hide dummy accounts if necessary or prioritize active profiles
    const creatorsWithProfile = mapped.filter(c => c.username);
    setCreators(creatorsWithProfile);
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...creators];

    // Video Filter
    if (showOnlyWithVideo) {
      result = result.filter(c => c.discovery_video_url);
    }

    // Category Filter
    if (selectedCategory !== "All") {
      result = result.filter(c => 
        String(c.creator_category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search Query Filter
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.first_name.toLowerCase().includes(query) || 
        (c.last_name && c.last_name.toLowerCase().includes(query)) ||
        c.username.toLowerCase().includes(query) ||
        (c.bio && c.bio.toLowerCase().includes(query))
      );
    }

    setFilteredCreators(result);
  }, [creators, searchTerm, selectedCategory, showOnlyWithVideo]);

  const handleShareCreator = (username: string) => {
    triggerHaptic(HapticPatterns.medium);
    const link = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(link).then(() => {
      setShareToast(`Copied @${username}'s live portfolio link!`);
      setTimeout(() => setShareToast(null), 3000);
    });
  };

  const handleShareDirectory = () => {
    triggerHaptic(HapticPatterns.medium);
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setShareToast("Copied Autoplay Directory link!");
      setTimeout(() => setShareToast(null), 3000);
    });
  };

  return (
    <div className="min-h-dvh bg-[#020D0A] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Dynamic Popup Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-emerald-500 text-black text-sm font-black rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Section */}
      <header className="sticky top-0 z-40 bg-[#020D0A]/85 backdrop-blur-xl border-b border-emerald-500/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              onClick={() => triggerHaptic(HapticPatterns.light)} 
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-md font-black tracking-tight text-white leading-none">Creator Armour</h1>
                <p className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase mt-1">Autoplay Directory</p>
              </div>
            </Link>
          </div>

          {/* Quick Search Panel */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search creator name, bio, niche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#061B15] border border-emerald-500/10 focus:border-emerald-500/30 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
              <button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setShowOnlyWithVideo(!showOnlyWithVideo);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                  showOnlyWithVideo 
                    ? "bg-emerald-500 text-black border-emerald-400" 
                    : "bg-[#061B15] text-slate-300 border-emerald-500/10 hover:border-emerald-500/30"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Video Reels Only</span>
              </button>

              <button
                onClick={handleShareDirectory}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share List</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Filter Bubbles */}
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 overflow-x-auto scrollbar-none flex items-center gap-2 select-none border-b border-emerald-500/5">
        <SlidersHorizontal className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setSelectedCategory(category);
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === category
                ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/10"
                : "bg-[#061B15] text-slate-400 hover:text-white border border-emerald-500/5 hover:border-emerald-500/10"
            }`}
          >
            {category}
          </button>
        ))}
      </nav>

      {/* Main Grid Section */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        
        {/* Dynamic Context Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Restored Creator Showcase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Showing {filteredCreators.length} of {creators.length} premium creators in high-fidelity vertical layouts
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#061B15] border border-emerald-500/10 rounded-2xl p-1.5">
            <button
              onClick={() => setIsGlobalMuted(!isGlobalMuted)}
              className="px-3 py-1.5 bg-black/40 rounded-xl text-xs font-bold flex items-center gap-2 text-slate-300 hover:text-white transition-all"
            >
              {isGlobalMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Unmute All</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mute All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <AnimatePresence mode="popLayout">
          {filteredCreators.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filteredCreators.map((creator) => (
                <AutoplayVideoCard
                  key={creator.id}
                  creator={creator}
                  isGlobalMuted={isGlobalMuted}
                  onToggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
                  onShare={handleShareCreator}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-center py-20 bg-[#061B15]/25 border border-emerald-500/5 rounded-3xl"
            >
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">No Creators Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">
                We couldn't find any creators matching your current search terms or category selection.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                  setShowOnlyWithVideo(false);
                }}
                className="mt-6 px-5 py-2.5 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                Reset Search Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-emerald-500/10 text-center bg-[#010806]/60">
        <div className="max-w-[1400px] mx-auto px-4 text-slate-500 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">Creator Armour Inc.</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">
            <Link to="/" className="hover:text-emerald-400">Home</Link>
            <span>·</span>
            <Link to="/barter" className="hover:text-emerald-400">Barter Directory</Link>
            <span>·</span>
            <a href="https://github.com/pratyushraj/noticebazaar" target="_blank" rel="noreferrer" className="hover:text-emerald-400">GitHub Codebase</a>
          </div>
          <p>© {new Date().getFullYear()} Creator Armour · Deployed with Local Autoplay Sync</p>
        </div>
      </footer>
    </div>
  );
};

export default AutoplayDirectory;
