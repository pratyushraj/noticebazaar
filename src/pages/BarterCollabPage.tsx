import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Package, ArrowRight, CheckCircle2, Star,
  Gift, TrendingUp, Users, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { getApiBaseUrl } from '@/lib/utils/api';
import { withRetry } from '@/lib/utils/retry';
import { safeAvatarSrc } from '@/lib/utils/image';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const faqs = [
  {
    q: 'What is a barter collab with an influencer?',
    a: 'A barter collaboration (also called product exchange or gifting) is when a brand sends its product to a creator in exchange for content — a Reel, video review, or story — without a cash payment. The creator keeps the product as their fee.'
  },
  {
    q: 'Why do most agencies not offer barter deals?',
    a: 'Influencer agencies charge a percentage of deal value (typically 15–30%). Since barter deals have no cash component, agencies earn nothing. That\'s why no major platform actively promotes barter — except Creator Armour, which operates on a platform model instead.'
  },
  {
    q: 'Are barter deals legal and enforceable in India?',
    a: 'Yes. A barter agreement is a valid contract under Indian contract law. Creator Armour auto-generates a digital barter agreement covering deliverables, product value, usage rights, and timelines — so both sides are protected.'
  },
  {
    q: 'What products work best for barter collaborations?',
    a: 'Barter works best for products priced ₹500–₹5,000 in categories like skincare, food & beverages, gadgets, fashion, supplements, and home decor. Products with strong visual appeal or a lifestyle angle perform especially well.'
  },
  {
    q: 'How many followers does a creator need for barter?',
    a: 'Nano and micro-influencers (1K–100K followers) are the sweet spot for barter. They often have higher engagement rates than macro-influencers and are genuinely open to product exchanges, especially for products they would use anyway.'
  },
  {
    q: 'How does Creator Armour help with barter deals?',
    a: 'Creator Armour lets you browse creators who are open to barter, send a structured product offer (specifying the product, value, and deliverables), generate a barter contract, and track content delivery — all without DMs or WhatsApp.'
  },
];

const whyBarter = [
  {
    icon: TrendingUp,
    title: 'Higher authenticity',
    desc: 'Creators who choose a product they genuinely want produce more authentic content. Audiences can tell the difference.'
  },
  {
    icon: Users,
    title: 'Access to nano creators',
    desc: 'Micro and nano influencers (1K–50K) rarely take cash deals but are highly open to barter. That\'s millions of engaged followers brands miss.'
  },
  {
    icon: Zap,
    title: 'Lower cost per reach',
    desc: 'For D2C brands with physical products, barter CPM can be 5–10x lower than paid media. Product cost is often already in COGS.'
  },
  {
    icon: Gift,
    title: 'Scaleable gifting programs',
    desc: 'Send 10, 50, or 200 product packages with structured agreements, not one-off DMs. Creator Armour tracks each one.'
  },
];

interface Creator {
  id: string;
  username: string;
  name: string;
  category: string | null;
  avatar_url?: string | null;
  avg_reel_views_manual?: number;
  avg_views?: number;
  barter_min_value?: number;
  starting_price?: number;
  discovery_video_url?: string | null;
  is_verified?: boolean;
  location?: string;
}

