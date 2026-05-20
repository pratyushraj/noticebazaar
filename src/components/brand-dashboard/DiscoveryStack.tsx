import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import { QuickOfferSheet } from './QuickOfferSheet';
import {
    RefreshCw, Sparkles, Filter, X,
    History, Heart, Loader2, Zap,
    ShieldCheck, TrendingUp, Clock, Star, BookmarkPlus, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface DiscoveryStackProps {
    isDark: boolean;
    onClose?: () => void;
    triggerHaptic: (pattern?: string) => void;
}
const POPULAR_CATEGORIES = ['Lifestyle', 'Fashion', 'Beauty', 'Food', 'Pets', 'Travel'];
const MORE_CATEGORIES = ['Fitness', 'Tech & Gadgets', 'Parenting', 'Skincare', 'Photography'];

const COLLAB_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'barter', label: 'Barter OK' },
    { id: 'paid', label: 'Paid Only' }
];

const FOLLOWER_RANGES = [
    { label: 'Any', value: 0 },
    { label: '10K+', value: 10000 },
    { label: '50K+', value: 50000 },
    { label: '100K+', value: 100000 },
    { label: '500K+', value: 500000 }
];

const QUALITY_FILTERS = [
    { id: 'verified', label: 'Verified Only', icon: ShieldCheck },
    { id: 'high_er', label: 'High Engagement', icon: TrendingUp },
    { id: 'fast', label: 'Fast Responders', icon: Clock },
    { id: 'escrow', label: 'Escrow Eligible', icon: Star },
];

const SMART_SUGGESTIONS = [
    { label: 'Pet Care · Female · Mumbai', category: 'Lifestyle', collab: 'all' as const, followers: 10000 },
    { label: 'Beauty · High ROI · Delhi', category: 'Beauty', collab: 'paid' as const, followers: 50000 },
    { label: 'Food · Barter OK · Bangalore', category: 'Food', collab: 'barter' as const, followers: 0 },
];

const computeMatchCount = (creators: any[], cat: string, collabType: string, minFollowers: number, qualityFilters: string[]) => {
    return creators.filter(c => {
        const followers = c.followers_count || c.followers || 0;
        const er = c.engagement_rate || 0;
        const collab = (c.collaboration_preference || '').toLowerCase();
        const niches = Array.isArray(c.content_niches) ? c.content_niches.map((n: string) => n.toLowerCase()) : [];
        if (cat !== 'all' && c.category?.toLowerCase() !== cat.toLowerCase() && !niches.includes(cat.toLowerCase())) return false;
        if (minFollowers > 0 && followers < minFollowers) return false;
        if (collabType === 'barter' && !c.barter_min_value && !['both','hybrid','barter'].some(k => collab.includes(k))) return false;
        if (collabType === 'paid' && collab === 'barter_only') return false;
        if (qualityFilters.includes('verified') && c.is_verified === false) return false;
        if (qualityFilters.includes('high_er') && er < 5) return false;
        if (qualityFilters.includes('escrow') && !c.starting_price && !c.barter_min_value) return false;
        return true;
    }).length;
};

