
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { blogPosts, BlogPost } from '@/data/blogPosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';

const BlogListing = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'Legal', 'Finance', 'Business', 'Tips'];

  const filteredPosts = activeCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#020D0A] text-white">
      <SEOHead
        title="Creator Armour Blog — Legal & Business Tips for Creators"
        description="Learn how to protect your brand deals, recover unpaid fees, and manage your creator business professionally in India."
        keywords={['creator blog', 'influencer tips', 'creator legal help', 'brand deal advice', 'India creator economy']}
        canonicalUrl="https://creatorarmour.com/blog"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 text-xs uppercase tracking-widest font-black">
            Creator Education
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight italic uppercase">
            The Creator <span className="text-emerald-500">Armour</span> Blog
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Infrastructure, legal guides, and business playbooks for the modern Indian creator.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="max-w-[1200px] mx-auto px-6 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[14px] font-black uppercase tracking-wider transition-all border ${
                activeCategory === cat
                  ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <main className="max-w-[1200px] mx-auto px-6 pb-32">
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group h-full">
                <Card className="h-full bg-white/5 border-white/10 overflow-hidden hover:border-emerald-500/50 transition-all hover:-translate-y-2 flex flex-col">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-800 relative">
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                        <BookOpen className="w-12 h-12 text-emerald-500/40" />
                      </div>
                    )}
                    <Badge className="absolute top-4 left-4 bg-emerald-500 text-white border-0 font-black text-[10px] uppercase tracking-wider">
                      {post.category}
                    </Badge>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    </div>
                    
                    <h2 className="text-xl font-black mb-4 leading-tight group-hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {post.summary}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[12px] font-black uppercase tracking-wider text-emerald-500 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                        Read Guide <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No articles found in this category.</p>
            <Button 
              variant="link" 
              onClick={() => setActiveCategory('All')}
              className="mt-4 text-emerald-500 hover:text-emerald-400"
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>

      {/* Newsletter / CTA */}
      <section className="bg-emerald-500 py-20 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-black mb-6 uppercase italic">
            Don't leave your <span className="text-white">business</span> to chance.
          </h2>
          <p className="text-lg text-emerald-950 font-bold mb-10">
            Join 500+ creators getting professional infrastructure for their brand deals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-black text-white hover:bg-slate-900 rounded-full px-10 h-14 text-lg font-black uppercase italic shadow-xl">
              <Link to="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogListing;
