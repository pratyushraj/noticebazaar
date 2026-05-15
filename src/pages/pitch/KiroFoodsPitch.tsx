import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Instagram, Play, Star, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
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

const KiroFoodsPitch = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const formatFollowers = (n?: number | null) => {
    if (n === null || n === undefined || Number.isNaN(n) || n === 0) return 'Verified';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, business_name, avatar_url, followers_count, engagement_rate, avg_views, is_elite_verified, creator_category, location, discovery_video_url, bio')
          .in('username', ['shavy.0404', 'blogsbysnehaaa', 'rohit_cheeku_bhandari']);
          
        if (error) throw error;

        // Order them exactly as requested if possible, or leave as returned
        const orderedData = [];
        const order = ['rohit_cheeku_bhandari', 'blogsbysnehaaa', 'shavy.0404'];
        
        if (data) {
          order.forEach(username => {
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

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-rose-500/30">
      <SEOHead 
        title="CreatorArmour x Kiro Foods" 
        description="Curated creator profiles specifically shortlisted for Kiro Foods."
        noindex={true}
      />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-black tracking-tighter text-2xl text-slate-900">CreatorArmour</span>
            <span className="text-slate-300">×</span>
            <span className="font-black tracking-tight text-2xl text-rose-500">Kiro Foods</span>
          </div>
          <a href="https://creatorarmour.com" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Powered by CreatorArmour
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-slate-900 tracking-tight mb-6"
          >
            Curated Creator Roster
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 max-w-2xl leading-relaxed"
          >
            We've hand-picked these three exceptional creators whose audience demographics and content style perfectly align with the Kiro Foods brand ethos.
          </motion.p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[500px]">
                <Skeleton className="w-full h-48 rounded-2xl mb-6" />
                <Skeleton className="w-3/4 h-8 mb-4" />
                <Skeleton className="w-1/2 h-4 mb-8" />
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {creators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="group bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col"
              >
                {/* Image / Video Container */}
                <div className="relative aspect-[4/5] mb-6 rounded-2xl overflow-hidden bg-slate-100">
                  {creator.discovery_video_url ? (
                    <video 
                      src={creator.discovery_video_url} 
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      onMouseOver={e => (e.target as HTMLVideoElement).play()}
                      onMouseOut={e => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img 
                      src={creator.avatar_url || 'https://via.placeholder.com/400x500'} 
                      alt={creator.business_name || creator.first_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60" />
                  
                  {/* Elite Badge */}
                  {creator.is_elite_verified && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-lg px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Elite</span>
                    </div>
                  )}

                  {/* Name & Title inside image */}
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      {creator.first_name} {creator.last_name}
                      <BadgeCheck className="w-5 h-5 text-blue-400" />
                    </h2>
                    <p className="text-white/80 text-sm font-medium line-clamp-1">{creator.creator_category || 'Content Creator'}</p>
                  </div>
                  
                  {/* Play Icon Hint for Video */}
                  {creator.discovery_video_url && (
                    <div className="absolute inset-0 m-auto w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Play className="w-5 h-5 text-white ml-1 fill-white" />
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <div className="font-bold text-slate-900 text-lg leading-none">{formatFollowers(creator.followers_count)}</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">Followers</div>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                    <div className="font-bold text-rose-600 text-lg leading-none">{creator.engagement_rate || 0}%</div>
                    <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mt-1">Engagement</div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <Play className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <div className="font-bold text-slate-900 text-lg leading-none">{formatFollowers(creator.avg_views)}</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">Avg Views</div>
                  </div>
                </div>
                
                {/* Bio snippet */}
                <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-2">
                  {creator.bio || 'Dynamic content creator open to authentic collaborations.'}
                </p>

                {/* Action */}
                <div className="mt-auto">
                  <Link 
                    to={`/${creator.username}`}
                    target="_blank"
                    className="flex items-center justify-between w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-6 rounded-2xl transition-colors group/btn"
                  >
                    <span>View Full Profile</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default KiroFoodsPitch;
