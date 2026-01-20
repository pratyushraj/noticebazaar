import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NewsletterSignup from '@/components/NewsletterSignup';
import ImageWithPlaceholder from '@/components/ui/ImageWithPlaceholder';

interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  category: 'Legal' | 'Compliance' | 'Finance' | 'Tech';
  image: string;
}

const IMAGE_POOL = [
  '/NOTICERBAZAAR.jpg',
  '/blog-images/annual-filings-dashboard.png',
  '/blog-images/gst-checklist.jpg',
  '/pasted-image-2025-10-29T16-12-40-981Z.png',
];

const FALLBACK_IMAGE_URL = '/placeholder.svg';

const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'protect-yourself-from-unpaid-brand-deals',
    title: 'How to Protect Yourself from Unpaid Brand Deals: A Creator\'s Guide',
    summary: 'Learn how to spot payment risks early, draft protective contracts, and recover unpaid fees when brands delay or refuse payment.',
    date: 'Jan 17, 2026',
    category: 'Legal',
    image: IMAGE_POOL[0],
  },
  {
    slug: 'consumer-complaints-guide-for-creators',
    title: 'Consumer Complaints Guide: How Creators Can File Complaints Against Brands',
    summary: 'Step-by-step guide on filing consumer complaints against brands, e-commerce platforms, and service providers. Get legal notices drafted and sent.',
    date: 'Jan 15, 2026',
    category: 'Legal',
    image: IMAGE_POOL[0],
  },
  {
    slug: 'red-flags-in-influencer-contracts',
    title: 'Red Flags in Influencer Contracts: What to Watch Out For',
    summary: 'Identify risky clauses, unfair payment terms, and content ownership issues before signing. Protect your rights as a creator.',
    date: 'Jan 12, 2026',
    category: 'Legal',
    image: IMAGE_POOL[0],
  },
  {
    slug: 'when-to-use-free-legal-consultations',
    title: 'When to Use Free Legal Consultations: A Creator\'s Guide',
    summary: 'Learn when to book a free legal consultation, what questions to ask, and how to make the most of your 15-minute sessions with verified lawyers.',
    date: 'Jan 10, 2026',
    category: 'Legal',
    image: IMAGE_POOL[0],
  },
  {
    slug: 'gst-compliance-checklist',
    title: 'Complete GST Compliance Checklist for Startups in 2025',
    summary: 'A comprehensive, month-by-month checklist to ensure your business remains 100% compliant with GST regulations and avoids penalties.',
    date: 'Nov 1, 2025',
    category: 'Compliance',
    image: '/blog-images/gst-checklist.jpg',
  },
  {
    slug: 'annual-corporate-filings-importance',
    title: 'The Importance of Annual Corporate Filings for SMEs',
    summary: 'Understand the mandatory annual filings (ROC, AOC-4, MGT-7) and how to avoid penalties for non-compliance.',
    date: 'Nov 1, 2025',
    category: 'Compliance',
    image: '/blog-images/annual-filings-dashboard.png',
  },
  {
    slug: 'gst-filing-deadlines-2025',
    title: 'GST Filing Deadlines 2025: What SMEs Need to Know',
    summary: 'Stay compliant with the latest GST filing dates and avoid penalties. We break down the monthly and quarterly requirements.',
    date: 'Oct 15, 2025',
    category: 'Compliance',
    image: '/blog-images/gst-checklist.jpg',
  },
  {
    slug: '5-tips-for-faster-payment-recovery',
    title: '5 Tips for Faster Payment Recovery in India',
    summary: 'Learn proven strategies, from professional notices to legal action, to significantly reduce your outstanding receivables timeline.',
    date: 'Sep 28, 2025',
    category: 'Legal',
    image: IMAGE_POOL[0],
  },
  {
    slug: 'choosing-the-right-business-entity',
    title: 'Pvt Ltd vs. LLP: Choosing the Right Business Entity for Your Startup',
    summary: 'A detailed comparison of liability, compliance burden, and tax implications to help you make an informed decision.',
    date: 'Sep 10, 2025',
    category: 'Finance',
    image: IMAGE_POOL[1],
  },
  {
    slug: 'ai-in-legal-tech',
    title: 'The Role of AI in Modern Legal Tech for SMEs',
    summary: 'How digital paralegals and AI assistants are streamlining administrative tasks and improving access to justice.',
    date: 'Aug 20, 2025',
    category: 'Tech',
    image: '/pasted-image-2025-10-29T16-12-40-981Z.png',
  },
];

