import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { 
    Volume2, VolumeX,
    Sparkles, ShieldCheck, Plus, X, Info, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorProfile {
    id: string;
    username: string;
    first_name: string;
    last_name?: string;
    avatar_url: string;
    bio: string;
    location: string;
    category?: string;
    followers: number;
    engagement_rate?: number;
    discovery_video_url?: string;
    is_verified?: boolean;
    starting_price?: number;
}

interface DiscoveryCardProps {
    creator: CreatorProfile;
    isDark: boolean;
    onSwipe: (direction: 'left' | 'right') => void;
    isActive: boolean;
    onOpenOffer: () => void;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ 
    creator, 
    isDark, 
    onSwipe,
    isActive,
    onOpenOffer
}) => {
    const [isMuted, setIsMuted] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Motion values for swiping
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-18, 18]);
    const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
    
    // Swipe indicators
    const likeOpacity = useTransform(x, [30, 120], [0, 1]);
    const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);
    const likeScale = useTransform(x, [30, 120], [0.5, 1]);
    const nopeScale = useTransform(x, [-120, -30], [1, 0.5]);

    const controls = useAnimation();

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => {});
        } else if (!isActive && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isActive]);

    const handleDragEnd = (_: any, info: any) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            controls.start({ x: 800, opacity: 0, transition: { duration: 0.25 } }).then(() => onSwipe('right'));
        } else if (info.offset.x < -threshold) {
            controls.start({ x: -800, opacity: 0, transition: { duration: 0.25 } }).then(() => onSwipe('left'));
        } else {
            controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
        }
    };

    const formatCount = (num: number) => {
        if (!num) return '---';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <motion.div
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            style={{ x, rotate, opacity, zIndex: isActive ? 10 : 0, touchAction: 'pan-y' }}
            onDragEnd={handleDragEnd}
            animate={controls}
            className="absolute inset-0 w-full h-full rounded-[28px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
            {/* Full-screen Background — Video or Avatar Image */}
            <div className="absolute inset-0 z-0">
                {creator.discovery_video_url ? (
                    <video
                        ref={videoRef}
                        src={creator.discovery_video_url}
                        className="w-full h-full object-cover"
                        muted={isMuted}
                        loop
                        playsInline
                    />
                ) : creator.avatar_url ? (
                    <img 
                        src={creator.avatar_url} 
                        alt={creator.first_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#061018] flex items-center justify-center">
                        <div className="text-8xl font-black text-white/10 select-none">
                            {(creator.first_name || 'C')[0].toUpperCase()}
                        </div>
                    </div>
                )}
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent z-10" />
            </div>

            {/* LIKE / NOPE Stamps */}
            <motion.div 
                style={{ opacity: likeOpacity, scale: likeScale }}
                className="absolute top-16 left-6 z-30 px-5 py-2 border-[3px] border-emerald-400 text-emerald-400 font-black text-2xl uppercase tracking-tight rounded-lg transform -rotate-12 pointer-events-none"
            >
                LIKE
            </motion.div>
            <motion.div 
                style={{ opacity: nopeOpacity, scale: nopeScale }}
                className="absolute top-16 right-6 z-30 px-5 py-2 border-[3px] border-rose-500 text-rose-500 font-black text-2xl uppercase tracking-tight rounded-lg transform rotate-12 pointer-events-none"
            >
                NOPE
            </motion.div>

            {/* Mute Toggle — top right */}
            {creator.discovery_video_url && (
                <div className="absolute top-5 right-5 z-30">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 active:scale-90 transition-transform"
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>
            )}

            {/* Bottom Content Overlay */}
            <div className="absolute bottom-0 inset-x-0 z-20 p-5 pb-6">
                {/* Name + Category */}
                <div className="flex items-end gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[28px] font-extrabold text-white leading-none tracking-tight">
                                {creator.first_name || creator.username}
                            </h3>
                            {creator.is_verified && (
                                <ShieldCheck className="w-5 h-5 text-emerald-400 fill-emerald-400/20 shrink-0" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-white/50">@{creator.username}</span>
                            {creator.category && (
                                <>
                                    <span className="text-white/20">·</span>
                                    <span className="text-[11px] font-semibold text-emerald-400/80">{creator.category}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 active:scale-90 transition-transform shrink-0"
                    >
                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </button>
                </div>

                {/* Compact Stats Row */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white/35 uppercase">Reach</span>
                        <span className="text-[13px] font-bold text-white">{formatCount(creator.followers || (creator as any).followers_count || 0)}</span>
                    </div>
                    <span className="text-white/15">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white/35 uppercase">Views</span>
                        <span className="text-[13px] font-bold text-white">{formatCount((creator as any).avg_reel_views_manual || 0)}</span>
                    </div>
                    <span className="text-white/15">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white/35 uppercase">From</span>
                        <span className="text-[13px] font-bold text-emerald-400">₹{Number(creator.starting_price || (creator as any).avg_rate_reel || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Expandable Bio */}
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                    >
                        <p className="text-[12px] font-medium text-white/60 leading-relaxed line-clamp-3">
                            {creator.bio || (creator as any).intro_line || "Content creator open to collaborations."}
                        </p>
                    </motion.div>
                )}

                {/* Action Buttons — small & compact like Tinder */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSwipe('left'); }}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-all hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenOffer(); }}
                        className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold text-[12px] tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        Send Offer
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSwipe('right'); }}
                        className="w-12 h-12 rounded-full bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/20 flex items-center justify-center text-emerald-400 active:scale-90 transition-all hover:bg-emerald-500/30"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