export const DiscoveryStack: React.FC<DiscoveryStackProps> = ({
    isDark,
    onClose,
    triggerHaptic
}) => {
    const [creators, setCreators] = useState<any[]>([]);
    const creatorsRef = useRef<any[]>([]);
    
    // Sync ref with state
    useEffect(() => {
        creatorsRef.current = creators;
    }, [creators]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [outOfCards, setOutOfCards] = useState(false);
    
    // Offer Flow State
    const [isOfferSheetOpen, setIsOfferSheetOpen] = useState(false);
    const [activeCreator, setActiveCreator] = useState<any>(null);
    const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
    
    // Shared audio preference state across creators
    const [isMuted, setIsMuted] = useState(true);

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeCollabType, setActiveCollabType] = useState<'all' | 'barter' | 'paid'>('all');
    const [activeMinFollowers, setActiveMinFollowers] = useState<number>(0);
    const [activeQualityFilters, setActiveQualityFilters] = useState<string[]>([]);

    const [tempCategory, setTempCategory] = useState('all');
    const [tempCollabType, setTempCollabType] = useState<'all' | 'barter' | 'paid'>('all');
    const [tempMinFollowers, setTempMinFollowers] = useState<number>(0);
    const [tempQualityFilters, setTempQualityFilters] = useState<string[]>([]);
    const [showMoreCategories, setShowMoreCategories] = useState(false);
    const [savedPresets, setSavedPresets] = useState<{ name: string; cat: string; collab: 'all'|'barter'|'paid'; followers: number; quality: string[] }[]>([]);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [presetName, setPresetName] = useState('');

    // Swipe-to-dismiss sheet
    const sheetY = useMotionValue(0);

    const matchCount = useMemo(() => computeMatchCount(creators, tempCategory, tempCollabType, tempMinFollowers, tempQualityFilters), 
        [creators, tempCategory, tempCollabType, tempMinFollowers, tempQualityFilters]);

    useEffect(() => {
        fetchdiscoveryCreators();
    }, [activeCategory, activeCollabType, activeMinFollowers, activeQualityFilters]);

    useEffect(() => {
        // 3. Real-time Match Subscription
        let channel: any;
        const subscribeToMatches = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            channel = supabase
                .channel('brand-match-channel')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'matches',
                        filter: `brand_id=eq.${user.id}`
                    },
                    (payload) => {
                        const { new: newRecord } = payload;
                        if (newRecord) {
                            // Use ref to find creator name
                            const matchedCreator = creatorsRef.current.find(c => c.id === newRecord.creator_id);
                            if (matchedCreator) {
                                triggerMatchCelebration(matchedCreator.username || matchedCreator.first_name);
                            }
                        }
                    }
                )
                .subscribe();
        };

        subscribeToMatches();
        return () => {
            if (channel) {
                setTimeout(() => {
                    void supabase.removeChannel(channel);
                }, 100);
            }
        };
    }, []);

    // Global keyboard listener for accessible swiping
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                isFilterOpen || 
                isOfferSheetOpen || 
                document.activeElement?.tagName === 'INPUT' || 
                document.activeElement?.tagName === 'TEXTAREA'
            ) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                void handleSwipe('left');
            } else if (e.key === 'ArrowRight') {
                void handleSwipe('right');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFilterOpen, isOfferSheetOpen, creators, currentIndex, isProcessingSwipe]);

    const triggerMatchCelebration = (name: string) => {
        toast.success(`It's a Match! ${name} is also interested.`, {
            description: "Go to Collabs to start working together.",
            icon: "🔥"
        });
        triggerHaptic('heavy');
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F43F5E', '#10B981', '#F59E0B']
        });
    };

    const fetchdiscoveryCreators = async () => {
        setIsLoading(true);
        setCurrentIndex(0);
        setOutOfCards(false);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get creators I've already swiped on
            const { data: mySwipes, error: swipesError } = await (supabase as any)
                .from('brand_swipes')
                .select('creator_id')
                .eq('brand_id', user.id);
            
            if (swipesError) throw swipesError;
            const swipedCreatorIds = (mySwipes as any[])?.map(s => s.creator_id) || [];

            // Helper to apply active filters to Supabase query
            const applyFilterParams = (q: any) => {
                if (activeCategory !== 'all') {
                    q = q.contains('content_niches', JSON.stringify([activeCategory]));
                }
                if (activeMinFollowers > 0) {
                    q = q.gte('followers_count', activeMinFollowers);
                }
                if (activeCollabType === 'barter') {
                    q = q.or('barter_min_value.not.is.null,collaboration_preference.ilike.%both%,collaboration_preference.ilike.%hybrid%,collaboration_preference.ilike.%barter%');
                } else if (activeCollabType === 'paid') {
                    q = q.or('starting_price.gt.0,collaboration_preference.not.ilike.%barter_only%');
                }
                return q;
            };

            // 2. Build query
            let query = (supabase as any)
                .from('profiles')
                .select('*')
                .eq('role', 'creator')
                .eq('open_to_collabs', true)
                .neq('id', user.id);

            if (swipedCreatorIds.length > 0) {
                query = query.not('id', 'in', `(${swipedCreatorIds.join(',')})`);
            }
            
            query = applyFilterParams(query);
            
            // Priority 1: Creators with a video
            const { data, error } = await query
                .not('discovery_video_url', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            
            if (!data || data.length === 0) {
                // Priority 2: Fallback to any live creator not swiped
                let fallbackQuery = (supabase as any)
                    .from('profiles')
                    .select('*')
                    .eq('role', 'creator')
                    .eq('open_to_collabs', true)
                    .neq('id', user.id)
                    .limit(10);
                
                if (swipedCreatorIds.length > 0) {
                    fallbackQuery = fallbackQuery.not('id', 'in', `(${swipedCreatorIds.join(',')})`);
                }
                
                fallbackQuery = applyFilterParams(fallbackQuery);
                
                const { data: fallbackData } = await fallbackQuery;
                setCreators(fallbackData || []);
            } else {
                setCreators(data);
            }
        } catch (error: any) {
            console.error('[DiscoveryStack] Error:', error);
            toast.error('Failed to load creators');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (isProcessingSwipe) return;
        
        const creator = creators[currentIndex];
        if (!creator) return;
        
        setIsProcessingSwipe(true);
        triggerHaptic(direction === 'right' ? 'medium' : 'light');
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const response = await fetch(`${getApiBaseUrl()}/api/swipe/brand`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        creatorId: creator.id,
                        direction: direction
                    })
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.error || 'Failed to sync swipe');

                if (direction === 'right') {
                    if (result.is_match) {
                        triggerMatchCelebration(creator.username || creator.first_name);
                    } else {
                        toast("Interest Sent", {
                            description: `We've notified ${creator.username || 'the creator'}.`,
                        });
                    }

                    // Store debug info if needed
                    console.log('[DiscoveryStack] Swipe result:', result._debug);

                    // Immediately switch to offer flow
                    setActiveCreator(creator);
                    setIsOfferSheetOpen(true);
                } else {
                    advanceStack();
                }
            }
        } catch (err: any) {
            console.error('[DiscoveryStack] Persistence error:', err);
            toast.error('Connection issue', { description: err.message || 'Your swipe might not have saved.' });
            if (direction === 'left') advanceStack();
        } finally {
            setIsProcessingSwipe(false);
        }
    };

    const advanceStack = () => {
        if (currentIndex < creators.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setOutOfCards(true);
        }
    };

    const resetStack = () => {
        setCurrentIndex(0);
        setOutOfCards(false);
        fetchdiscoveryCreators();
    };

    if (isLoading) {
        return (
            <div className="relative flex flex-col gap-6" style={{ height: 'calc(100vh - 190px)' }}>
                {/* Header Skeleton */}
                <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex flex-col gap-2">
                        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
                        <div className="h-3 w-32 bg-white/5 animate-pulse rounded-lg" />
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/5 animate-pulse" />
                </div>

                {/* Card Skeleton */}
                <div className="relative flex-1">
                    <div className={cn(
                        "absolute inset-0 w-full h-full rounded-[2.5rem] border overflow-hidden flex flex-col",
                        isDark ? "bg-[#0B1220] border-white/10" : "bg-white border-slate-200"
                    )}>
                        <div className="h-[68%] w-full bg-white/5 animate-pulse" />
                        <div className="flex-1 p-5 flex flex-col gap-4">
                            <div className="h-12 w-full bg-white/5 animate-pulse rounded-[1.75rem]" />
                            <div className="h-14 w-full bg-white/5 animate-pulse rounded-[1.75rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (outOfCards || (creators.length === 0 && !isLoading)) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "rounded-[28px] border flex flex-col items-center justify-center p-10 text-center gap-8",
                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/40"
                )}
                style={{ height: 'calc(100vh - 220px)' }}
            >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
                    <Sparkles className="w-12 h-12 text-primary" />
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    />
                </div>
                <div className="space-y-3">
                    <h3 className={cn("text-3xl font-black italic tracking-tighter uppercase", isDark ? "text-white" : "text-slate-900")}>
                        Stack Cleared
                    </h3>
                    <p className={cn("text-sm font-medium opacity-60 max-w-[240px] leading-relaxed mx-auto", isDark ? "text-slate-400" : "text-slate-500")}>
                        You've reviewed all suggested creators. Refresh to see new talent or search by handle.
                    </p>
                </div>
                <button 
                    onClick={resetStack}
                    className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-[2rem] font-black text-sm active:scale-95 transition-all shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] uppercase italic tracking-widest"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Feed
                </button>
            </motion.div>
        );
    }

    return (
        <div className="relative flex flex-col gap-6" style={{ touchAction: 'pan-y' }}>
        {/* Depth-aware animated backdrop when filter open */}
        <AnimatePresence>
            {isFilterOpen && (
                <motion.div
                    key="filter-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl"
                    onClick={() => setIsFilterOpen(false)}
                />
            )}
        </AnimatePresence>
            {/* Header Controls */}
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                            Discover Creators
                        </h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                    <p className={cn("text-[11px] font-bold opacity-40 uppercase tracking-[0.1em] mt-0.5", isDark ? "text-white" : "text-slate-900")}>
                        Top matched for your brand
                    </p>
                </div>
                
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                        setTempCategory(activeCategory);
                        setTempCollabType(activeCollabType);
                        setTempMinFollowers(activeMinFollowers);
                        setIsFilterOpen(true);
                    }}
                    aria-label="Filter creators"
                    aria-haspopup="dialog"
                    aria-expanded={isFilterOpen}
                    className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-sm relative",
                        isDark 
                            ? (activeCategory !== 'all' || activeCollabType !== 'all' || activeMinFollowers > 0)
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-white/5 border-white/10 text-white/50"
                            : (activeCategory !== 'all' || activeCollabType !== 'all' || activeMinFollowers > 0)
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-white border-slate-200 text-slate-400"
                    )}
                >
                    <Filter className="w-5 h-5" />
                    {(activeCategory !== 'all' || activeCollabType !== 'all' || activeMinFollowers > 0) && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-[#0D0F1A]" />
                    )}
                </motion.button>
            </div>

            {/* The Stack Container — near full-screen */}
            <div className="relative" style={{ height: 'calc(100vh - 270px)' }}>
                <AnimatePresence>
                    {creators.slice(currentIndex, currentIndex + 2).reverse().map((creator, i) => {
                        const isTop = (currentIndex + (1 - i)) === currentIndex;
                        
                        return (
                            <DiscoveryCard 
                                key={creator.id}
                                creator={creator}
                                isDark={isDark}
                                onSwipe={handleSwipe}
                                isActive={isTop}
                                isMuted={isMuted}
                                setIsMuted={setIsMuted}
                                onOpenOffer={() => {
                                    setActiveCreator(creator);
                                    setIsOfferSheetOpen(true);
                                }}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Auxiliary Accessibility Action Controls */}
            <div className="flex items-center justify-center gap-6 py-2">
                <button
                    type="button"
                    onClick={() => void handleSwipe('left')}
                    aria-label="Skip creator"
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border transition-all active:scale-90 shadow-md",
                        isDark 
                            ? "bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20 text-rose-400" 
                            : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600"
                    )}
                >
                    <X className="w-6 h-6" />
                </button>
                
                <button
                    type="button"
                    onClick={() => {
                        const topCreator = creators[currentIndex];
                        if (topCreator) {
                            setActiveCreator(topCreator);
                            setIsOfferSheetOpen(true);
                        }
                    }}
                    aria-label="Send offer to current creator"
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border transition-all active:scale-90 shadow-md",
                        isDark 
                            ? "bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400" 
                            : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-600"
                    )}
                >
                    <Zap className="w-6 h-6 fill-current" />
                </button>
            </div>

            {/* Filter Bottom Sheet — Custom iOS-style sheet with swipe-down dismiss */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        key="filter-sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 35 }}
                        style={{ y: sheetY }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0, bottom: 0.3 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 600) {
                                sheetY.set(0);
                                setIsFilterOpen(false);
                            } else {
                                sheetY.set(0);
                            }
                        }}
                        className="fixed bottom-0 inset-x-0 z-50 bg-[#07111F] border-t border-white/10 rounded-t-[2rem] max-h-[90vh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter creators"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 px-5 pb-32">
                            {/* Header */}
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white italic">Filter Creators</h3>
                                    <motion.p
                                        key={matchCount}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[11px] font-bold text-emerald-400 mt-0.5"
                                    >
                                        {matchCount > 0 ? `${matchCount} creators match` : 'No creators match'}
                                    </motion.p>
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Niche / Category — Dropdown */}
                            <div className="space-y-2.5 mb-5">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Niche / Category</h4>
                                <div className="relative">
                                    <select
                                        value={tempCategory}
                                        onChange={e => setTempCategory(e.target.value)}
                                        className="w-full appearance-none bg-white/5 border border-white/10 text-white text-sm font-bold px-4 py-3 rounded-xl outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="all" className="bg-[#07111F]">All Niches</option>
                                        {[...POPULAR_CATEGORIES, ...MORE_CATEGORIES].map(cat => (
                                            <option key={cat} value={cat} className="bg-[#07111F]">{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                </div>
                            </div>

                            {/* Barter Available */}
                            <div className="space-y-2.5 mb-5">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Barter Available</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { id: 'all', label: 'Any', emoji: '🔀' },
                                        { id: 'barter', label: 'Yes', emoji: '🤝' },
                                        { id: 'paid', label: 'No', emoji: '💸' },
                                    ] as const).map(({ id, label, emoji }) => (
                                        <motion.button
                                            key={id}
                                            whileTap={{ scale: 0.88 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                            onClick={() => setTempCollabType(id)}
                                            className={cn(
                                                "flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-black border transition-colors",
                                                tempCollabType === id
                                                    ? id === 'barter'
                                                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.2)]"
                                                        : id === 'paid'
                                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                                            : "bg-primary border-primary text-white shadow-[0_0_14px_rgba(16,185,129,0.25)]"
                                                    : "bg-white/5 border-white/10 text-white/50"
                                            )}
                                        >
                                            <span className="text-base leading-none">{emoji}</span>
                                            <span>{label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Save Filter Preset */}
                            <div className="mb-2">
                                <AnimatePresence>
                                    {showSavePreset ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex gap-2 mb-2 overflow-hidden"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Name this preset…"
                                                value={presetName}
                                                onChange={e => setPresetName(e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl placeholder-white/30 outline-none focus:border-primary/50"
                                            />
                                            <motion.button
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() => {
                                                    if (!presetName.trim()) return;
                                                    setSavedPresets(p => [...p, { name: presetName.trim(), cat: tempCategory, collab: tempCollabType, followers: tempMinFollowers, quality: tempQualityFilters }]);
                                                    setPresetName('');
                                                    setShowSavePreset(false);
                                                    toast.success('Filter preset saved!');
                                                }}
                                                className="px-3 py-2 bg-primary rounded-xl text-white text-xs font-black"
                                            >
                                                Save
                                            </motion.button>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>

                                {savedPresets.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-2">
                                        {savedPresets.map((p, i) => (
                                            <motion.button
                                                key={i}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setTempCategory(p.cat);
                                                    setTempCollabType(p.collab);
                                                    setTempMinFollowers(p.followers);
                                                    setTempQualityFilters(p.quality);
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 whitespace-nowrap"
                                            >
                                                <BookmarkPlus className="w-3 h-3" />
                                                {p.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowSavePreset(p => !p)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors"
                                >
                                    <BookmarkPlus className="w-3 h-3" />
                                    Save as filter preset
                                </button>
                            </div>

                            {/* Footer CTA */}
                            <div className="flex gap-3 pt-4 mt-2 border-t border-white/5">
                                {/* Reset = ghost */}
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => {
                                        setTempCategory('all');
                                        setTempCollabType('all');
                                        setTempMinFollowers(0);
                                        setTempQualityFilters([]);
                                        setActiveCategory('all');
                                        setActiveCollabType('all');
                                        setActiveMinFollowers(0);
                                        setActiveQualityFilters([]);
                                        setIsFilterOpen(false);
                                    }}
                                    className="px-8 py-4 rounded-2xl font-black text-sm text-white/40 border border-white/10 bg-transparent hover:bg-white/5 transition-colors"
                                >
                                    Reset
                                </motion.button>

                                {/* Apply = dominant glowing CTA with live count */}
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => {
                                        setActiveCategory(tempCategory);
                                        setActiveCollabType(tempCollabType);
                                        setActiveMinFollowers(tempMinFollowers);
                                        setActiveQualityFilters(tempQualityFilters);
                                        setIsFilterOpen(false);
                                    }}
                                    animate={{
                                        boxShadow: [
                                            '0 0 20px rgba(16,185,129,0.2)',
                                            '0 0 35px rgba(16,185,129,0.35)',
                                            '0 0 20px rgba(16,185,129,0.2)',
                                        ]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-2xl font-black text-sm relative overflow-hidden"
                                >
                                    <motion.div
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                                    />
                                    <span className="relative z-10">
                                        Apply Filters ({matchCount})
                                    </span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Offer Sheet */}
            <QuickOfferSheet 
                isOpen={isOfferSheetOpen}
                onClose={(didSubmit?: boolean) => {
                    setIsOfferSheetOpen(false);
                    // If the user successfully submitted an offer, advance the card immediately
                    if (didSubmit) {
                        advanceStack();
                    }
                }}
                creator={activeCreator}
                isDark={isDark}
            />
        </div>
    );
};
