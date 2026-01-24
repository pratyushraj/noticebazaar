import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAllBlogPosts } from '@/data/blogPosts';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const blogPosts = getAllBlogPosts();

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return blogPosts;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return blogPosts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearch) ||
      post.summary.toLowerCase().includes(lowerCaseSearch) ||
      post.category.toLowerCase().includes(lowerCaseSearch) ||
      post.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearch))
    );
  }, [searchTerm, blogPosts]);

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = `${baseUrl}/blog`;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: canonicalUrl },
  ];

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title="CreatorArmour Blog: Legal & Business Guide"
        description="Expert articles on legal compliance, payment recovery, contract protection, and business growth for content creators and influencers in India."
        keywords={['creator blog', 'influencer legal advice', 'content creator guide', 'India', 'legal tips']}
        canonicalUrl={canonicalUrl}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-purple-300" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-white font-medium" aria-current="page">
                Blog
              </li>
            </ol>
          </nav>

        <Button 
          asChild 
          className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
          </Link>
        </Button>
        
        <header className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
            CreatorArmour Insights
          </h1>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto">
            Expert articles on legal compliance, tax strategy, and business growth for creators.
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
          <Input
            type="text"
            placeholder="Search articles (e.g., contracts, payments, taxes)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-3 bg-white/10 backdrop-blur-md text-white placeholder:text-purple-300/60 border-white/20 shadow-md focus:border-purple-400 focus:ring-purple-400"
          />
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-purple-200">No articles found matching "{searchTerm}".</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Card key={post.slug} className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20 flex flex-col overflow-hidden">
              {/* Featured Image */}
              <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden relative">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.opacity = '1';
                    }}
                  />
                ) : null}
                {/* Gradient background with icon - shows if no image or image fails */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center transition-opacity"
                  style={{ opacity: post.image ? 1 : 1 }}
                >
                  <FileText className="w-12 h-12 text-white/50" />
                </div>
              </div>
              
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="w-fit bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-purple-200">{post.readTime}</span>
                </div>
                <CardTitle className="text-xl font-semibold text-white hover:text-purple-200 transition-colors">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-purple-200/80 text-sm mb-4">{post.summary}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    <time dateTime={post.date} className="text-xs text-purple-300">
                      {new Date(post.date).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </time>
                  <Link to={`/blog/${post.slug}`} className="text-purple-300 hover:text-white text-sm font-medium flex items-center transition-colors">
                    Read More <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Blog;
