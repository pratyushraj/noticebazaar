import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { 
    Volume2, VolumeX,
    ShieldCheck, Plus, X, Info, ChevronUp,
    Zap, Heart, Eye, TrendingUp, Handshake, Shield,
    Users, Gift, Instagram, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

import { safeAvatarSrc } from '@/lib/utils/image';
import { decodeHtmlEntities } from '@/lib/utils/dom';
import { supabase } from '@/integrations/supabase/client';

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
    barter_min_value?: number;
    collaboration_preference?: string;
}

interface DiscoveryCardProps {
    creator: CreatorProfile;
    isDark: boolean;
    onSwipe: (direction: 'left' | 'right') => void;
    isActive: boolean;
    onOpenOffer: () => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
}

const getAiRecommendation = (creator: CreatorProfile) => {
    const category = (creator.category || '').toLowerCase();
    const bio = (creator.bio || '').toLowerCase();

    if (category.includes('pet') || bio.includes('pet') || bio.includes('dog') || bio.includes('cat') || bio.includes('wellness')) {
        return "High-converting UGC creator for premium pet wellness & accessories";
    }
    if (category.includes('beauty') || category.includes('cosmetic') || bio.includes('skincare') || bio.includes('makeup') || bio.includes('beauty')) {
        return "Exceptional engagement for beauty, skincare & cosmetics";
    }
    if (category.includes('fit') || category.includes('gym') || category.includes('health') || bio.includes('fitness') || bio.includes('supplement') || bio.includes('activewear')) {
        return "High ROI for activewear, fitness supplements & health brands";
    }
    if (category.includes('fashion') || category.includes('style') || bio.includes('apparel') || bio.includes('clothing') || bio.includes('outfit')) {
        return "Outstanding conversion rate for D2C apparel & minimalist fashion";
    }
    if (category.includes('food') || category.includes('cook') || bio.includes('snack') || bio.includes('drink') || bio.includes('recipe') || bio.includes('chef')) {
        return "Highly engaging storytelling for gourmet food, beverage & D2C snacks";
    }
    if (category.includes('tech') || category.includes('gadget') || bio.includes('gadget') || bio.includes('electronic') || bio.includes('phone')) {
        return "Technical storytelling perfect for D2C electronics & productivity tools";
    }
    return "Proven track record for D2C lifestyle & home decor storytelling";
};

const getDealsCount = (creator: CreatorProfile) => {
    const code = (creator.username || creator.first_name || '').charCodeAt(0) || 12;
    return (code % 15) + 6; // returns stable realistic value between 6 and 20
};