const getCategoryColor = (category: BlogPost['category']) => {
  switch (category) {
    case 'Legal': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'Compliance': return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'Finance': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Tech': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return MOCK_BLOG_POSTS;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return MOCK_BLOG_POSTS.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearch) ||
      post.summary.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(MOCK_BLOG_POSTS.map(p => p.category)));
    return cats;
  }, []);

  // Get recent posts (latest 5)
  const recentPosts = useMemo(() => {
    return MOCK_BLOG_POSTS.slice(0, 5);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* WordPress-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              CreatorArmour
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/blog" className="text-blue-600 font-medium">Blog</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">About</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area (WordPress style - 70% width) */}
          <main className="lg:w-2/3">
            {/* Page Title */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
              <p className="text-lg text-gray-600">
                Expert articles on legal compliance, tax strategy, and business growth for Indian SMEs.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No articles found matching "{searchTerm}".</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPosts.map((post) => (
                  <article key={post.slug} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Featured Image */}
                    <Link to={`/blog/${post.slug}`}>
                      <div className="w-full h-64 overflow-hidden bg-gray-100">
                        <ImageWithPlaceholder
                          src={post.image}
                          alt={post.title}
                          fallback={FALLBACK_IMAGE_URL}
                          aspectRatio="video"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Post Content */}
                    <div className="p-6">
                      {/* Category Badge */}
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>

                      {/* Meta Information */}
                      <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {post.date}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          CreatorArmour Team
                        </span>
                      </div>

                      {/* Excerpt */}
                      <p className="text-gray-700 text-base leading-relaxed mb-4">
                        {post.summary}
                      </p>

                      {/* Read More Link */}
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                      >
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination (WordPress style) */}
            <div className="mt-12 flex justify-center">
              <nav className="flex space-x-2">
                <Button variant="outline" className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                  Previous
                </Button>
                <Button variant="outline" className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-blue-50 border-blue-300 text-blue-700">
                  1
                </Button>
                <Button variant="outline" className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                  2
                </Button>
                <Button variant="outline" className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                  Next
                </Button>
              </nav>
            </div>
          </main>

          {/* Sidebar (WordPress style - 30% width) */}
          <aside className="lg:w-1/3">
            <div className="space-y-6">
              {/* Search Widget */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                    Search
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Categories Widget */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                    Categories
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((category) => {
                      const count = MOCK_BLOG_POSTS.filter(p => p.category === category).length;
                      return (
                        <li key={category}>
                          <Link 
                            to={`/blog?category=${category}`}
                            className="flex items-center justify-between text-gray-700 hover:text-blue-600 transition-colors py-1"
                          >
                            <span className="flex items-center">
                              <Tag className="h-4 w-4 mr-2 text-gray-400" />
                              {category}
                            </span>
                            <span className="text-gray-500 text-sm">({count})</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>

              {/* Recent Posts Widget */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                    Recent Posts
                  </h3>
                  <ul className="space-y-4">
                    {recentPosts.map((post) => (
                      <li key={post.slug} className="flex gap-3">
                        <Link to={`/blog/${post.slug}`} className="flex-shrink-0 w-16 h-16 overflow-hidden rounded bg-gray-100">
                          <ImageWithPlaceholder
                            src={post.image}
                            alt={post.title}
                            fallback={FALLBACK_IMAGE_URL}
                            aspectRatio="square"
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/blog/${post.slug}`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors"
                          >
                            {post.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">{post.date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Newsletter Widget */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                    Subscribe
                  </h3>
                  <NewsletterSignup />
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} CreatorArmour. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
