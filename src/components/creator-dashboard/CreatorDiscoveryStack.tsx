import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, X, Heart, Info, Briefcase, IndianRupee, MapPin, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { parseLocationString } from '@/lib/utils/pincodeLookup';


interface CreatorDiscoveryStackProps {
    isDark: boolean;
}

export const CreatorDiscoveryStack: React.FC<CreatorDiscoveryStackProps> = ({ isDark }) => {
    const [brands, setBrands] = useState<any[]>([]);
    const brandsRef = React.useRef<any[]>([]);
    
    // Sync ref
    useEffect(() => {
        brandsRef.current = brands;
    }, [brands]);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

    useEffect(() => {
        fetchDiscoveryBrands();
    }, []);

    useEffect(() => {
        // Real-time Match Subscription for Creator
        let channel: any;
        const subscribeToMatches = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            channel = supabase
                .channel('creator-match-channel')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'matches',
                        filter: `creator_id=eq.${user.id}`
                    },
                    (payload) => {
                        const { new: newRecord } = payload;
                        if (newRecord) {
                            // Use ref to find brand name
                            const matchedBrand = brandsRef.current.find(b => b.id === newRecord.brand_id);
                            if (matchedBrand) {
                                triggerMatchCelebration(matchedBrand.business_name || matchedBrand.first_name);
                            }
                        }
                    }
                )
                .subscribe();
        };

        subscribeToMatches();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const triggerMatchCelebration = (name: string) => {
        toast.success(`It's a Match! ${name} is also interested.`, {
            description: "The brand has been notified of your interest.",
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

    const fetchDiscoveryBrands = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get brands I've already swiped on
            let swipedBrandIds: string[] = [];
            const { data: mySwipes, error: swipesError } = await supabase
                .from('creator_swipes')
                .select('brand_id')
                .eq('creator_id', user.id);
            
            if (swipesError) throw swipesError;
            swipedBrandIds = mySwipes?.map(s => s.brand_id) || [];

            // 2. Fetch brands (profiles with role=brand) that I haven't swiped on yet
            const { data, error } = await supabase
                .from('profiles')
                .select('*, brands!id(*)')
                .eq('role', 'brand')
                .not('id', 'in', `(${swipedBrandIds.length > 0 ? swipedBrandIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
                .limit(20);

            if (error) throw error;
            setBrands(data || []);
        } catch (error) {
            console.error('[CreatorDiscoveryStack] Error:', error);
            toast.error('Failed to load discovery deck');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (isProcessingSwipe) return;
        
        const brand = brands[currentIndex];
        if (!brand) return;

        setIsProcessingSwipe(true);
        triggerHaptic(direction === 'right' ? 'medium' : 'light');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const response = await fetch(`${getApiBaseUrl()}/api/swipe/creator`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        brandId: brand.id,
                        direction: direction
                    })
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.error || 'Failed to sync swipe');

                if (direction === 'right') {
                    if (result.is_match) {
                        triggerMatchCelebration(brand.business_name || brand.first_name);
                    } else {
                        toast("Interest Sent", {
                            description: `We've notified ${brand.business_name || brand.first_name}.`,
                        });
                    }
                }
                advanceStack();
            }
        } catch (err: any) {
            console.error('[CreatorDiscoveryStack] Persistence error:', err);
            toast.error('Connection issue', { description: err.message || 'Your interest might not have saved.' });
            if (direction === 'left') advanceStack();
        } finally {
            setIsProcessingSwipe(false);
        }
    };

    const advanceStack = () => {
        setCurrentIndex(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest opacity-40 italic">Shuffling Brand Cards...</p>
            </div>
        );
    }

    if (currentIndex >= brands.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary opacity-20" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Deck Complete!</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                        You've seen all available brands for now. Check back soon for new opportunities!
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setCurrentIndex(0);
                        fetchDiscoveryBrands();
                    }}
                    className="px-8 py-3 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest italic"
                >
                    Refresh Deck
                </button>
            </div>
        );
    }

    const currentBrand = brands[currentIndex];

    return (
        <div className="relative w-full h-[600px] flex items-center justify-center" style={{ touchAction: 'pan-y' }}>
            {/* Background Deck Effect */}
            {currentIndex + 1 < brands.length && (
                <div 
                    className={cn(
                        "absolute w-[90%] h-[500px] rounded-[40px] border transform translate-y-4 scale-95 opacity-50",
                        isDark ? "bg-secondary/10 border-white/5" : "bg-white border-black/5"
                    )}
                />
            )}

            {/* Active Card */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentBrand.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{ touchAction: 'pan-y' }}
                    onDragEnd={(_, info) => {
                        if (info.offset.x > 100) handleSwipe('right');
                        else if (info.offset.x < -100) handleSwipe('left');
                    }}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ 
                        x: 500, 
                        opacity: 0, 
                        rotate: 20,
                        transition: { duration: 0.4 } 
                    }}
                    className={cn(
                        "relative w-full max-w-[360px] h-full rounded-[40px] border-4 overflow-hidden shadow-2xl flex flex-col cursor-grab active:cursor-grabbing",
                        isDark ? "bg-black border-white/10" : "bg-white border-black/5"
                    )}
                >
                    {/* Brand Banner/Background */}
                    <div className="h-2/5 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-8">
                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                            <img 
                                src={currentBrand.avatar_url || `https://ui-avatars.com/api/?name=${currentBrand.business_name || currentBrand.first_name}`} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 flex flex-col">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                                        {currentBrand.business_name || currentBrand.first_name}
                                    </h2>
                                    <div className="flex items-center gap-2 text-primary">
                                        <Briefcase className="w-3 h-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">
                                            {currentBrand.brands?.[0]?.industry || 'Top Tier Brand'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                                    <span className="text-[10px] font-black text-primary uppercase">VERIFIED</span>
                                </div>
                            </div>

                            <p className={cn("text-sm font-medium leading-relaxed", isDark ? "text-white/60" : "text-black/60")}>
                                {currentBrand.bio || 'This brand is looking for high-impact creative partners for upcoming campaigns.'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className={cn("p-4 rounded-3xl border", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5")}>
                                    <IndianRupee className="w-4 h-4 mb-2 opacity-40" />
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Avg. Budget</p>
                                    <p className="font-bold text-sm">₹50k - 2L</p>
                                </div>
                                <div className={cn("p-4 rounded-3xl border", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5")}>
                                    <Globe className="w-4 h-4 mb-2 opacity-40" />
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Location</p>
                                    <p className="font-bold text-sm">
                                        {currentBrand.location ? (parseLocationString(currentBrand.location).city || parseLocationString(currentBrand.location).state || 'Pan India') : 'Pan India'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center justify-center gap-6 pb-4">
                            <button 
                                onClick={() => handleSwipe('left')}
                                className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => handleSwipe('right')}
                                className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                            >
                                <Heart className="w-8 h-8 fill-current" />
                            </button>
                            <button className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-white/40 active:scale-90">
                                <Info className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

        </div>
    );
};
