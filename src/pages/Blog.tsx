import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  category: 'Legal' | 'Finance' | 'Business' | 'Tips';
  readTime: string;
}

const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'protect-yourself-from-unpaid-brand-deals',
    title: 'How to Protect Yourself from Unpaid Brand Deals: A Creator\'s Guide',
    summary: 'Learn how to spot payment risks early, draft protective contracts, and recover unpaid fees when brands delay or refuse payment.',
    date: 'Jan 17, 2026',
    category: 'Legal',
    readTime: '8 min read',
  },
  {
    slug: 'red-flags-in-influencer-contracts',
    title: 'Red Flags in Influencer Contracts: What to Watch Out For',
    summary: 'Identify risky clauses, unfair payment terms, and content ownership issues before signing. Protect your rights as a creator.',
    date: 'Jan 12, 2026',
    category: 'Legal',
    readTime: '6 min read',
  },
  {
    slug: 'when-to-use-free-legal-consultations',
    title: 'When to Use Free Legal Consultations: A Creator\'s Guide',
    summary: 'Learn when to book a free legal consultation, what questions to ask, and how to make the most of your sessions with verified lawyers.',
    date: 'Jan 10, 2026',
    category: 'Legal',
    readTime: '5 min read',
  },
  {
    slug: 'tax-strategies-for-content-creators',
    title: 'Tax Strategies for Content Creators in India',
    summary: 'Understand GST registration, TDS implications, and tax-saving strategies specifically designed for content creators and influencers.',
    date: 'Jan 5, 2026',
    category: 'Finance',
    readTime: '10 min read',
  },
  {
    slug: '5-tips-for-faster-payment-recovery',
    title: '5 Tips for Faster Payment Recovery in India',
    summary: 'Learn proven strategies, from professional notices to legal action, to significantly reduce your outstanding receivables timeline.',
    date: 'Dec 28, 2025',
    category: 'Business',
    readTime: '7 min read',
  },
  {
    slug: 'building-your-creator-brand-legally',
    title: 'Building Your Creator Brand: Legal Foundations',
    summary: 'Essential legal steps every creator should take when building their brand, including trademark protection and business registration.',
    date: 'Dec 20, 2025',
    category: 'Business',
    readTime: '9 min read',
  },
  {
    slug: 'negotiating-better-brand-deals',
    title: 'Negotiating Better Brand Deals: A Practical Guide',
    summary: 'Master the art of contract negotiation with actionable tips on rates, deliverables, exclusivity clauses, and payment terms.',
    date: 'Dec 15, 2025',
    category: 'Tips',
    readTime: '6 min read',
  },
  {
    slug: 'intellectual-property-for-creators',
    title: 'Intellectual Property Rights for Content Creators',
    summary: 'Understand copyright, trademark, and content ownership rights to protect your creative work and prevent unauthorized use.',
    date: 'Dec 10, 2025',
    category: 'Legal',
    readTime: '8 min read',
  },
];

const getCategoryBadgeVariant = (category: BlogPost['category']) => {
  switch (category) {
    case 'Legal': return 'default';
    case 'Finance': return 'secondary';
    case 'Business': return 'pink';
    case 'Tips': return 'outline';
    default: return 'outline';
  }
};

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return MOCK_BLOG_POSTS;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return MOCK_BLOG_POSTS.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearch) ||
      post.summary.toLowerCase().includes(lowerCaseSearch) ||
      post.category.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
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
            <Card key={post.slug} className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20 flex flex-col">
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
                  <span className="text-xs text-purple-300">{post.date}</span>
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
  );
};

export default Blog;
