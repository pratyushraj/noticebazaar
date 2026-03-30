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
  const resolvePublicAsset = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = (import.meta as any)?.env?.BASE_URL || '/';
    const normalizedBase = String(base).endsWith('/') ? String(base) : `${base}/`;
    const normalizedPath = String(path).replace(/^\//, '');
    return `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, '/');
  };

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
        title="Creator Armour Blog: Creator Collaboration & Growth Guide"
        description="Guides on creator collaboration, pricing, deal workflows, contracts, and brand partnerships for creators in India."
        keywords={['creator blog', 'influencer legal advice', 'content creator guide', 'India', 'legal tips']}
        canonicalUrl={canonicalUrl}
      />

      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* CollectionPage Schema for Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Creator Armour Blog",
            description: "A collection of practical articles on creator collaboration, pricing, contracts, and business growth.",
            url: "https://creatorarmour.com/blog",
            isPartOf: { "@id": "https://creatorarmour.com/#website" },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: blogPosts.map((post, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${baseUrl}/blog/${post.slug}`,
              })),
            },
          })
        }}
      />

      <div className="min-h-screen bg-[#0B101A] text-white selection:bg-emerald-500/30">
        {/* Modern Background Decor */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto px-6 py-12 relative z-10">
          {/* Breadcrumb Navigation */}
          <nav className="mb-10 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-3 text-slate-400">
              <li className="flex items-center">
                <Link to="/" className="hover:text-emerald-400 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li className="text-slate-600">/</li>
              <li className="text-emerald-400 font-medium" aria-current="page">
                Insights
              </li>
            </ol>
          </nav>

          <header className="max-w-4xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 group cursor-default">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Expert Resources</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
              Creator Armour <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-500">Insights</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
              Practical guides on legal compliance, tax strategy, and deal logic designed specifically for the modern creator economy.
            </p>
          </header>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-6 mb-16 items-center">
            <div className="relative w-full max-w-lg group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <Input
                type="text"
                placeholder="Search articles, guides, taxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-white/[0.03] backdrop-blur-xl text-white placeholder:text-slate-500 border-white/10 rounded-2xl shadow-2xl focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-300"
              />
            </div>
            
            <Button
              asChild
              variant="outline"
              className="px-6 py-6 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white backdrop-blur-md transition-all group shrink-0"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl animate-fadeIn">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-xl text-slate-400">No articles found matching <span className="text-white">"{searchTerm}"</span></p>
              <Button 
                variant="ghost" 
                className="mt-4 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, idx) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group block h-full">
                  <Card className="h-full bg-white/[0.03] border-white/10 overflow-hidden rounded-[2rem] transition-all duration-500 hover:duration-300 hover:bg-white/[0.06] hover:border-emerald-500/30 hover:-translate-y-2 group shadow-2xl flex flex-col">
                    {/* Image Section */}
                    <div className="relative w-full h-56 overflow-hidden">
                      {post.image ? (
                        <img
                          src={resolvePublicAsset(post.image)}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 opacity-50"></div>
                          <FileText className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                      
                      {/* Floating Meta */}
                      <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-black/40 backdrop-blur-md text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {post.category}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B101A] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    </div>

                    <CardHeader className="pb-3 pt-6 px-6">
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mb-3 uppercase tracking-wider">
                        <span>{new Date(post.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span>{post.readTime}</span>
                      </div>
                      <CardTitle className="text-2xl font-bold leading-tight group-hover:text-emerald-400 transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col justify-between px-6 pb-8">
                      <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.summary}
                      </p>
                      <div className="flex items-center text-emerald-400 text-sm font-semibold group/btn">
                        Read full guide 
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-32 p-1 relative overflow-hidden rounded-[3rem]">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-emerald-500/20 animate-gradient-shift"></div>
             <div className="relative bg-[#0F172A] p-12 md:p-16 rounded-[2.9rem] flex flex-col md:flex-row items-center justify-between gap-10 border border-white/5">
                <div className="max-w-xl">
                  <h2 className="text-4xl font-bold mb-4 tracking-tight">Protect Your Brand <span className="text-emerald-400">Deals</span></h2>
                  <p className="text-lg text-slate-400">Get contract-first protection, automated invoices, and payment tracking with your free Creator Armour link.</p>
                </div>
                <Button asChild className="px-10 py-8 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group">
                  <Link to="/signup">
                    Get Your Link <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1" />
                  </Link>
                </Button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