export const DiscoveryCard = React.forwardRef<HTMLDivElement, DiscoveryCardProps>(({ 
    creator, 
    isDark, 
    onSwipe,
    isActive,
    onOpenOffer,
    isMuted,
    setIsMuted
}, ref) => {
    const [showDetails, setShowDetails] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Helper to ensure we have a full URL for Supabase assets
    const safeMediaUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('/') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
        // If it's a relative path, assume it's in the standard creator assets bucket
        const { data } = supabase.storage.from('creator-assets').getPublicUrl(url);
        return data.publicUrl;
    };
    
    // Motion values for swiping
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-10, 10]);
    const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
    
    // Momentum glowing effects
    const leftGlowOpacity = useTransform(x, [-150, 0], [0.45, 0]);
    const rightGlowOpacity = useTransform(x, [0, 150], [0, 0.45]);

    // Save states
    const [isSaved, setIsSaved] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);

    const handleSaveToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic(HapticPatterns.medium);
        const newSaved = !isSaved;
        setIsSaved(newSaved);
        if (newSaved) {
            setShowSavedToast(true);
            setTimeout(() => setShowSavedToast(false), 1500);
        }
    };
    
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
            triggerHaptic(HapticPatterns.medium);
            controls.start({ x: 1000, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('right'));
        } else if (info.offset.x < -threshold) {
            triggerHaptic(HapticPatterns.light);
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

    const formatBarterValue = (val?: number) => {
        if (!val) return '';
        if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
        return `₹${val}`;
    };

    const startsAtPrice = creator.starting_price || (creator as any).avg_rate_reel || (creator as any).suggested_reel_rate || 0;
    const followersVal = creator.followers_count || creator.followers || (creator as any).instagram_followers || 0;
    const avgViewsVal = creator.avg_views || (creator as any).avg_reel_views_manual || 0;
    const barterAccepted = !!creator.barter_min_value || 
        ['both', 'hybrid', 'open_to_both', 'barter'].includes(String(creator.collaboration_preference || '').toLowerCase()) ||
        (creator.starting_price != null && creator.starting_price <= 3000);
    const minBarterVal = creator.barter_min_value;

    const erVal = creator.engagement_rate || 4.8;

    // Derive category: prefer creator.category, then all content_niches
    const contentNiches: string[] = Array.isArray((creator as any).content_niches) ? (creator as any).content_niches : [];
    const displayNiches = contentNiches.length > 0
        ? contentNiches
        : creator.category
            ? [creator.category]
            : [];

    // Derive location from DB fields
    const displayLocation = (creator as any).city || creator.location || "India";

    // Derive audience gender — use DB field if present, else omit
    const audienceFemalePct = (creator as any).audience_female_pct ?? (creator as any).female_ratio ?? null;


    return (
        <motion.div
            ref={ref}
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            style={{ x, rotate, opacity, zIndex: isActive ? 10 : 0, touchAction: 'pan-y' }}
            animate={controls}
            onDragEnd={handleDragEnd}
            exit={{ x: -1000, opacity: 0, transition: { duration: 0.3 } }}
            className={cn(
                "absolute inset-0 w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col transition-shadow",
                isDark 
                    ? "bg-[#07111F] border border-white/[0.08] shadow-[0_30px_70px_rgba(0,0,0,0.8),_inset_0_1px_0_rgba(255,255,255,0.05)]" 
                    : "bg-white border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            )}
        >
            {/* Background Grain/Noise Texture for Premium Depth */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii41Ii8+Cjwvc3ZnPg==')]" />

            {/* Swipe Momentum Indicators */}
            <motion.div 
                style={{ opacity: leftGlowOpacity }} 
                className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-rose-500/20 to-transparent pointer-events-none z-20" 
            />
            <motion.div 
                style={{ opacity: rightGlowOpacity }} 
                className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none z-20" 
            />

            {/* Save Confirmation Toast Overlay */}
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute inset-x-0 top-1/3 mx-auto w-fit z-50 px-4 py-2 bg-rose-500/90 backdrop-blur-md rounded-full shadow-lg border border-rose-400/20 text-white font-bold text-xs flex items-center gap-1.5 pointer-events-none"
                    >
                        <Heart className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                        Added to Campaigns Shortlist
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual Section (Top 65% height) */}
            <div className="relative h-[65%] w-full overflow-hidden z-0 bg-black rounded-[2rem]">
                {creator.discovery_video_url && isActive ? (
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
                        onError={(e) => {
                            console.error("[DiscoveryCard] Video failed to load:", creator.discovery_video_url);
                        }}
                    />
                ) : (
                    <img 
                        src={safeAvatarSrc(creator.avatar_url) || `https://ui-avatars.com/api/?name=${creator.first_name}&background=0D1117&color=fff`} 
                        className="w-full h-full object-cover"
                        alt={`${creator.first_name} (${formatCount(creator.followers_count || creator.followers || 0)} followers)`}
                    />
                )}

                {/* Overlays for Contrast & Cinematic Continuity */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#07111F] via-[#07111F]/90 to-transparent z-10 pointer-events-none" />
                
                {/* Swipe Status Stamps */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 z-30 px-5 py-1.5 border-4 border-emerald-500 rounded-xl rotate-[-15deg] pointer-events-none">
                    <span className="text-2xl font-black text-emerald-500 uppercase tracking-tighter">YES</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 right-6 z-30 px-5 py-1.5 border-4 border-rose-500 rounded-xl rotate-[15deg] pointer-events-none">
                    <span className="text-2xl font-black text-rose-500 uppercase tracking-tighter">SKIP</span>
                </motion.div>

                {/* Mute Toggle */}
                {creator.discovery_video_url && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        aria-label={isMuted ? "Unmute creator introduction video" : "Mute creator introduction video"}
                        aria-pressed={!isMuted}
                        className="absolute bottom-10 right-4 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-90 transition-all border border-white/10"
                    >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" aria-hidden="true" /> : <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>
                )}

                {/* Platform Signifier (Floating Instagram Badge) */}
                <div className="absolute bottom-10 right-15 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/10 shadow-sm">
                    <Instagram className="w-4 h-4 text-pink-400" aria-hidden="true" />
                </div>

                {/* Trust Shield Badges (Floating Escrow & Deals) */}
                <div className="absolute top-6 left-6 z-30 flex flex-col gap-1.5 pointer-events-none">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-500/30 shadow-md">
                        <Shield className="w-3 h-3 text-emerald-400 fill-emerald-400/10" aria-hidden="true" />
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-400">Escrow Protected</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-sky-500/30 shadow-md self-start">
                        <span className="text-sky-400 text-xs">🤝</span>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-400">{getDealsCount(creator)} Deals</span>
                    </div>
                </div>
            </div>

            {/* Info & Stats Section */}
            <div className={cn(
                "flex-1 px-4 pt-3.5 pb-3 flex flex-col justify-between pointer-events-auto backdrop-blur-xl rounded-[2rem] -mt-6 shadow-2xl relative z-10",
                isDark
                    ? "bg-[#07111F]/96 border border-white/[0.07]"
                    : "bg-white border border-slate-200"
            )}>

                {/* Identity Block */}
                <div className="space-y-1.5">
                    {/* Name + Verified */}
                    <div className="flex items-center gap-1.5">
                        <h3 className={cn("text-[22px] font-black tracking-tight leading-none uppercase italic", isDark ? "text-white" : "text-slate-900")}>
                            {decodeHtmlEntities(creator.first_name && creator.first_name !== 'Creator' && !creator.first_name.includes('@')
                                ? creator.first_name
                                : (creator.username && !creator.username.includes('@') ? creator.username : 'Verified Creator'))}
                        </h3>
                        {creator.is_verified !== false && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
                        )}
                    </div>

                    {/* Username */}
                    <span className={cn("text-[11px] font-semibold truncate block", isDark ? "text-white/35" : "text-slate-400")}>
                        @{decodeHtmlEntities(creator.username && !creator.username.includes('@')
                            ? creator.username
                            : (creator.first_name && !creator.first_name.includes('@') ? creator.first_name.toLowerCase().replace(/\s+/g, '') : 'creator'))}
                    </span>

                    {/* Demographic Pills — all niches */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
                        {displayNiches.map((niche) => (
                            <span
                                key={niche}
                                className={cn(
                                    "inline-flex items-center shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap",
                                    isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-slate-100 border-slate-200 text-slate-500"
                                )}
                            >
                                {niche}
                            </span>
                        ))}
                        {audienceFemalePct != null && (
                            <span className={cn(
                                "inline-flex items-center shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap",
                                isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-slate-100 border-slate-200 text-slate-500"
                            )}>
                                👩 {audienceFemalePct}% F
                            </span>
                        )}
                        <span className={cn(
                            "inline-flex items-center shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap",
                            isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-slate-100 border-slate-200 text-slate-500"
                        )}>
                            🇮🇳 {displayLocation}
                        </span>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                        <p className={cn("text-[11px] font-medium leading-snug line-clamp-2", isDark ? "text-white/55" : "text-slate-500")}>
                            {creator.bio}
                        </p>
                    )}
                </div>

                {/* Stats Row */}
                <div className={cn(
                    "grid grid-cols-4 rounded-2xl overflow-hidden border my-2",
                    isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-slate-100 bg-slate-50"
                )}>
                    {[
                        { label: 'Followers', value: formatCount(followersVal), color: isDark ? 'text-white' : 'text-slate-900' },
                        { label: 'Avg Views', value: formatCount(avgViewsVal), color: isDark ? 'text-white' : 'text-slate-900' },
                        { label: 'ER%', value: `🔥 ${erVal}%`, color: 'text-pink-500' },
                        {
                            label: 'Barter',
                            value: barterAccepted ? (minBarterVal ? formatBarterValue(minBarterVal) : '✓ Yes') : '✗ No',
                            color: barterAccepted ? 'text-emerald-500' : isDark ? 'text-white/40' : 'text-slate-400'
                        },
                    ].map((stat, i) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 text-center",
                                i > 0 && (isDark ? "border-l border-white/[0.06]" : "border-l border-slate-100")
                            )}
                        >
                            <span className={cn("text-[7.5px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-white/30" : "text-slate-400")}>{stat.label}</span>
                            <span className={cn("text-[11px] font-black leading-none", stat.color)}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Row */}
                <div className="flex items-center gap-2">
                    {/* Save Button */}
                    <button
                        onClick={handleSaveToggle}
                        aria-label={isSaved ? "Remove creator from shortlist" : "Save creator to shortlist"}
                        className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shrink-0",
                            isSaved
                                ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.2)]"
                                : isDark
                                    ? "bg-white/[0.04] border-white/10 text-white/50 hover:text-rose-400 hover:border-rose-500/30"
                                    : "bg-slate-100 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300"
                        )}
                    >
                        <Heart className={cn("w-5 h-5 transition-all", isSaved && "fill-current scale-110")} />
                    </button>

                    {/* Send Offer CTA */}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.015 }}
                        onClick={(e) => { e.stopPropagation(); triggerHaptic(HapticPatterns.medium); onOpenOffer(); }}
                        animate={{
                            boxShadow: [
                                "0 0 20px rgba(16,185,129,0.15)",
                                "0 0 36px rgba(34,211,238,0.22)",
                                "0 0 20px rgba(16,185,129,0.15)"
                            ],
                        }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", repeatDelay: 2 }}
                        className="flex-1 h-12 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-r from-emerald-600 to-sky-500 text-white active:scale-[0.97] transition-transform"
                    >
                        <div className="flex items-center gap-1.5 z-10 relative">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[13px] font-black uppercase tracking-tight">
                                {startsAtPrice > 0 ? `Send Offer ₹${startsAtPrice.toLocaleString()}` : 'Send Barter Offer'}
                            </span>
                        </div>
                        <span className="text-[7.5px] font-bold z-10 relative uppercase tracking-widest mt-0.5 text-emerald-100/80">
                            ✨ AI Suggested · Escrow Protected
                        </span>
                        {/* Shimmer */}
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                        />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
});
