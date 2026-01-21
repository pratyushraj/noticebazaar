import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  // Mock content - in a real app, this would fetch from an API or CMS
  const getPostContent = (slug: string | undefined) => {
    const content: { [key: string]: { title: string; date: string; category: string; content: React.ReactNode } } = {
      'protect-yourself-from-unpaid-brand-deals': {
        title: 'How to Protect Yourself from Unpaid Brand Deals: A Creator\'s Guide',
        date: 'Jan 17, 2026',
        category: 'Legal',
        content: (
          <div className="space-y-6">
            <p className="text-lg text-purple-200 leading-relaxed">
              Over 60% of creators face payment delays or non-payment from brands. Learn how to protect yourself with proper contracts, early risk detection, and effective recovery strategies.
            </p>
            
            <h2 className="text-2xl font-bold text-white">1. Spot Payment Risks Early</h2>
            <p className="text-purple-100">
              The best protection is prevention. Before signing any brand deal, check for these warning signs:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li><strong className="text-white">Vague payment terms:</strong> If the contract doesn't specify exact payment dates, amounts, or milestones, it's a red flag.</li>
              <li><strong className="text-white">Long payment cycles:</strong> Payment terms longer than 30 days after deliverables are risky.</li>
              <li><strong className="text-white">No late payment penalties:</strong> Contracts without interest or penalties for delayed payments give brands no incentive to pay on time.</li>
              <li><strong className="text-white">Brand reputation:</strong> Check if other creators have complained about payment delays with this brand.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white">2. Draft Protective Contracts</h2>
            <p className="text-purple-100">
              A well-drafted contract is your first line of defense. Ensure your contract includes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li><strong className="text-white">Clear payment schedule:</strong> Specify exact dates and amounts for each milestone.</li>
              <li><strong className="text-white">Late payment penalties:</strong> Include interest (typically 18% per annum) for delayed payments.</li>
              <li><strong className="text-white">Content ownership:</strong> Clearly state who owns the content and usage rights.</li>
              <li><strong className="text-white">Dispute resolution:</strong> Specify jurisdiction and method for resolving disputes.</li>
              <li><strong className="text-white">Termination clauses:</strong> Define what happens if either party wants to end the agreement early.</li>
            </ul>
            <p className="text-purple-100">
              CreatorArmour's contract generator helps you create creator-friendly contracts with all these protections built-in.
            </p>

            <h2 className="text-2xl font-bold text-white">3. Track Payments and Deadlines</h2>
            <p className="text-purple-100">
              Once you've signed a deal, don't just wait for payment. Actively track:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li><strong className="text-white">Payment due dates:</strong> Set reminders 7 days before each payment is due.</li>
              <li><strong className="text-white">Deliverable deadlines:</strong> Ensure you meet your commitments to avoid giving brands an excuse to delay payment.</li>
              <li><strong className="text-white">Payment status:</strong> Follow up immediately if payment is even 1 day late.</li>
            </ul>
            <p className="text-purple-100">
              CreatorArmour's payment tracking dashboard automatically monitors all your deals and alerts you when payments are due or overdue.
            </p>

            <h2 className="text-2xl font-bold text-white">4. Take Action When Payment is Delayed</h2>
            <p className="text-purple-100">
              If a brand delays payment, don't wait. Follow this escalation process:
            </p>
            <ol className="list-decimal list-inside ml-4 space-y-2 text-purple-100">
              <li><strong className="text-white">Day 1-3:</strong> Send a polite reminder email with invoice attached.</li>
              <li><strong className="text-white">Day 4-7:</strong> Send a formal follow-up mentioning the contract terms and late payment penalties.</li>
              <li><strong className="text-white">Day 8-15:</strong> Send a legal notice drafted by a lawyer. This often prompts immediate payment.</li>
              <li><strong className="text-white">Day 16+:</strong> Consider filing a consumer complaint or taking legal action.</li>
            </ol>

            <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-4 border-l-4 border-purple-400 mt-6">
              <CardContent className="p-0 flex flex-col space-y-3">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-200 mr-3 flex-shrink-0" />
                  <p className="text-sm text-white font-semibold">
                    Protect Your Brand Deals Today
                  </p>
                </div>
                <p className="text-sm text-purple-200">
                  CreatorArmour includes contract generation, payment tracking, risk alerts, and free legal notices. Start protecting your deals now.
                </p>
              </CardContent>
            </Card>
          </div>
        ),
      },
      'red-flags-in-influencer-contracts': {
        title: 'Red Flags in Influencer Contracts: What to Watch Out For',
        date: 'Jan 12, 2026',
        category: 'Legal',
        content: (
          <div className="space-y-6">
            <p className="text-lg text-purple-200 leading-relaxed">
              Not all brand deals are created equal. Learn to identify dangerous contract clauses that could cost you money, rights, or your reputation.
            </p>
            
            <h2 className="text-2xl font-bold text-white">1. Unfair Payment Terms</h2>
            <p className="text-purple-100">Watch out for:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li>Payment terms longer than 30 days after deliverables</li>
              <li>No late payment penalties or interest</li>
              <li>Payment conditional on metrics you can't control</li>
              <li>Payment only after brand approval (with no time limits)</li>
            </ul>

            <h2 className="text-2xl font-bold text-white">2. Content Ownership Issues</h2>
            <p className="text-purple-100">Dangerous clauses include:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li>Brand claiming full ownership of your content</li>
              <li>Unlimited usage rights without additional compensation</li>
              <li>Restrictions on your ability to work with competitors</li>
              <li>No credit or attribution requirements</li>
            </ul>

            <h2 className="text-2xl font-bold text-white">3. Unrealistic Deliverables</h2>
            <p className="text-purple-100">Red flags to avoid:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-purple-100">
              <li>Vague or undefined deliverables</li>
              <li>Unlimited revision requests</li>
              <li>Exclusive content requirements without premium pricing</li>
              <li>Performance guarantees you can't control</li>
            </ul>
          </div>
        ),
      },
    };

    return content[slug || ''] || {
      title: 'Article Not Found',
      date: '',
      category: '',
      content: <p>This article is coming soon. Check back later!</p>,
    };
  };

  const post = getPostContent(slug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <Button 
          asChild 
          className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30"
        >
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
        </Button>
        
        <article className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20">
          <header className="mb-6 border-b border-white/20 pb-4">
            <span className="inline-block text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full mb-2">
              {post.category}
            </span>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              {post.title}
            </h1>
            <p className="text-sm text-purple-200">Published on: {post.date}</p>
          </header>
          
          <div className="prose prose-invert max-w-none space-y-8 text-purple-100">
            {post.content}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPostDetail;

