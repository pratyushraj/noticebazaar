
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Zap, Eye, TrendingUp, 
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  Star, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Creator {
  id: string;
  username: string;
  first_name: string;
  last_name?: string;
  avatar_url: string;
  bio: string;
  location: string;
  creator_category?: string;
  followers_count: number;
  discovery_video_url: string;
  is_verified: boolean;
  starting_price?: number;
  avg_reel_views_manual?: number;
  barter_min_value?: number;
}

export const FeaturedCreators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const getInstagramEmbedUrl = (href: string) => {
    try {
      const url = new URL(href)
      if (!url.hostname.includes('instagram.com')) return ''
      const cleanedPath = url.pathname.replace(/\/+$/, '')
      if (/\/(reel|reels|p)\//i.test(cleanedPath)) {
        return `https://www.instagram.com${cleanedPath}/embed`
      }
    } catch {
      return ''
    }
    return ''
  }

  const isPortfolioVideoUrl = (value: string) =>
    /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(value || '').trim())

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      try {
        // Fetch creators with discovery reels
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url, bio, location, creator_category, followers_count, discovery_video_url, is_verified, starting_price, avg_reel_views_manual, barter_min_value')
          .not('discovery_video_url', 'is', null)
          .neq('discovery_video_url', '')
          .neq('username', 'democreator')
          .order('created_at', { ascending: true })
          .limit(5);

        if (error) throw error;
        setCreators(data as Creator[]);
      } catch (err) {
        console.error('Error fetching featured creators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  const currentCreator = creators[currentIndex];

  const nextCreator = () => {
    triggerHaptic(HapticPatterns.light);
    setCurrentIndex((prev) => (prev + 1) % creators.length);
  };

  const prevCreator = () => {
    triggerHaptic(HapticPatterns.light);
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
  };

  if (loading || creators.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-50 blur-[120px] rounded-full opacity-60" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-50 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 mb-4">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Featured Discovery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
              Discover your next <br />
              <span className="text-emerald-600">viral partner</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={prevCreator}
              className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <button 
              onClick={nextCreator}
              className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center hover:bg-black transition-colors shadow-lg shadow-slate-900/10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Video Showcase (7 cols) */}
          <div className="lg:col-span-7 relative group">
            <div className="aspect-[4/5] md:aspect-[16/10] rounded-[48px] overflow-hidden bg-slate-100 shadow-2xl relative border-8 border-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCreator.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  {isPortfolioVideoUrl(currentCreator.discovery_video_url) ? (
                    <video
                      ref={videoRef}
                      src={currentCreator.discovery_video_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                    />
                  ) : getInstagramEmbedUrl(currentCreator.discovery_video_url) ? (
                    <iframe
                      src={getInstagramEmbedUrl(currentCreator.discovery_video_url)}
                      className="w-full h-full border-none"
                      allowTransparency
                      scrolling="no"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-400">Video not available</span>
                    </div>
                  )}
                  
                  {/* Video Overlay Controls - only for native video */}
                  {isPortfolioVideoUrl(currentCreator.discovery_video_url) && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-8 right-8 flex items-center gap-3 pointer-events-auto">
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Creator Quick Badge */}
                  <div className="absolute bottom-8 left-8 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-lg bg-slate-200">
                      <img 
                        src={currentCreator.avatar_url || `https://ui-avatars.com/api/?name=${currentCreator.first_name}+${currentCreator.last_name || ''}&background=random`} 
                        className="w-full h-full object-cover" 
                        alt={currentCreator.username}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentCreator.first_name}+${currentCreator.last_name || ''}&background=random`;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-lg leading-none mb-1 flex items-center gap-1.5">
                        {currentCreator.first_name} {currentCreator.last_name || ''}
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-white" />
                      </h4>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest">@{currentCreator.username}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Stats */}
            <div className="absolute -top-6 -right-6 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 hidden md:block z-20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Engagement</p>
                    <p className="text-base font-black text-slate-900">High Impact</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Views</p>
                    <p className="text-base font-black text-slate-900">
                      {currentCreator.avg_reel_views_manual ? `${(currentCreator.avg_reel_views_manual / 1000).toFixed(1)}K+` : '12K+'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info & CTA (5 cols) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCreator.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
                    {currentCreator.creator_category || 'Lifestyle'}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                    {currentCreator.location}
                  </span>
                </div>



                <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                  Join the top brands collaborating with {currentCreator.first_name}. 
                  Get structured offers, verified delivery, and payment protection.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-10">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Paid Starts</p>
                    <p className="text-lg font-black text-slate-900">₹{currentCreator.starting_price?.toLocaleString() || '2,000'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Min. Barter</p>
                    <p className="text-lg font-black text-slate-900">₹{currentCreator.barter_min_value?.toLocaleString() || '1,500'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Followers</p>
                    <p className="text-lg font-black text-slate-900">{(currentCreator.followers_count / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg. Views</p>
                    <p className="text-lg font-black text-slate-900">
                      {currentCreator.avg_reel_views_manual ? `${(currentCreator.avg_reel_views_manual / 1000).toFixed(1)}K+` : '12K+'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link 
                    to={`/${currentCreator.username}`}
                    className="w-full sm:w-auto h-16 px-10 rounded-full bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    Send Offer <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link 
                    to={`/${currentCreator.username}`}
                    className="w-full sm:w-auto h-16 px-8 rounded-full border border-slate-200 text-slate-600 font-black text-base hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    View Portfolio
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
