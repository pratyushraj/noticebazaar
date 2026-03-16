import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Instagram, Youtube, Twitter, Facebook, Loader2, Users, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';

interface Creator {
  id: string;
  username: string;
  name: string;
  category: string | null;
  bio: string | null;
  platforms: Array<{ name: string; handle: string; followers?: number }>;
}

const CreatorsDirectory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { session, profile } = useSession();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const dashboardPath =
    profile?.role === 'admin' ? '/admin-dashboard'
      : profile?.role === 'brand' ? '/brand-dashboard'
        : profile?.role === 'chartered_accountant' ? '/ca-dashboard'
          : profile?.role === 'lawyer' ? '/lawyer-dashboard'
            : '/creator-dashboard';

  useEffect(() => {
    fetchCreators();
    fetchCategories();
  }, [category]);

  const fetchCreators = async () => {
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
      console.error('[CreatorsDirectory] Error fetching creators:', error);
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
      console.error('[CreatorsDirectory] Error fetching categories:', error);
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const pageTitle = category && category !== 'all'
    ? `${category} Creators | Creator Directory`
    : 'Creator Directory | Find Influencers & Content Creators';

  const metaDescription = category && category !== 'all'
    ? `Browse ${category} creators and influencers. Find verified content creators in ${category} for brand collaborations and partnerships.`
    : 'Browse verified creators and influencers. Find content creators by category for brand collaborations, influencer marketing, and partnerships.';

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = category && category !== 'all'
    ? `${baseUrl}/creators/${category}`
    : `${baseUrl}/creators`;

  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Creators', url: `${baseUrl}/creators` },
  ];

  if (category && category !== 'all') {
    breadcrumbItems.push({ name: category, url: canonicalUrl });
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={[
          'creator directory',
          'influencer directory',
          'content creators',
          category || 'creators',
          'brand collaboration',
          'India',
        ]}
        canonicalUrl={canonicalUrl}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

	      <div className="min-h-screen text-slate-900 bg-white relative overflow-hidden">
          {/* Brand theme background (green/white/blue) */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.14),transparent_60%)]" />
            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-50/80 via-sky-50/40 to-transparent" />
          </div>
	        <div className="container mx-auto px-4 py-12 relative">
            {/* Signed-in navigation affordance (mobile-first) */}
            {session && (
              <div className="sticky top-0 z-40 -mx-4 px-4 pt-[max(0px,env(safe-area-inset-top,0px))] pb-3 mb-4 bg-gradient-to-b from-white/80 via-white/60 to-transparent backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => navigate(dashboardPath)}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/70 border border-slate-200 hover:bg-white active:scale-[0.99] transition-all text-[12px] font-bold text-slate-900 shadow-sm"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Dashboard</span>
                  <LayoutDashboard className="h-4 w-4 opacity-70" />
                </button>
              </div>
            )}
          {/* SEO Content */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-700 via-sky-700 to-emerald-600 text-transparent bg-clip-text">
              {category && category !== 'all' ? `${category} Creators` : 'Creator Directory'}
            </h1>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              {category && category !== 'all'
                ? `Discover verified ${category} creators and influencers. Browse profiles, view platforms, and connect with creators for brand collaborations.`
                : 'Discover verified creators and influencers across all categories. Browse profiles, view platforms, and connect with creators for brand collaborations and partnerships.'}
            </p>
          </div>

          {/* Category Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Link to="/creators">
              <Badge
                variant={!category || category === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer ${!category || category === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
              >
                All Categories
              </Badge>
            </Link>
            {categories.map((cat) => (
              <Link key={cat} to={`/creators/${encodeURIComponent(cat)}`}>
                <Badge
                  variant={category === cat ? 'default' : 'outline'}
                  className={`cursor-pointer ${category === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                >
                  {cat}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
            <Input
              type="text"
              placeholder="Search creators by name, username, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 py-3 bg-white/80 backdrop-blur-md text-slate-900 placeholder:text-slate-500 border-slate-200 shadow-sm"
            />
          </div>

          {/* Creators Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-emerald-600 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No creators found
                </h3>
                <p className="text-slate-600">
                  {searchTerm ? 'Try a different search term.' : 'No creators available in this category yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
	            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
	              {filteredCreators.map((creator) => (
	                <div
	                  key={creator.id}
	                  role="link"
	                  tabIndex={0}
	                  onClick={() => navigate(`/creator/${creator.username}`)}
	                  onKeyDown={(e) => {
	                    if (e.key === 'Enter' || e.key === ' ') {
	                      e.preventDefault();
	                      navigate(`/creator/${creator.username}`);
	                    }
	                  }}
	                  className="outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 rounded-xl"
	                >
	                  <Card className="bg-white/80 backdrop-blur-md border-slate-200 hover:border-emerald-300 transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full shadow-sm">
	                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-1">
                            {creator.name}
                          </h3>
                          <p className="text-sm text-sky-700">@{creator.username}</p>
                        </div>
                        {creator.category && (
                          <Badge className="bg-emerald-500/10 text-emerald-800 border-emerald-200">
                            {creator.category}
                          </Badge>
                        )}
                      </div>

                      {creator.bio && (
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {creator.bio}
                        </p>
                      )}

                      {creator.platforms.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-medium">Platforms:</p>
                          <div className="flex flex-wrap gap-2">
                            {creator.platforms.map((platform, idx) => {
                              const isInstagram = platform.name.toLowerCase() === 'instagram';
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-1 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 ${isInstagram && platform.handle ? 'hover:bg-white transition-colors' : ''}`}
                                >
                                  {getPlatformIcon(platform.name)}
                                  {isInstagram && platform.handle ? (
                                    <a
                                      href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span>@{platform.handle.replace('@', '')}</span>
                                    </a>
                                  ) : (
                                    <>
                                      <span>{platform.name}</span>
                                      {platform.followers && (
                                        <span className="text-slate-500">
                                          {platform.followers >= 1000
                                            ? `${(platform.followers / 1000).toFixed(1)}K`
                                            : platform.followers}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

	                      <Button
	                        className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white"
		                        onClick={(e) => {
	                          e.preventDefault();
	                          e.stopPropagation();
	                          navigate(`/creator/${creator.username}`);
	                        }}
	                      >
	                        View Profile
	                      </Button>
	                    </CardContent>
	                  </Card>
	                </div>
	              ))}
	            </div>
          )}

          {/* SEO Footer Content */}
          <div className="mt-12 bg-white/80 backdrop-blur-md rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              About the Creator Directory
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Our creator directory helps brands discover verified influencers and content creators for collaborations.
              All creators listed have verified profiles and can be contacted through secure collaboration links.
            </p>
            <p className="text-slate-600 leading-relaxed">
              {category && category !== 'all'
                ? `Browse ${category} creators to find the perfect match for your brand. Each creator profile includes platform information, follower counts, and collaboration details.`
                : 'Browse creators by category to find influencers in fashion, tech, fitness, food, travel, and more. Each creator profile includes platform information and collaboration details.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorsDirectory;
