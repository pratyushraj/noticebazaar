import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Instagram, Youtube, Twitter, Facebook,
    Loader2, Users, ShieldCheck,
    Filter, Sparkles, CheckCircle2,
    ChevronRight, Globe, Zap, ArrowRight,
    TrendingUp, Eye, Star, MapPin
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { withRetry } from '@/lib/utils/retry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { safeAvatarSrc } from '@/lib/utils/image';
import { cn } from '@/lib/utils';
import { parseLocationString } from '@/lib/utils/pincodeLookup';
import { decodeHtmlEntities } from '@/lib/utils/dom';

interface Creator {
    id: string;
    username: string;
    name: string;
    category: string | null;
    bio: string | null;
    avatar_url?: string | null;
    platforms: Array<{ name: string; handle: string; followers?: number }>;
    trust_stats?: {
        completed_deals?: number;
        avg_response_hours?: number;
        completion_rate?: number;
    } | null;
    avg_views?: number;
    avg_reel_views_manual?: number;
    starting_price?: number;
    discovery_video_url?: string | null;
    is_verified?: boolean;
    location?: string;
    barter_min_value?: number;
}

const getInstagramEmbedUrl = (href: string) => {
    try {
        const url = new URL(href);
        if (!url.hostname.includes('instagram.com')) return '';
        const cleanedPath = url.pathname.replace(/\/+$/, '');
        if (/\/(reel|reels|p)\//i.test(cleanedPath)) {
            return `https://www.instagram.com${cleanedPath}/embed`;
        }
    } catch {
        return '';
    }
    return '';
};

const isNativeVideo = (value: string) =>
    /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(value || '').trim());

