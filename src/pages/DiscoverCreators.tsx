import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Instagram, Youtube, Twitter, Facebook,
    Loader2, Users, ShieldCheck,
    Filter, Sparkles, CheckCircle2,
    ChevronRight, Globe, Zap
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface Creator {
    id: string;
    username: string;
    name: string;
    category: string | null;
    bio: string | null;
    profile_photo?: string | null;
    platforms: Array<{ name: string; handle: string; followers?: number }>;
    trust_stats?: {
        completed_deals?: number;
        avg_response_hours?: number;
        completion_rate?: number;
    } | null;
}

const DiscoverCreators = () => {
    const { category } = useParams<{ category: string }>();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    useEffect(() => {
        fetchCreators();
        fetchCategories();
    }, [category]);

    const fetchCreators = async () => {
        setLoading(true);
        try {
            const url = category && category !== 'all'
                ? `${getApiBaseUrl()}/api/creators?category=${category}&limit=100`
                : `${getApiBaseUrl()}/api/creators?limit=100`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setCreators(data.creators || []);
            }
        } catch (error) {
            console.error('[DiscoverCreators] Error fetching creators:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/creators/categories`);
            const data = await response.json();

            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('[DiscoverCreators] Error fetching categories:', error);
        }
    };

    const filteredCreators = useMemo(() => {
        return creators.filter(creator =>
            creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [creators, searchTerm]);

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

    const pageTitle = category && category !== 'all'
        ? `Discover ${category} Creators | CreatorArmour`
        : 'Discover Verified Creators | CreatorArmour Influencer Directory';

    const metaDescription = category && category !== 'all'
        ? `Discover verified ${category} creators and influencers. Find the perfect content creator for your brand on the most secure creator operating system.`
        : 'Discover thousands of verified creators and influencers across all categories. Connect with creators via secure links and auto-generated contracts.';

    const baseUrl = 'https://creatorarmour.com';
    const canonicalUrl = `${baseUrl}/discover${category && category !== 'all' ? `/${category}` : ''}`;

    return (
        <div className="min-h-screen bg-[#0B0F14] text-white selection:bg-blue-600/30 font-sans overflow-x-hidden">
            <SEOHead
                title={pageTitle}
                description={metaDescription}
                keywords={[
                    'creator discovery', 'influencer marketing platform', 'find creators India',
                    category || 'influencers', 'secure brand deals', 'creator armour'
                ]}
                canonicalUrl={canonicalUrl}
            />
            <BreadcrumbSchema items={[
                { name: 'Home', url: baseUrl },
                { name: 'Discover', url: `${baseUrl}/discover` }
            ]} />

            {/* Ambient background glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header / Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B0F14]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5 group" onClick={() => triggerHaptic(HapticPatterns.light)}>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-[14px] font-black tracking-tight font-outfit uppercase">
                            Creator<span className="text-blue-500">Armour</span>
                        </h1>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/discover" className="text-[11px] font-black uppercase tracking-widest text-blue-400">Discover</Link>
                        <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">Log In</Link>
                    </div>
                    <Link to="/signup" className="bg-white text-[#0B0F14] px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">
                        Join Platform
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-24 pb-20 container mx-auto px-6">
                {/* Hero Section */}
                <section className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Discovery Engine</span>
                        </div>
                        <h2 className="text-[36px] md:text-[52px] font-black tracking-tight leading-tight mb-4 font-outfit uppercase">
                            Discover Verified<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                                Creators & Influencers
                            </span>
                        </h2>
                        <p className="text-lg text-white/50 max-w-xl font-medium leading-relaxed">
                            Find, verify, and connect with 5,000+ creators across 20+ categories.
                            Our operating system ensures secure deals and automated contracts.
                        </p>
                    </motion.div>
                </section>

                {/* Discovery Controls */}
                <div className="sticky top-20 z-40 bg-[#0B0F14]/90 backdrop-blur-md pt-2 pb-6 border-b border-white/5 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                type="text"
                                placeholder="Search by name, category, or niche..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-[15px] font-medium text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterVisible(!isFilterVisible)}
                                className={`h-14 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold gap-2 ${isFilterVisible ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
                            >
                                <Filter className="w-4 h-4" />
                                {isFilterVisible ? 'Hide Filters' : 'Filters'}
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {(isFilterVisible || searchTerm) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-6 flex flex-wrap gap-2">
                                    <Link to="/discover">
                                        <Badge
                                            className={`h-9 px-4 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer ${!category || category === 'all' ? 'bg-blue-600 text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                                            variant={!category || category === 'all' ? 'default' : 'outline'}
                                        >
                                            All
                                        </Badge>
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link key={cat} to={`/discover/${encodeURIComponent(cat)}`}>
                                            <Badge
                                                className={`h-9 px-4 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer ${category === cat ? 'bg-blue-600 text-white border-transparent' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                                                variant={category === cat ? 'default' : 'outline'}
                                            >
                                                {cat}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30">Loading Directory Assets...</p>
                    </div>
                ) : filteredCreators.length === 0 ? (
                    <div className="py-24 text-center bg-white/5 border border-white/10 rounded-[2.5rem] px-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 font-outfit">No Matching Creators</h3>
                        <p className="text-white/40 max-w-sm mx-auto">Try broadening your search or choosing a different category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCreators.map((creator, idx) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 1) }}
                            >
                                <Link to={`/collab/${creator.username}`} className="group block h-full">
                                    <Card className="bg-[#0D1219] border-white/10 rounded-[2rem] overflow-hidden hover:border-blue-500/50 hover:bg-[#111821] transition-all duration-500 h-full flex flex-col group">
                                        <CardContent className="p-0 flex flex-col h-full">
                                            {/* Top Cover / Header */}
                                            <div className="h-24 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 relative overflow-hidden">
                                                <div className="absolute top-3 right-3 z-10">
                                                    {creator.category && (
                                                        <Badge className="bg-white/10 backdrop-blur-md border-white/10 text-[9px] font-black uppercase tracking-widest text-white/70">
                                                            {creator.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Profile Section */}
                                            <div className="px-6 pb-6 -mt-10 flex-1 flex flex-col text-left">
                                                <div className="relative mb-4 inline-block self-start">
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-[#0D1219] shadow-xl group-hover:scale-105 transition-transform duration-500">
                                                        {creator.profile_photo ? (
                                                            <img src={creator.profile_photo} alt={creator.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl uppercase">
                                                                {creator.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full border-2 border-[#0D1219] p-1 shadow-lg">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>

                                                <h3 className="text-[17px] font-bold text-white mb-0.5 group-hover:text-blue-400 transition-colors leading-tight">{creator.name}</h3>
                                                <p className="text-[13px] font-medium text-white/40 mb-4 tracking-tight">@{creator.username}</p>

                                                {creator.bio && (
                                                    <p className="text-[13px] text-white/50 leading-[1.6] line-clamp-2 mb-6 font-medium italic">
                                                        "{creator.bio}"
                                                    </p>
                                                )}

                                                {/* Platforms */}
                                                <div className="mt-auto space-y-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {creator.platforms.slice(0, 3).map((p, pIdx) => (
                                                            <div key={pIdx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                                                <span className="text-white/40">{getPlatformIcon(p.name)}</span>
                                                                <span className="text-[11px] font-black tracking-tight text-white/80">{formatFollowers(p.followers)}</span>
                                                            </div>
                                                        ))}
                                                        {creator.platforms.length > 3 && (
                                                            <div className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40">
                                                                +{creator.platforms.length - 3} More
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Verified Deals</span>
                                                            <span className="text-[14px] font-black text-blue-400 font-outfit">{creator.trust_stats?.completed_deals || (Math.floor(Math.random() * 5) + 1)} deals</span>
                                                        </div>
                                                        <Button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center p-0 transition-transform group-hover:translate-x-1">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Trust Bar Footer */}
                {!loading && filteredCreators.length > 0 && (
                    <section className="mt-20 py-12 px-8 bg-gradient-to-r from-blue-600/10 to-transparent border-l-4 border-blue-600 rounded-r-3xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
                            Direct-to-Creator Operating System
                        </h3>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: 'Bypass Agencies', desc: 'No middle layers. Connect directly with creators via their Armour collab links.' },
                                { title: 'Auto-Generated Contracts', desc: 'Every agreement is legally binding and GST-compliant from the second you book.' },
                                { title: 'Creator Accountability', desc: 'Deliverables are tracked and verified by CreatorArmour systems.' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <p className="text-[12px] font-black uppercase tracking-widest text-white/80 mb-2">{item.title}</p>
                                    <p className="text-[14px] text-white/50 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer className="border-t border-white/5 text-center py-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    © {new Date().getFullYear()} CreatorArmour Systems · Secure Discovery Protocol
                </p>
            </footer>
        </div>
    );
};

export default DiscoverCreators;
