import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Instagram, Youtube, Twitter, Facebook, Loader2, Users } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';

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
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12">
          {/* SEO Content */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              {category && category !== 'all' ? `${category} Creators` : 'Creator Directory'}
            </h1>
            <p className="text-xl text-purple-200 mb-6 leading-relaxed">
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
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-purple-200 border-white/20 hover:bg-white/10'
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-purple-200 border-white/20 hover:bg-white/10'
                    }`}
                >
                  {cat}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
            <Input
              type="text"
              placeholder="Search creators by name, username, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 py-3 bg-white/10 backdrop-blur-md text-white placeholder:text-purple-300/60 border-white/20"
            />
          </div>

          {/* Creators Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No creators found
                </h3>
                <p className="text-purple-200">
                  {searchTerm ? 'Try a different search term.' : 'No creators available in this category yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <Link key={creator.id} to={`/creator/${creator.username}`}>
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:border-purple-400/50 transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {creator.name}
                          </h3>
                          <p className="text-sm text-purple-300">@{creator.username}</p>
                        </div>
                        {creator.category && (
                          <Badge className="bg-purple-600/30 text-purple-200 border-purple-400/30">
                            {creator.category}
                          </Badge>
                        )}
                      </div>

                      {creator.bio && (
                        <p className="text-purple-200 text-sm mb-4 line-clamp-2">
                          {creator.bio}
                        </p>
                      )}

                      {creator.platforms.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-purple-300 font-medium">Platforms:</p>
                          <div className="flex flex-wrap gap-2">
                            {creator.platforms.map((platform, idx) => {
                              const isInstagram = platform.name.toLowerCase() === 'instagram';
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-1 text-xs text-purple-200 bg-white/5 px-2 py-1 rounded ${isInstagram && platform.handle ? 'hover:bg-white/10 transition-colors' : ''}`}
                                >
                                  {getPlatformIcon(platform.name)}
                                  {isInstagram && platform.handle ? (
                                    <a
                                      href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:text-white transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span>@{platform.handle.replace('@', '')}</span>
                                    </a>
                                  ) : (
                                    <>
                                      <span>{platform.name}</span>
                                      {platform.followers && (
                                        <span className="text-purple-300">
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
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        onClick={(e) => e.preventDefault()}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* SEO Footer Content */}
          <div className="mt-12 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              About the Creator Directory
            </h2>
            <p className="text-purple-200 leading-relaxed mb-4">
              Our creator directory helps brands discover verified influencers and content creators for collaborations.
              All creators listed have verified profiles and can be contacted through secure collaboration links.
            </p>
            <p className="text-purple-200 leading-relaxed">
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