const DiscoverCreators = () => {
    const { category } = useParams<{ category: string }>();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [isFilterVisible, setIsFilterVisible] = useState(true);

    useEffect(() => {
        fetchCreators();
        fetchCategories();
    }, [category]);

    const fetchCreators = async () => {
        setLoading(true);
        try {
            const url = category && category !== 'all'
                ? `${getApiBaseUrl()}/api/creators?category=${encodeURIComponent(category)}&limit=100`
                : `${getApiBaseUrl()}/api/creators?limit=100`;

            const response = await withRetry(() => fetch(url));
            const data = await response.json();

            if (data.success) {
                const fetchedCreators = data.creators || [];
                
                // Supplemental fetch for video/image assets that might be missing from API
                const creatorIds = fetchedCreators.map((c: any) => c.id).filter(Boolean);
                if (creatorIds.length > 0) {
                    try {
                        const { data: assets, error: assetErr } = await (supabase as any)
                            .from('profiles')
                            .select('id, discovery_video_url, discovery_card_image, avatar_url')
                            .in('id', creatorIds);
                        
                        if (assets && !assetErr) {
                            const assetMap = new Map(assets.map((a: any) => [a.id, a]));
                            const enriched = fetchedCreators.map((c: any) => {
                                const asset = assetMap.get(c.id);
                                if (asset) {
                                    return {
                                        ...c,
                                        discovery_video_url: asset.discovery_video_url || c.discovery_video_url,
                                        discovery_card_image: asset.discovery_card_image || c.discovery_card_image,
                                        avatar_url: asset.avatar_url || c.avatar_url
                                    };
                                }
                                return c;
                            });
                            setCreators(enriched);
                        } else {
                            setCreators(fetchedCreators);
                        }
                    } catch (suppErr) {
                        console.error('[DiscoverCreators] Supplemental asset fetch failed:', suppErr);
                        setCreators(fetchedCreators);
                    }
                } else {
                    setCreators(fetchedCreators);
                }
            }
        } catch (error) {
            console.error('[DiscoverCreators] Error fetching creators:', error);
            toast.error('Failed to load creators. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await withRetry(() => fetch(`${getApiBaseUrl()}/api/creators/categories`));
            const data = await response.json();

            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('[DiscoverCreators] Error fetching categories:', error);
            toast.error('Failed to load categories.');
        }
    };

    const filteredCreators = useMemo(() => {
        return creators.filter(creator => {
            const search = String(debouncedSearchTerm || '').toLowerCase();
            return (
                String(creator.name || '').toLowerCase().includes(search) ||
                String(creator.username || '').toLowerCase().includes(search) ||
                (creator.category || '').toLowerCase().includes(search) ||
                (creator.bio || '').toLowerCase().includes(search) ||
                (String((creator as any).collab_intro_line || '').toLowerCase().includes(search)) ||
                ((creator as any).ugc_capabilities || []).some((cap: string) => 
                    String(cap || '').toLowerCase().includes(search)
                )
            );
        });
    }, [creators, debouncedSearchTerm]);

    const getPlatformIcon = (platformName: string) => {
        switch (platformName.toLowerCase()) {
            case 'instagram': return <Instagram className="h-4 w-4" />;
            case 'youtube': return <Youtube className="h-4 w-4" />;
            case 'twitter': return <Twitter className="h-4 w-4" />;
            case 'facebook': return <Facebook className="h-4 w-4" />;
            default: return <Globe className="h-4 w-4" />;
        }
    };

    const formatFollowers = (count?: number) => {
        if (!count) return '—';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const categoryLabel = category && category !== 'all'
        ? decodeURIComponent(category).replace(/-/g, ' ')
        : '';
    const displayCategory = categoryLabel
        ? categoryLabel.replace(/\b\w/g, (char) => char.toUpperCase())
        : '';
    const categoryKeyword = categoryLabel || 'UGC video';

    const pageTitle = displayCategory
        ? `Find ${displayCategory} Influencers in India | Creator Armour`
        : 'Find UGC Video Creators in India | 5,000+ Verified Creators | Creator Armour';

    const metaDescription = displayCategory
        ? `Browse verified ${categoryKeyword} influencers and UGC creators in India. Compare rates, audience signals, and send structured brand collaboration offers.`
        : 'The largest verified UGC and video creator directory in India. Find creators, compare rates, and hire UGC specialists directly. 5,000+ creators across 20+ niches.';

    const baseUrl = 'https://creatorarmour.com';
    const canonicalUrl = `${baseUrl}/discover${category && category !== 'all' ? `/${encodeURIComponent(category)}` : ''}`;
    const h1Text = displayCategory
        ? `Find ${displayCategory} influencers in India`
        : 'Find UGC video creators in India';
    const introText = displayCategory
        ? `Discover verified ${categoryKeyword} creators for brand campaigns, compare practical rates, and send protected collaboration offers.`
        : 'Find, verify, and connect with 5,000+ creators across 20+ categories. Compare rates, audience signals, and creator fit before sending a brand offer.';

    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": displayCategory
            ? `${displayCategory} Influencers in India`
            : 'Verified UGC and Influencer Directory India',
        "itemListElement": filteredCreators.slice(0, 10).map((creator, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `${baseUrl}/${creator.username}`,
            "name": creator.name
        }))
    };


    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 font-sans overflow-x-hidden">
            <SEOHead
                title={pageTitle}
                description={metaDescription}
                keywords={[
                    'find influencers india', 'micro influencers india', 'nano influencers marketing', 
                    'influencer marketing platform', 'verified creator directory', 'UGC video creators',
                    'influencers in Mumbai Delhi Bangalore', 'Hindi Tamil Telugu influencers',
                    'hire influencers', 'brand collaborations', 'influencer rates india',
                    categoryKeyword, `${categoryKeyword} influencers india`, `${categoryKeyword} UGC creators`,
                    'creator armour'
                ]}
                image="https://creatorarmour.com/discover-og.png"
                canonicalUrl={canonicalUrl}
                jsonLd={itemListSchema}
                robots={!loading && filteredCreators.length === 0 ? "noindex, follow" : undefined}
            />
            <BreadcrumbSchema items={[
                { name: 'Home', url: baseUrl },
                { name: 'Discover', url: `${baseUrl}/discover` }
            ]} />

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 blur-[120px] rounded-full opacity-60" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 blur-[120px] rounded-full opacity-60" />
            </div>

            {/* Header / Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 flex items-center">
                <div className="max-w-[1400px] mx-auto w-full px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight uppercase">
                            Creator<span className="text-emerald-600">Armour</span>
                        </h1>
                    </Link>
                    
                    <div className="hidden lg:flex items-center gap-10">
                        <Link to="/discover" className="text-[12px] font-black uppercase tracking-widest text-emerald-600">Discover</Link>
                        <Link to="/login" className="text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Log In</Link>
                        <Link to="/signup" className="h-12 px-6 rounded-full bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center">
                            Join Platform
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-24 max-w-[1400px] mx-auto px-6">
                {/* Hero Section */}
                <section className="mb-16 text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 mb-6">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Discovery Engine</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-none mb-6 capitalize">
                            {h1Text}
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                            {introText}
                        </p>
                    </motion.div>

                    {/* Search & Filters */}
                    <div className="max-w-2xl mx-auto bg-white p-2 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                            <Input
                                type="text"
                                placeholder="Search by name, category, or niche..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 h-16 bg-transparent border-none text-lg font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            onClick={() => setIsFilterVisible(!isFilterVisible)}
                            className="h-16 px-8 rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 font-black text-sm gap-3 hover:bg-slate-100 transition-all"
                        >
                            <Filter className="w-4 h-4" />
                            {category && category !== 'all' ? category : 'Categories'}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isFilterVisible && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-8 flex flex-wrap justify-center gap-2"
                            >
                                <Link to="/discover">
                                    <Badge
                                        className={cn(
                                            "h-10 px-5 rounded-full font-black uppercase tracking-widest transition-all cursor-pointer",
                                            !category || category === 'all' 
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                                                : "bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900"
                                        )}
                                    >
                                        All Creators
                                    </Badge>
                                </Link>
                                {categories.map((cat) => (
                                    <Link key={cat} to={`/discover/${encodeURIComponent(cat)}`}>
                                        <Badge
                                            className={cn(
                                                "h-10 px-5 rounded-full font-black uppercase tracking-widest transition-all cursor-pointer",
                                                category === cat 
                                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                                                    : "bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900"
                                            )}
                                        >
                                            {cat}
                                        </Badge>
                                    </Link>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Results Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[4/5] rounded-[48px] bg-slate-50 animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : filteredCreators.length === 0 ? (
                    <div className="py-32 text-center max-w-md mx-auto">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                            <Users className="w-10 h-10" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 tracking-tight">No Creators Found</h3>
                        <p className="text-slate-400 font-medium mb-10">
                            We couldn't find any creators matching your search criteria. Try adjusting your filters.
                        </p>
                        <Button
                            onClick={() => setSearchTerm('')}
                            className="h-14 px-8 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                            Clear All Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {filteredCreators.map((creator, idx) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: Math.min(idx * 0.1, 1) }}
                                className="group"
                            >
                                <div className="relative aspect-[4/5] rounded-[48px] overflow-hidden bg-slate-100 shadow-xl border-8 border-white group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                                    {/* Creator Image or Video */}
                                    <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                                    {creator.discovery_video_url && isNativeVideo(creator.discovery_video_url) ? (
                                        <video 
                                            src={creator.discovery_video_url}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            poster={creator.discovery_card_image || creator.avatar_url || ""}
                                        />
                                    ) : creator.discovery_video_url && getInstagramEmbedUrl(creator.discovery_video_url) ? (
                                        <div className="w-full h-full relative z-10 bg-slate-900">
                                            {/* Show poster while iframe loads */}
                                            <img 
                                                src={creator.discovery_card_image || creator.avatar_url || ""} 
                                                className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
                                                alt=""
                                            />
                                            <iframe
                                                src={getInstagramEmbedUrl(creator.discovery_video_url)}
                                                className="w-full h-full border-none pointer-events-none relative z-20 transition-transform duration-700 group-hover:scale-105"
                                                allowTransparency
                                                scrolling="no"
                                            />
                                        </div>
                                    ) : (
                                        <img 
                                            src={creator.discovery_card_image || creator.avatar_url || `https://ui-avatars.com/api/?name=${creator.name}&background=random`} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10" 
                                            alt={creator.name}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${creator.name}&background=random`;
                                            }}
                                        />
                                    )}
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Top Badges */}
                                    <div className="absolute top-8 left-8 flex flex-wrap gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-900/40 backdrop-blur-md px-3 py-1 rounded-md border border-emerald-400/20">
                                            {creator.category || 'Lifestyle'}
                                        </span>
                                    </div>

                                    {/* Floating Stats */}
                                    <div className="absolute top-8 right-8 flex flex-col gap-2">
                                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-[20px] shadow-xl text-white transform group-hover:translate-x-2 transition-transform duration-500 delay-75">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Eye className="w-3 h-3 text-emerald-400" />
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Reel Views</p>
                                            </div>
                                            <p className="text-sm font-black">
                                                {creator.avg_reel_views_manual ? (creator.avg_reel_views_manual >= 1000000 ? `${(creator.avg_reel_views_manual / 1000000).toFixed(1)}M` : `${(creator.avg_reel_views_manual / 1000).toFixed(0)}K+`) : (creator.avg_views ? (creator.avg_views >= 1000000 ? `${(creator.avg_views / 1000000).toFixed(1)}M` : `${(creator.avg_views / 1000).toFixed(0)}K+`) : '12K+')}
                                            </p>
                                        </div>

                                        {(creator.starting_price || creator.barter_min_value) && (
                                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-3 rounded-[20px] shadow-xl text-white transform group-hover:translate-x-2 transition-transform duration-500 delay-150">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Zap className="w-3 h-3 text-yellow-400" />
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Starts At</p>
                                                </div>
                                                <p className="text-sm font-black text-emerald-400">
                                                    ₹{((creator.starting_price || creator.barter_min_value || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Info */}
                                    <div className="absolute bottom-10 inset-x-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-2xl font-black text-white tracking-tight">
                                                {decodeHtmlEntities(creator.name && creator.name !== 'Creator' && !creator.name.includes('@') 
                                                    ? creator.name 
                                                    : (creator.username && !creator.username.includes('@') ? creator.username : 'Verified Creator'))}
                                            </h3>
                                            {creator.is_verified && (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-white" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mb-6">
                                            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
                                                @{decodeHtmlEntities(creator.username && !creator.username.includes('@') 
                                                    ? creator.username 
                                                    : (creator.name && !creator.name.includes('@') ? creator.name.toLowerCase().replace(/\s+/g, '') : 'creator'))}
                                            </p>
                                            {creator.location && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1 bg-blue-900/40 backdrop-blur-md px-2 py-0.5 rounded border border-blue-400/20">
                                                    <MapPin className="w-3 h-3" /> {parseLocationString(creator.location).city || parseLocationString(creator.location).state || 'India'}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <Link 
                                                to={`/${creator.username}`}
                                                className="h-14 px-6 rounded-3xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40"
                                            >
                                                Send Offer <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <Link 
                                                to={`/${creator.username}`}
                                                className="h-14 px-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black text-sm flex items-center justify-center hover:bg-white/20 transition-all"
                                            >
                                                Portfolio
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Footer Section */}
                <section className="mt-32 pt-20 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 mb-6">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure Discovery Protocol</span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                            The operating system for <br />
                            <span className="text-blue-600">verified collaborations</span>
                        </h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Every creator in our directory is manually verified for audience quality and engagement integrity. 
                            Our smart contracts ensure your budget is protected and deliverables are guaranteed.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 text-center">
                            <p className="text-4xl font-black text-slate-900 mb-2">5K+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Creators</p>
                        </div>
                        <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 text-center">
                            <p className="text-4xl font-black text-slate-900 mb-2">100%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Reach</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-slate-50 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">
                    © {new Date().getFullYear()} Creator Armour Systems · All Rights Reserved
                </p>
            </footer>
        </div>
    );
};

export default DiscoverCreators;
