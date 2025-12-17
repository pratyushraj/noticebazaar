import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, IndianRupee, Clock, Briefcase, ArrowRight, Gavel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import GstComplianceChecklist from './blog/GstComplianceChecklist'; // Import the new component

interface BlogPostContent {
  title: string;
  date: string;
  category: 'Legal' | 'Compliance' | 'Finance' | 'Tech';
  content: React.ReactNode;
}

const MOCK_CONTENT: { [key: string]: BlogPostContent } = {
  'gst-compliance-checklist': { // New entry
    title: 'Complete GST Compliance Checklist for Startups in 2025',
    date: 'Nov 1, 2025',
    category: 'Compliance',
    content: <GstComplianceChecklist />, // Render the new component
  },
  'annual-corporate-filings-importance': {
    title: 'The Importance of Annual Corporate Filings for SMEs',
    date: 'Nov 1, 2025',
    category: 'Compliance',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          For any registered company in India, mandatory annual filings with the Registrar of Companies (ROC) are crucial for maintaining compliance and avoiding severe penalties. Here is a breakdown of the key forms and why they matter.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">Mandatory Forms: AOC-4 and MGT-7</h2>
        <p>
          Every company must file two primary forms annually:
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Form AOC-4:</strong> This form contains the company's financial statements, including the balance sheet and profit & loss account.</li>
            <li><strong>Form MGT-7:</strong> This is the Annual Return, providing details about the company's management, shareholders, and directors.</li>
          </ul>
          These filings must be submitted within 30 and 60 days, respectively, of the Annual General Meeting (AGM).
        </p>

        <h2 className="text-2xl font-bold text-foreground">Consequences of Non-Compliance</h2>
        <p>
          Failing to file these documents on time can lead to significant consequences, including:
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Heavy financial penalties (up to ₹100 per day of delay).</li>
            <li>Disqualification of directors.</li>
            <li>The company being marked as 'defunct' or 'dormant' by the ROC.</li>
          </ul>
          Proactive compliance is always cheaper than reactive penalty management.
        </p>

        <h2 className="text-2xl font-bold text-foreground">How NoticeBazaar Helps</h2>
        <p>
          Our subscription plans include dedicated CA support to ensure all your ROC filings are prepared accurately and submitted well before the deadlines, keeping your company status 'Active' and compliant.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <Gavel className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Need help with your Annual Filings?
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Our Business Growth and Strategic Partner plans include comprehensive support for mandatory corporate filings.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/pricing-comparison">
                View Plans & Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'gst-filing-deadlines-2025': {
    title: 'GST Filing Deadlines 2025: What SMEs Need to Know',
    date: 'Oct 15, 2025',
    category: 'Compliance',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          For small and medium enterprises (SMEs) in India, maintaining GST compliance is non-negotiable. Missing deadlines can lead to hefty penalties and interest charges. Here is your essential guide to the GST filing calendar for 2025.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">Monthly Filings: GSTR-1 and GSTR-3B</h2>
        <p>
          The core of GST compliance revolves around GSTR-1 (details of outward supplies) and GSTR-3B (summary return).
          The deadline for GSTR-1 is typically the 11th of the succeeding month, while GSTR-3B is usually due by the 20th.
          It is crucial to reconcile these two forms accurately to avoid discrepancies flagged by the tax authorities.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Quarterly Filings (QRMP Scheme)</h2>
        <p>
          Businesses with an annual aggregate turnover of up to ₹5 crore can opt for the Quarterly Return Monthly Payment (QRMP) scheme.
          This allows for quarterly filing of GSTR-1 and GSTR-3B, significantly reducing the administrative burden. However, monthly payment of tax liability remains mandatory.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Annual Compliance: GSTR-9 and GSTR-9C</h2>
        <p>
          The annual return (GSTR-9) and reconciliation statement (GSTR-9C) are typically due by December 31st of the following financial year.
          This requires a comprehensive review of all transactions and is often the most complex filing. Our CA team specializes in ensuring these annual filings are flawless.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Never Miss a Date Again.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Don't manually track these deadlines. Use the NoticeBazaar dashboard to set automated reminders for all your GST, TDS, and corporate compliance dates.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/#plans">
                Try the Free Compliance Tracker <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
  '5-tips-for-faster-payment-recovery': {
    title: '5 Tips for Faster Payment Recovery in India',
    date: 'Sep 28, 2025',
    category: 'Legal',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          Cash flow is the lifeblood of any SME. When payments are delayed, it can cripple operations. Here are five legal and strategic tips our advocates use to accelerate payment recovery.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">1. The Power of a Professional Legal Notice</h2>
        <p>
          A formal <Link to="/client-dashboard" className="text-primary hover:underline">legal notice, drafted and sent by a registered advocate</Link>, carries significant weight. It signals seriousness and often prompts immediate action from the debtor, bypassing months of informal follow-ups. Our subscription includes drafting and sending these notices promptly.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. Leverage the MSMED Act</h2>
        <p>
          If your business is registered under the Micro, Small and Medium Enterprises Development (MSMED) Act, you gain powerful protection. The Act mandates interest payments on delayed dues and provides a mechanism for <Link to="/blog" className="text-primary hover:underline">dispute resolution through the MSME Facilitation Council</Link>.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. Clear Contractual Terms</h2>
        <p>
          Ensure every contract explicitly states payment terms, interest rates for delays, and the jurisdiction for dispute resolution. Ambiguity in contracts is the number one reason for prolonged recovery battles.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">4. Utilize the Negotiable Instruments Act (Cheque Bounce)</h2>
        <p>
          For cases involving bounced cheques, the Negotiable Instruments Act provides a fast-track legal route. This is a powerful tool that can lead to quick settlements or criminal proceedings against the defaulter.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">5. Proactive Digital Tracking</h2>
        <p>
          Use your NoticeBazaar dashboard to <Link to="/client-dashboard" className="text-primary hover:underline">log all outstanding invoices and recovery actions</Link>. Transparency and detailed records are essential if the case proceeds to litigation.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Stop Chasing. Start Recovering.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Our Business Growth plan gives you immediate access to dedicated payment recovery support, including prompt drafting and tracking of legal notices.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/#plans">
                Start Your Payment Recovery Audit Today <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'choosing-the-right-business-entity': {
    title: 'Pvt Ltd vs. LLP: Choosing the Right Business Entity for Your Startup',
    date: 'Sep 10, 2025',
    category: 'Finance',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          The choice of business entity—Private Limited Company (Pvt Ltd) or Limited Liability Partnership (LLP)—is one of the most critical decisions for a startup, impacting liability, compliance, and fundraising potential.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">Liability and Protection</h2>
        <p>
          Both Pvt Ltd and LLP offer limited liability, meaning the personal assets of the owners are protected from business debts. However, the structure differs: a Pvt Ltd is governed by the Companies Act, 2013, while an LLP is governed by the LLP Act, 2008.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Compliance Burden</h2>
        <p>
          LLPs generally have a lower compliance burden, requiring fewer mandatory filings and board meetings. Pvt Ltd companies face stricter regulatory requirements, including mandatory audits and detailed annual filings, making them more suitable for businesses planning rapid scaling and external funding.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Fundraising and Investment</h2>
        <p>
          This is where Pvt Ltd companies hold a distinct advantage. They can issue shares, making them the preferred structure for venture capital (VC) and angel investors. LLPs cannot issue equity shares, limiting their ability to raise external capital easily.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex items-center">
            <Briefcase className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Need personalized advice?</strong> Our Chartered Accountants can guide you through the incorporation process and tax implications.
            </p>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'ai-in-legal-tech': {
    title: 'The Role of AI in Modern Legal Tech for SMEs',
    date: 'Aug 20, 2025',
    category: 'Tech',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          Artificial Intelligence is transforming how legal and compliance services are delivered. For SMEs, this means faster, more affordable access to essential administrative support.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">Automating Administrative Tasks</h2>
        <p>
          AI assistants, like Lexi in the NoticeBazaar portal, handle routine tasks such as document filing, status lookups, and scheduling consultations. This frees up your dedicated human advisor to focus on complex legal strategy and advisory work.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Enhanced Compliance Monitoring</h2>
        <p>
          AI algorithms continuously monitor regulatory changes and automatically flag upcoming compliance deadlines (GST, TDS, ROC filings). This proactive approach drastically reduces the risk of human error and missed deadlines.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Secure and Instant Access</h2>
        <p>
          The integration of AI into the client portal ensures that you have instant, secure access to your case files and communication history, making the entire legal process transparent and efficient.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex items-center">
            <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Explore Lexi:</strong> Log in to your client dashboard and chat with Lexi, your digital paralegal, for instant administrative support.
            </p>
          </CardContent>
        </Card>
      </div>
    ),
  },
};

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = MOCK_CONTENT[slug || ''];

  if (!post) {
    return (
      <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
        <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
        </Button>
        <Card className="max-w-3xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-destructive">
          <h1 className="text-4xl font-bold text-destructive mb-4">404 - Post Not Found</h1>
          <p className="text-lg text-muted-foreground">
            The blog post you are looking for does not exist.
          </p>
        </Card>
      </div>
    );
  }

  // If the content is a React element (like GstComplianceChecklist), render it directly.
  if (React.isValidElement(post.content)) {
    return post.content;
  }

  // Otherwise, render the standard article layout.
  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/blog">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
        </Link>
      </Button>
      <article className="max-w-3xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-6 border-b border-border/50 pb-4">
          <p className="text-sm font-medium text-primary mb-2">{post.category}</p>
          <h1 className="text-4xl font-bold text-foreground mb-3">{post.title}</h1>
          <p className="text-sm text-muted-foreground">Published on: {post.date}</p>
        </header>
        
        <div className="blog-content">
          {post.content}
        </div>
      </article>
    </div>
  );
};

export default BlogPostDetail;