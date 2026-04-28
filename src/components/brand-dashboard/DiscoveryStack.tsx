import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DiscoveryCard } from './DiscoveryCard';
import { QuickOfferSheet } from './QuickOfferSheet';
import { 
    RefreshCw, Sparkles, Filter, X,
    ArrowLeft, History, Heart, Loader2 
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

    useEffect(() => {
        fetchdiscoveryCreators();
    }, []);

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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get creators I've already swiped on
            const { data: mySwipes, error: swipesError } = await supabase
                .from('brand_swipes')
                .select('creator_id')
                .eq('brand_id', user.id);
            
            if (swipesError) throw swipesError;
            const swipedCreatorIds = mySwipes?.map(s => s.creator_id) || [];

            // 2. Build query
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'creator')
                .eq('open_to_collabs', true)
                .neq('id', user.id);

            if (swipedCreatorIds.length > 0) {
                query = query.not('id', 'in', `(${swipedCreatorIds.join(',')})`);
            }
            
            // Priority 1: Creators with a video
            const { data, error } = await query
                .not('discovery_video_url', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            
            if (!data || data.length === 0) {
                // Priority 2: Fallback to any live creator not swiped
                let fallbackQuery = supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'creator')
                    .eq('open_to_collabs', true)
                    .neq('id', user.id)
                    .limit(10);
                
                if (swipedCreatorIds.length > 0) {
                    fallbackQuery = fallbackQuery.not('id', 'in', `(${swipedCreatorIds.join(',')})`);
                }
                
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
                    className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-sm",
                        isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-white border-slate-200 text-slate-400"
                    )}
                >
                    <Filter className="w-5 h-5" />
                </motion.button>
            </div>

            {/* The Stack Container — near full-screen */}
            <div className="relative" style={{ height: 'calc(100vh - 190px)' }}>
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
                                onOpenOffer={() => {
                                    setActiveCreator(creator);
                                    setIsOfferSheetOpen(true);
                                }}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

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
