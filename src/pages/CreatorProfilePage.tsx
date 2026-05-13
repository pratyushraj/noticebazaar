import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, Youtube, Twitter, Facebook, CheckCircle2, Loader2, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { decodeHtmlEntities } from '@/lib/utils/dom';

// Person Schema Component (defined before use)
const PersonSchema = ({ schema }: { schema: any }) => {
  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="person"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'person');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="person"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
};

interface Creator {
  id: string;
  username: string;
  name: string;
  category: string | null;
  bio: string | null;
  profile_photo: string | null;
  platforms: Array<{ name: string; handle: string; followers?: number }>;
}

const CreatorProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchCreator();
    }
  }, [username]);

  const fetchCreator = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/collab/${username}`
      );
      const data = await response.json();

      if (data.success && data.creator) {
        setCreator(data.creator);
      } else {
        setCreator(null);
      }
    } catch (error) {
      console.error('[CreatorProfilePage] Error fetching creator:', error);
      setCreator(null);
    } finally {
      setLoading(false);
    }
  };

  const copyCollabLink = () => {
    if (creator?.username) {
      const link = `${window.location.origin}/${creator.username}`;
      navigator.clipboard.writeText(link);
      toast.success('Collaboration link copied!');
    }
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName?.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!creator) {
    return <Navigate to="/creators" replace />;
  }

  // Generate SEO meta tags
  const creatorName = decodeHtmlEntities(creator.name) || 'Creator';
  const platformNames = creator.platforms.map(p => p.name).join(', ');
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  const followerText = followerCount > 0
    ? `with ${followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} followers`
    : '';

  const metaTitle = `${creatorName} | ${creator.category || 'Creator'} Profile`;
  const metaDescription = `Brands can collaborate securely with ${creatorName}${creator.category ? `, ${creator.category} creator` : ''} ${followerText ? followerText : ''} on ${platformNames || 'social media'}. View profile, platforms, and collaboration details.`;

  const canonicalUrl = `https://creatorarmour.com/creator/${creator.username}`;
  const pageImage = creator.profile_photo && /^https?:\/\//i.test(creator.profile_photo)
    ? creator.profile_photo
    : 'https://creatorarmour.com/og-preview.png';

  const breadcrumbItems = [
    { name: 'Home', url: 'https://creatorarmour.com' },
    { name: 'Creators', url: 'https://creatorarmour.com/creators' },
    { name: creatorName, url: canonicalUrl },
  ];

  // Person Schema
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creatorName,
    description: metaDescription,
    url: canonicalUrl,
    image: pageImage,
    jobTitle: creator.category ? `${creator.category} Creator` : 'Content Creator',
    knowsAbout: creator.category || 'Content Creation',
    sameAs: creator.platforms.map(p => {
      switch (p?.name?.toLowerCase()) {
        case 'instagram':
          return `https://instagram.com/${p.handle.replace('@', '')}`;
        case 'youtube':
          return `https://youtube.com/${p.handle}`;
        case 'twitter':
          return `https://twitter.com/${p.handle.replace('@', '')}`;
        case 'facebook':
          return p.handle;
        default:
          return null;
      }
    }).filter(Boolean),
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={[
          creatorName,
          `${creatorName} influencer`,
          creator.category || 'creator',
          'brand collaboration',
          'influencer marketing',
          'content creator',
          'India',
        ]}
        image={pageImage}
        type="article"
        canonicalUrl={canonicalUrl}
      />

      {/* Person Schema */}
      <PersonSchema schema={personSchema} />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-secondary" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/creators" className="hover:text-foreground transition-colors">
                  Creators
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium" aria-current="page">
                {creatorName}
              </li>
            </ol>
          </nav>

          {/* Creator Profile Header */}
          <Card className="bg-secondary/50 backdrop-blur-md border-border mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-foreground">
                      {decodeHtmlEntities(creator.name)}
                    </h1>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      {creator.category && (
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 rounded-full text-sm font-medium">
                          {creator.category}
                        </Badge>
                      )}
                      <CheckCircle2 className="h-6 w-6 text-purple-400 fill-purple-400/10" />
                    </div>
                  </div>
                  <p className="text-foreground/60 text-lg mb-6">
                    @{decodeHtmlEntities(creator.username)}
                  </p>
                  {creator.bio && (
                    <p className="text-secondary leading-relaxed mb-4">{creator.bio}</p>
                  )}

                  {/* SEO Copy */}
                  <div className="bg-secondary/50 border border-purple-500/20 rounded-lg p-4 mt-4">
                    <p className="text-secondary leading-relaxed">
                      <strong className="text-foreground">Brands can collaborate securely with {creator.name}</strong> through Creator Armour's
                      secure collaboration system. Submit collaboration requests, manage contracts, and track payments all in one place.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platforms Section */}
          {creator.platforms.length > 0 && (
            <Card className="bg-secondary/50 backdrop-blur-md border-border mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Active Platforms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creator.platforms.map((platform, idx) => {
                    const isInstagram = platform?.name?.toLowerCase() === 'instagram';
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border"
                      >
                        {getPlatformIcon(platform.name)}
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{platform.name}</p>
                          {isInstagram && platform.handle ? (
                            <a
                              href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              @{platform.handle.replace('@', '')}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <p className="text-sm text-secondary">{platform.handle}</p>
                          )}
                          {platform.followers && (
                            <p className="text-sm text-secondary mt-1">
                              {platform.followers >= 1000
                                ? `${(platform.followers / 1000).toFixed(1)}K followers`
                                : `${platform.followers} followers`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collaboration Link */}
          <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md border-purple-500/30">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Collaborate with {creator.name}
              </h2>
              <p className="text-secondary mb-4">
                Submit a collaboration request through our secure system. All deals are handled with proper contracts,
                payment tracking, and legal protection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex items-center gap-2 bg-secondary/50 px-4 py-3 rounded-lg border border-border">
                  <code className="text-sm text-secondary flex-1">
                    creatorarmour.com/{creator.username}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCollabLink}
                    className="h-8 w-8 p-0 text-secondary hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  asChild
                  className="bg-card text-secondary hover:bg-secondary"
                >
                  <Link to={`/${creator.username}`}>
                    View Collaboration Page <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional SEO Content */}
          <div className="mt-8 bg-card backdrop-blur-md rounded-xl p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              About {creator.name}
            </h2>
            <p className="text-secondary leading-relaxed mb-4">
              {(() => {
                const instagramPlatform = creator.platforms.find(p => p?.name?.toLowerCase() === 'instagram');
                const instagramHandle = instagramPlatform?.handle?.replace('@', '');
                if (instagramHandle) {
                  return `Instagram creator ${instagramHandle} (${creator.name}) is a verified ${creator.category || 'content'} creator based in India, working with brands to create authentic content and meaningful collaborations. Brands can collaborate securely with ${creator.name} through Creator Armour's platform, which ensures proper contracts, payment protection, and professional workflow management.`;
                }
                return `${creator.name} is a verified ${creator.category || 'content'} creator based in India, working with brands to create authentic content and meaningful collaborations. Brands can collaborate securely with ${creator.name} through Creator Armour's platform, which ensures proper contracts, payment protection, and professional workflow management.`;
              })()}
            </p>
            <p className="text-secondary leading-relaxed">
              This creator profile is part of Creator Armour's verified creator directory, helping brands discover and
              connect with influencers for marketing campaigns and brand partnerships.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorProfilePage;

