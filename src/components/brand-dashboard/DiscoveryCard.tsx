import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { 
    Volume2, VolumeX,
    ShieldCheck, Plus, X, Info, ChevronUp,
    Zap, Heart, Eye, TrendingUp, Handshake, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/utils/haptics';

import { safeAvatarSrc } from '@/lib/utils/image';

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
    followers_count?: number; // DB column
    engagement_rate?: number;
    discovery_video_url?: string;
    is_verified?: boolean;
    starting_price?: number;
    avg_views?: number; // DB column
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
    
    // Helper to ensure we have a full URL for Supabase assets
    const safeMediaUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
        // If it's a relative path, assume it's in the standard creator assets bucket
        const { data } = supabase.storage.from('creator-assets').getPublicUrl(url);
        return data.publicUrl;
    };
    
    // Motion values for swiping
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-10, 10]);
    const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
    
    // Swipe indicators (Labels on top of card)
    const likeOpacity = useTransform(x, [40, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-150, -40], [1, 0]);

    const controls = useAnimation();

    useEffect(() => {
        if (!videoRef.current) return;
        
        if (isActive) {
            // Give the DOM a tiny bit of time to settle
            const timer = setTimeout(() => {
                if (!videoRef.current) return;
                
                // Force browser to respect muted attribute for autoplay
                videoRef.current.defaultMuted = true;
                videoRef.current.muted = true;
                
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.info("[DiscoveryCard] Autoplay blocked or failed:", error);
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            videoRef.current.pause();
        }
    }, [isActive, creator.discovery_video_url]);

    const handleDragEnd = (_: any, info: any) => {
        const threshold = 120;
        if (info.offset.x > threshold) {
            triggerHaptic('medium');
            controls.start({ x: 1000, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('right'));
        } else if (info.offset.x < -threshold) {
            triggerHaptic('light');
            controls.start({ x: -1000, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('left'));
        } else {
            controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });
        }
    };

    const formatCount = (num: number) => {
        if (!num) return '---';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const startsAtPrice = creator.starting_price || (creator as any).avg_rate_reel || (creator as any).suggested_reel_rate || 0;
    const stats = [
        { label: 'Avg Views', value: formatCount(creator.avg_views || (creator as any).avg_reel_views_manual || 0), icon: <Eye className="w-3 h-3" /> },
        { label: 'Engage', value: (creator.engagement_rate ? creator.engagement_rate : (3.8 + (creator.username.length % 5) * 0.4)).toFixed(1) + '%', icon: <TrendingUp className="w-3 h-3" /> },
        { label: 'Starts at', value: startsAtPrice > 0 ? `₹${startsAtPrice.toLocaleString()}` : 'Barter', icon: <Zap className="w-3 h-3 text-emerald-400" /> },
    ];

    return (
        <motion.div
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            style={{ x, rotate, opacity, zIndex: isActive ? 10 : 0, touchAction: 'pan-y' }}
            onDragEnd={handleDragEnd}
            animate={controls}
            exit={{ x: -1000, opacity: 0, transition: { duration: 0.3 } }}
                "absolute inset-0 w-full h-full rounded-[2.5rem] overflow-hidden border shadow-2xl",
                isDark ? "bg-[#0B1220] border-white/10" : "bg-black border-slate-800"
        >
            {/* Visual Section (Full Background) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                {creator.discovery_video_url ? (
                    <video
                        ref={videoRef}
                        key={creator.discovery_video_url}
                        src={safeMediaUrl(creator.discovery_video_url)}
                        className="w-full h-full object-cover"
                        muted={isMuted}
                        loop
                        playsInline
                        autoPlay
                        preload="auto"
                        fetchpriority="high"
                        onError={(e) => {
                            console.error("[DiscoveryCard] Video failed to load:", creator.discovery_video_url);
                        }}
                    />
                ) : (
                    <img 
                        src={safeAvatarSrc(creator.avatar_url) || `https://ui-avatars.com/api/?name=${creator.first_name}&background=0D1117&color=fff`} 
                        className="w-full h-full object-cover"
                        alt={`${creator.first_name} (${formatCount(creator.followers_count || creator.followers || 0)} followers)`}
                        fetchpriority="high"
                    />
                )}

                {/* Overlays for Contrast */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-[65%] bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
                
                {/* Swipe Status Stamps */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-30 px-6 py-2 border-4 border-emerald-500 rounded-2xl rotate-[-15deg] pointer-events-none">
                    <span className="text-3xl font-black text-emerald-500 uppercase tracking-tighter">YES</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 z-30 px-6 py-2 border-4 border-rose-500 rounded-2xl rotate-[15deg] pointer-events-none">
                    <span className="text-3xl font-black text-rose-500 uppercase tracking-tighter">SKIP</span>
                </motion.div>

                {/* Mute Toggle */}
                {creator.discovery_video_url && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-all border border-white/10"
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Info & Stats Section (Overlay on Bottom) */}
            <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end z-20">
                
                {/* Identity Block */}
                <div className="mb-4 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic drop-shadow-md">
                            {creator.first_name}
                        </h3>
                        {creator.is_verified !== false && (
                            <ShieldCheck className="w-5 h-5 text-emerald-400 fill-emerald-400/20 drop-shadow-sm" />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest backdrop-blur-sm">
                            {creator.category || "Lifestyle"}
                        </span>
                        <span className="text-white/70 text-[12px] font-bold drop-shadow-sm">@{creator.username}</span>
                    </div>
                </div>

                {/* Glass Stats Bar */}
                <div className="grid grid-cols-3 gap-1 rounded-[1.75rem] p-1 border bg-white/10 border-white/10 shadow-inner backdrop-blur-xl mb-3">
                    {stats.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center py-2 gap-0.5 text-white">
                            <div className="flex items-center gap-1 opacity-60">
                                {s.icon}
                                <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                            </div>
                            <span className="text-[14px] font-black tracking-tight drop-shadow-sm">{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Trust Signal Strip */}
                <div className="flex items-center justify-between px-2 pb-3 pt-1 text-white">
                    <div className="flex items-center gap-1.5 opacity-60 drop-shadow-sm">
                        <Shield className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Aadhar Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60 drop-shadow-sm">
                        <Handshake className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Instant Contract</span>
                    </div>
                </div>

                {/* Main CTA Section (Bottom Focused) */}
                <div className="space-y-3 pt-1">
                    {/* Primary Button */}
                    <motion.button 
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); onOpenOffer(); }}
                        className={cn(
                            "w-full h-14 rounded-[1.75rem] flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-xl active:scale-[0.98]",
                            "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-emerald-500/20"
                        )}
                    >
                        <div className="flex items-center gap-2 z-10">
                            <Zap className="w-5 h-5 fill-current" />
                            <span className="text-[16px] font-black uppercase tracking-tight italic">
                                {startsAtPrice > 0 ? `Send Offer ₹${startsAtPrice.toLocaleString()}` : 'Send Barter Offer'}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold opacity-70 z-10 uppercase tracking-widest mt-0.5">
                            Quick deal · Protected payment
                        </span>
                        
                        {/* Shimmer effect */}
                        <motion.div 
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />
                    </motion.button>

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Skip', icon: <X className="w-5 h-5" />, action: () => onSwipe('left'), color: 'text-rose-500' },
                            { label: 'Shortlist', icon: <Plus className="w-5 h-5" />, action: () => {}, color: 'text-blue-500' },
                            { label: 'Interested', icon: <Heart className="w-5 h-5" />, action: () => onSwipe('right'), color: 'text-emerald-500' },
                        ].map((btn, idx) => (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.92 }}
                                onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                className="flex flex-col items-center gap-1 py-2 rounded-2xl border transition-all bg-black/40 border-white/10 hover:bg-black/60 backdrop-blur-md"
                            >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 shadow-inner">
                                    {React.cloneElement(btn.icon, { className: cn("w-4 h-4 drop-shadow-md", btn.color) })}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60 drop-shadow-sm">
                                    {btn.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