const BarterCollabPage = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('light');
    fetchBarterCreators();
  }, []);

  const fetchBarterCreators = async () => {
    try {
      const response = await withRetry(() =>
        fetch(`${getApiBaseUrl()}/api/creators?limit=100`)
      );
      const data = await response.json();
      if (data.success) {
        // Filter creators open to barter (have barter_min_value or very low starting price, or collaboration_preference includes barter)
        const barterOpen = (data.creators || []).filter((c: Creator) =>
          c.barter_min_value != null || (c.starting_price != null && c.starting_price <= 3000)
        ).slice(0, 6);
        setCreators(barterOpen.length >= 3 ? barterOpen : (data.creators || []).slice(0, 6));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  const formatViews = (v?: number) => {
    if (!v) return '—';
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M+`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K+`;
    return `${v}`;
  };

  return (
    <div className="min-h-dvh bg-[#F8FAF9] text-[#0F172A] font-sans overflow-x-hidden">
      <SEOHead
        title="Barter Collab Influencers India — Find Creators Open to Product Exchange"
        description="Find Indian influencers and UGC creators open to barter deals and product exchange collaborations. No agency fees. Send structured offers, generate contracts, track delivery."
        keywords={[
          'barter collab influencers India',
          'product exchange influencer India',
          'influencer gifting India',
          'product seeding influencer',
          'barter deal creator India',
          'free product review influencer India',
          'non-monetary influencer collaboration',
          'barter influencer marketing',
          'micro influencer barter India',
          'product exchange collaboration India',
        ]}
        canonicalUrl="https://creatorarmour.com/barter-collab"
        jsonLd={faqSchema}
      />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => triggerHaptic(HapticPatterns.light)}>
            <div className="w-8 h-8 bg-[#16A34A] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-[16px] font-black tracking-tight text-[#0F172A] hidden min-[380px]:block">Creator Armour</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/discover" className="hidden md:block text-[13px] font-bold text-[#64748B] hover:text-[#0F172A] transition-colors">Browse Creators</Link>
            <Link
              to="/signup?mode=brand"
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-full text-[13px] font-black shadow-lg transition-all"
            >
              Post Barter Campaign
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero */}
        <section className="px-4 sm:px-6 max-w-[1200px] mx-auto py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DCFCE7] text-[#16A34A] rounded-full border border-[#16A34A]/20 mb-6">
            <Package className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">India's First Structured Barter Marketplace</span>
          </div>

          <h1 className="text-[44px] md:text-[68px] lg:text-[80px] font-black tracking-tight leading-[1.05] mb-6 text-[#0F172A]">
            Find creators open to<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16A34A] to-[#15803D]">barter deals in India</span>
          </h1>

          <p className="text-[18px] md:text-[22px] text-[#64748B] font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            No agencies. No commission. Just send your product, get authentic content. 
            Creator Armour handles agreements, delivery tracking, and payments — even for barter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/signup?mode=brand"
              className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-5 rounded-full font-black text-[17px] shadow-xl shadow-[#16A34A]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Start a Barter Campaign <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/discover"
              className="w-full sm:w-auto bg-white border border-[#E5E7EB] text-[#64748B] px-8 py-5 rounded-full font-black text-[16px] transition-all flex items-center justify-center gap-2 hover:border-[#16A34A] hover:text-[#16A34A]"
            >
              Browse All Creators
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { stat: '0%', label: 'Agency commission' },
              { stat: '100%', label: 'Contract protected' },
              { stat: '24h', label: 'Creator response' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-[#E5E7EB] px-3 py-4 text-center shadow-sm">
                <p className="text-xl font-black text-[#0F172A]">{item.stat}</p>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Barter */}
        <section className="bg-[#0F172A] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#16A34A] mb-3">Why it works</p>
              <h2 className="text-3xl md:text-[42px] font-black text-white tracking-tight">
                The smartest way to scale content
              </h2>
              <p className="mt-4 text-slate-400 font-medium max-w-xl mx-auto">
                Agencies skip barter because they earn 0% of nothing. That means you're the first brand to reach thousands of creators who are genuinely open to product deals.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyBarter.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 bg-[#16A34A]/20 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#16A34A]" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Creator Grid */}
        <section className="py-16 md:py-20 px-4 sm:px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#16A34A] mb-3">Verified creators</p>
            <h2 className="text-3xl md:text-[42px] font-black text-[#0F172A] tracking-tight">
              Browse barter-ready creators
            </h2>
            <p className="mt-4 text-[#64748B] font-medium max-w-xl mx-auto">
              Every creator below has a verified profile, set rates, and an auto-generated agreement waiting for your offer.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] rounded-[32px] bg-[#E5E7EB] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map(creator => (
                <div key={creator.id} className="group relative aspect-[4/5] rounded-[32px] overflow-hidden bg-slate-100 shadow-lg border-4 border-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  {creator.discovery_video_url ? (
                    <video src={creator.discovery_video_url} className="w-full h-full object-cover" autoPlay muted loop playsInline poster={creator.avatar_url || ''} />
                  ) : (
                    <img
                      src={safeAvatarSrc(creator.avatar_url, creator.name)}
                      alt={creator.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-900/40 backdrop-blur-sm px-3 py-1 rounded-md border border-emerald-400/20">
                      {creator.category || 'Lifestyle'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-900/40 backdrop-blur-sm px-3 py-1 rounded-md border border-yellow-400/20">
                      Barter OK
                    </span>
                  </div>

                  <div className="absolute top-6 right-6">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-[16px] text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">Reel Views</p>
                      <p className="text-sm font-black">{formatViews(creator.avg_reel_views_manual || creator.avg_views)}</p>
                    </div>
                  </div>

                  <div className="absolute bottom-8 inset-x-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-white tracking-tight">{creator.name}</h3>
                      {creator.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-white" />}
                    </div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">@{creator.username}</p>
                    <Link
                      to={`/${creator.username}`}
                      className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#16A34A] text-white font-black text-sm shadow-lg hover:bg-[#15803D] transition-all"
                    >
                      Send Barter Offer <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white border border-[#E5E7EB] text-[#0F172A] font-black text-[15px] hover:border-[#16A34A] hover:text-[#16A34A] transition-all shadow-sm"
            >
              Explore Full Directory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#F8FAF9] border-y border-[#E5E7EB] py-16 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-[40px] font-black text-[#0F172A] tracking-tight">
                How barter works on Creator Armour
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Browse creators', desc: 'Filter by niche, location, and audience size. Every profile shows rates and open-to-barter status.' },
                { step: '02', title: 'Send a product offer', desc: 'Specify your product, its value, what content you need, and the deadline. Creator gets a structured offer — no DM negotiation.' },
                { step: '03', title: 'Auto-generated contract', desc: 'Both sides sign a digital barter agreement covering deliverables, usage rights, and revision terms.' },
                { step: '04', title: 'Ship & track content', desc: 'Enter your shipping details. Creator uploads content for your approval. Platform tracks every step.' },
              ].map(item => (
                <div key={item.step} className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm">
                  <p className="text-[40px] font-black text-[#16A34A]/20 leading-none mb-3">{item.step}</p>
                  <h3 className="text-lg font-black text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#64748B] font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 px-4 sm:px-6 max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#16A34A] mb-3">Common questions</p>
            <h2 className="text-3xl md:text-[40px] font-black text-[#0F172A] tracking-tight">
              Everything about barter deals
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-black text-[#0F172A] text-[15px] pr-4">{faq.q}</span>
                  {openFaq === idx
                    ? <ChevronUp className="w-5 h-5 text-[#16A34A] shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-[#64748B] shrink-0" />
                  }
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-[#64748B] text-sm font-medium leading-relaxed border-t border-[#F1F5F9]">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-[900px] mx-auto bg-[#0F172A] rounded-[40px] p-10 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#16A34A]/20 text-[#16A34A] rounded-full border border-[#16A34A]/30 mb-6">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[11px] font-black uppercase tracking-wider">Stop missing barter-ready creators</span>
            </div>
            <h2 className="text-3xl md:text-[48px] font-black text-white tracking-tight leading-tight mb-4">
              Post your first barter campaign today
            </h2>
            <p className="text-slate-400 font-medium text-lg mb-8 max-w-xl mx-auto">
              Agencies skip barter. We don't. Find creators who actually want your product — and close the deal with a contract.
            </p>
            <Link
              to="/signup?mode=brand"
              className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white px-10 py-5 rounded-full font-black text-[18px] shadow-xl shadow-[#16A34A]/30 hover:-translate-y-0.5 transition-all"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-slate-500 text-sm font-medium mt-4">No agency fee. No commission. Free to post.</p>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-[#E5E7EB] text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
          © {new Date().getFullYear()} Creator Armour · <Link to="/privacy-policy" className="hover:text-[#16A34A]">Privacy</Link> · <Link to="/terms-of-service" className="hover:text-[#16A34A]">Terms</Link> · <Link to="/discover" className="hover:text-[#16A34A]">Browse Creators</Link>
        </p>
      </footer>
    </div>
  );
};

export default BarterCollabPage;
