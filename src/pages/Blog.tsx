import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, ArrowLeft, Search } from 'lucide-react';
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
  image: string; // Added image field
}

// Define the image rotation pool
const IMAGE_POOL = [
  '/NOTICERBAZAAR.jpg',
  '/blog-images/annual-filings-dashboard.png', // New image for Annual Filings
  '/blog-images/gst-checklist.jpg', // New image for GST Checklist
  '/pasted-image-2025-10-29T16-12-40-981Z.png', // Mobile App Preview
];

// Use a local placeholder image path if the external image fails
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
    image: '/blog-images/gst-checklist.jpg', // Specific image
  },
  {
    slug: 'annual-corporate-filings-importance',
    title: 'The Importance of Annual Corporate Filings for SMEs',
    summary: 'Understand the mandatory annual filings (ROC, AOC-4, MGT-7) and how to avoid penalties for non-compliance.',
    date: 'Nov 1, 2025',
    category: 'Compliance',
    image: '/blog-images/annual-filings-dashboard.png', // Specific image
  },
  {
    slug: 'gst-filing-deadlines-2025',
    title: 'GST Filing Deadlines 2025: What SMEs Need to Know',
    summary: 'Stay compliant with the latest GST filing dates and avoid penalties. We break down the monthly and quarterly requirements.',
    date: 'Oct 15, 2025',
    category: 'Compliance',
    image: '/blog-images/gst-checklist.jpg', // Specific image
  },
  {
    slug: '5-tips-for-faster-payment-recovery',
    title: '5 Tips for Faster Payment Recovery in India',
    summary: 'Learn proven strategies, from professional notices to legal action, to significantly reduce your outstanding receivables timeline.',
    date: 'Sep 28, 2025',
    category: 'Legal',
    image: IMAGE_POOL[0], // Use default image
  },
  {
    slug: 'choosing-the-right-business-entity',
    title: 'Pvt Ltd vs. LLP: Choosing the Right Business Entity for Your Startup',
    summary: 'A detailed comparison of liability, compliance burden, and tax implications to help you make an informed decision.',
    date: 'Sep 10, 2025',
    category: 'Finance',
    image: IMAGE_POOL[1], // Use default image
  },
  {
    slug: 'ai-in-legal-tech',
    title: 'The Role of AI in Modern Legal Tech for SMEs',
    summary: 'How digital paralegals and AI assistants are streamlining administrative tasks and improving access to justice.',
    date: 'Aug 20, 2025',
    category: 'Tech',
    image: '/pasted-image-2025-10-29T16-12-40-981Z.png', // Specific image (Mobile App Preview)
  },
];

const getCategoryBadgeVariant = (category: BlogPost['category']) => {
  switch (category) {
    case 'Legal': return 'default';
    case 'Compliance': return 'secondary';
    case 'Finance': return 'pink';
    case 'Tech': return 'outline';
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
      post.summary.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm]);

  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      <header className="text-center mb-8">
        <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
        <h1 className="text-4xl font-bold text-foreground mb-2">CreatorArmour Insights</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Expert articles on legal compliance, tax strategy, and business growth for Indian SMEs.
        </p>
      </header>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-12 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search Insights (e.g., GST, Contracts, Recovery)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 py-3 bg-input text-foreground border-border shadow-md"
        />
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No articles found matching "{searchTerm}".</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post) => (
          <Card key={post.slug} className="bg-card shadow-lg border border-border transition-transform duration-300 hover:scale-[1.02] flex flex-col">
            {/* Featured Image */}
            <ImageWithPlaceholder
              src={post.image}
              alt={post.title}
              fallback={FALLBACK_IMAGE_URL}
              aspectRatio="video"
              className="h-40 rounded-t-xl"
            />
            <CardHeader className="pb-3 pt-4">
              <Badge variant={getCategoryBadgeVariant(post.category)} className="w-fit mb-2">
                {post.category}
              </Badge>
              <CardTitle className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground text-sm mb-4">{post.summary}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-gray-500">{post.date}</span>
                <Link to={`/blog/${post.slug}`} className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
                  Read More <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Newsletter CTA */}
      <div className="mt-16 max-w-2xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <NewsletterSignup />
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground">Looking for something specific? Contact us for personalized advice.</p>
      </div>
    </div>
  );
};

export default Blog;