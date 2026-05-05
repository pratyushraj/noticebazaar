
import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArticleSchema, FAQSchema } from '@/components/seo/SchemaMarkup';
import { blogPosts, getBlogPostBySlug } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Share2, 
  ShieldCheck, 
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = useMemo(() => (slug ? getBlogPostBySlug(slug) : undefined), [slug]);

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  // Related posts (simple category based)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#020D0A] text-white pb-32">
      <SEOHead
        title={`${post.title} | Creator Armour Blog`}
        description={post.metaDescription}
        keywords={post.keywords}
        canonicalUrl={`https://creatorarmour.com/blog/${post.slug}`}
      />
      <ArticleSchema 
        title={post.title}
        description={post.metaDescription}
        datePublished={post.date}
        image={post.image}
      />
      {post.faqs.length > 0 && <FAQSchema faqs={post.faqs} />}

      {/* Hero Header */}
      <div className="relative pt-32 pb-12 px-6">
        <div className="max-w-[800px] mx-auto relative z-10">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-bold uppercase tracking-widest text-[10px] mb-8 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Blog
          </Link>
          
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 text-[10px] uppercase tracking-widest font-black">
            {post.category}
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-black mb-8 leading-[1.1] tracking-tight italic uppercase">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <User className="w-3 h-3 text-emerald-500" />
              </div>
              <span>{post.author?.name || 'Creator Armour'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <article className="lg:col-span-8">
          {post.image && (
            <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden mb-12 bg-slate-800 border border-white/5">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-invert prose-emerald max-w-none">
            <p className="text-xl text-slate-300 leading-relaxed font-medium mb-12 italic border-l-4 border-emerald-500 pl-6">
              {post.content.introduction}
            </p>

            {post.content.sections.map((section, idx) => (
              <div key={idx} className="mb-12">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6 uppercase italic tracking-tight">
                  {section.heading}
                </h2>
                <div className="text-slate-400 text-lg leading-relaxed font-medium mb-8">
                  {section.content.split('\n').map((para, pIdx) => (
                    <p key={pIdx} className="mb-4">{para}</p>
                  ))}
                </div>

                {section.subsections?.map((sub, sIdx) => (
                  <div key={sIdx} className="mb-8 pl-6 border-l border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4 italic">
                      {sub.heading}
                    </h3>
                    {sub.isCodeBlock ? (
                      <pre className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-emerald-400 font-mono overflow-x-auto mb-4">
                        {sub.content}
                      </pre>
                    ) : (
                      <div className="text-slate-400 text-base leading-relaxed font-medium">
                        {sub.content.split('\n').map((para, pIdx) => (
                          <p key={pIdx} className="mb-3">{para}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {post.content.conclusion && (
              <div className="mt-16 p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                <h2 className="text-xl font-black text-emerald-400 mb-4 uppercase tracking-wider">Final Thoughts</h2>
                <p className="text-slate-300 text-lg leading-relaxed font-medium m-0">
                  {post.content.conclusion}
                </p>
              </div>
            )}
          </div>

          {/* Social Share */}
          <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Share This Guide</span>
              <button 
                onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          {/* Internal CTA */}
          <Card className="p-8 bg-emerald-500 border-0 rounded-3xl text-black">
            <ShieldCheck className="w-10 h-10 mb-6 text-emerald-950" />
            <h3 className="text-2xl font-black mb-4 leading-tight uppercase italic">
              Close deals <br />Professionally.
            </h3>
            <p className="text-emerald-950 font-bold text-sm mb-8">
              Move from vague DMs to structured offers, safer contracts, and tracked payments.
            </p>
            <Button asChild className="w-full bg-black text-white hover:bg-slate-900 rounded-full font-black uppercase italic py-6">
              <Link to="/signup">Create My Link</Link>
            </Button>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 px-2">Related Guides</h3>
              <div className="space-y-4">
                {relatedPosts.map((rp) => (
                  <Link key={rp.slug} to={`/blog/${rp.slug}`} className="block group">
                    <Card className="p-5 bg-white/5 border-white/10 hover:border-emerald-500/50 transition-all group-hover:-translate-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 mb-2 block">{rp.category}</span>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {rp.title}
                      </h4>
                      <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-500">
                        <span>{rp.readTime}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Useful Tools */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/30 px-2">Free Tools</h3>
            <div className="space-y-3">
              <Link to="/rate-calculator" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group font-bold text-[13px] text-slate-300 hover:text-white">
                Influencer Rate Card
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
              </Link>
              <Link to="/free-influencer-contract" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group font-bold text-[13px] text-slate-300 hover:text-white">
                Contract Templates
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
              </Link>
              <Link to="/free-legal-check" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group font-bold text-[13px] text-slate-300 hover:text-white">
                Legal Health Check
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPost;
