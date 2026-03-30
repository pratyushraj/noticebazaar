import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ExternalLink, AlertCircle, FileText, Link2 } from 'lucide-react';
import { getBlogPostBySlug } from '@/data/blogPosts';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArticleSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import NotFound from './NotFound';

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;
  const resolvePublicAsset = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = (import.meta as any)?.env?.BASE_URL || '/';
    const normalizedBase = String(base).endsWith('/') ? String(base) : `${base}/`;
    const normalizedPath = String(path).replace(/^\//, '');
    return `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, '/');
  };

  // If post not found, show 404
  if (!post) {
    return <NotFound />;
  }

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const postImage = post.image || 'https://creatorarmour.com/og-preview.png';

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: canonicalUrl },
  ];

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={post.title}
        description={post.metaDescription}
        keywords={post.keywords}
        image={postImage}
        type="article"
        publishedTime={new Date(post.date).toISOString()}
        author={post.author?.name}
        canonicalUrl={canonicalUrl}
      />

      {/* Schema Markup */}
      <ArticleSchema
        title={post.title}
        description={post.metaDescription}
        image={postImage}
        datePublished={new Date(post.date).toISOString()}
        author={post.author}
      />
      <FAQSchema faqs={post.faqs} />
      <BreadcrumbSchema items={breadcrumbItems} />

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
              <li>
                <Link to="/blog" className="hover:text-emerald-400 transition-colors duration-200">
                  Insights
                </Link>
              </li>
              <li className="text-slate-600">/</li>
              <li className="text-emerald-400 font-medium truncate max-w-[200px] md:max-w-none" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

        <Button 
          asChild 
          variant="outline"
          className="mb-8 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white backdrop-blur-md transition-all group"
        >
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Insights
          </Link>
        </Button>
        
        <article className="max-w-4xl mx-auto mb-20 animate-fadeIn">
            {/* Article Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{post.category}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-black uppercase">
                  CA
                </div>
                <span className="font-medium text-slate-300">Creator Armour Team</span>
              </div>
              <span>•</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </header>
          
          {/* Featured Image */}
          {post.image && (
            <div className="w-full aspect-video md:h-[450px] bg-slate-900 rounded-[2.5rem] overflow-hidden mb-12 relative shadow-2xl border border-white/5">
                <img
                    src={resolvePublicAsset(post.image)}
                  alt={post.title}
                  className="w-full h-full object-cover relative z-10"
                  loading="lazy"
                />
            </div>
          )}
          
          {/* Article Content */}
          <div className="prose prose-invert max-w-none prose-lg prose-emerald">
              {/* Introduction */}
              <p className="text-xl text-slate-300 leading-relaxed font-light mb-12">
                {post.content.introduction}
              </p>

              {/* Sections */}
              <div className="space-y-12 text-slate-300">
                {post.content.sections.map((section, sectionIndex) => (
                  <section key={sectionIndex} className="scroll-mt-20">
                    <h2 className="text-3xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                      <span className="text-emerald-500 text-xl font-mono opacity-50">{String(sectionIndex + 1).padStart(2, '0')}</span>
                      {section.heading}
                    </h2>
                    <div className="leading-relaxed mb-6 whitespace-pre-line">
                      {section.content}
                    </div>

                    {/* Subsections (H3) */}
                    {section.subsections?.map((subsection, subsectionIndex) => (
                      <div key={subsectionIndex} className="mt-8 pl-6 border-l-2 border-emerald-500/20">
                        <h3 className="text-xl font-semibold text-white mb-4">
                          {subsection.heading}
                        </h3>
                        {subsection.isCodeBlock ? (
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/10 my-6 font-mono text-sm overflow-x-auto">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                              <span className="ml-2 text-[10px] text-slate-500 uppercase tracking-widest">Email Template</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed italic">
                              {subsection.content}
                            </p>
                          </div>
                        ) : (
                          <p className="leading-relaxed">
                            {subsection.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              {/* Conclusion */}
              {post.content.conclusion && (
                <div className="mt-16 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                  <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                    Final Thoughts
                  </h2>
                  <p className="text-lg text-slate-300 leading-relaxed italic relative z-10">
                    {post.content.conclusion}
                  </p>
                </div>
              )}

              {/* Internal Resources Section */}
              {post.internalLinks && (
                <div className="mt-20 space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4 tracking-tight flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-emerald-500/30"></span>
                    Related Toolbox
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {post.internalLinks.contractTool && (
                      <Link to="/contract-analyzer" className="block group">
                        <div className="bg-white/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col justify-between shadow-xl">
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                              <FileText className="h-5 w-5 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Contract Analyzer</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Instantly spot risky clauses and payment traps in your brand agreements.</p>
                          </div>
                          <div className="mt-6 flex items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            Try Tool <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    )}

                    {post.internalLinks.homepage && (
                      <Link to="/" className="block group">
                        <div className="bg-white/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col justify-between shadow-xl">
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                              <ExternalLink className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Creator Armour Home</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">The complete OS for high-trust brand collaborations and legal protection.</p>
                          </div>
                          <div className="mt-6 flex items-center text-xs font-bold text-blue-400 uppercase tracking-wider">
                            Main Site <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    )}

                    {post.internalLinks.collabLink && (
                      <Link to="/collab-action" className="block group">
                        <div className="bg-white/[0.03] backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:bg-white/[0.06] hover:border-fuchsia-500/30 transition-all duration-300 h-full flex flex-col justify-between shadow-xl">
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4 group-hover:bg-fuchsia-500/20 transition-colors">
                              <Link2 className="h-5 w-5 text-fuchsia-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">Collab Link Funnel</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Accept, counter, or decline offers in one flow and turn DMs into structured deals.</p>
                          </div>
                          <div className="mt-6 flex items-center text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                            Open Funnel <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* FAQ Section */}
              {post.faqs.length > 0 && (
                <div className="mt-20 pt-16 border-t border-white/5">
                  <h2 className="text-3xl font-bold text-white mb-10 tracking-tight">Common <span className="text-emerald-400">Questions</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {post.faqs.map((faq, index) => (
                      <div key={index} className="bg-white/[0.03] p-6 rounded-[1.5rem] border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-3">
                          {faq.question}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High Impact Funnel CTA */}
              <div className="mt-24 p-1 relative overflow-hidden rounded-[3rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-emerald-500/20 animate-gradient-shift"></div>
                <div className="relative bg-[#0F172A] p-10 md:p-14 rounded-[2.9rem] flex flex-col md:flex-row items-center justify-between gap-10 border border-white/5">
                  <div className="max-w-xl text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready for <span className="text-emerald-400">Higher Standards?</span></h2>
                    <p className="text-lg text-slate-400">Join 5,000+ creators closing professional, contract-backed brand deals on Creator Armour.</p>
                  </div>
                  <Button asChild className="px-10 py-8 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 group shrink-0">
                    <Link to="/signup">
                      Claim Your Free Link <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-20 pt-10 border-t border-white/5 opacity-50">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
                  <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-widest">
                    Legal Disclaimer: This article is for informational purposes only and does not constitute legal, financial, or professional advice. 
                    Laws vary by jurisdiction. Always consult with a qualified professional for advice specific to your business situation.
                  </p>
                </div>
              </div>
          </div>
        </article>
      </div>
    </div>
    </>
  );
};

export default BlogPostDetail;
