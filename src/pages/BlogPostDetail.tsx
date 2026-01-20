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
  'protect-yourself-from-unpaid-brand-deals': {
    title: 'How to Protect Yourself from Unpaid Brand Deals: A Creator\'s Guide',
    date: 'Jan 17, 2026',
    category: 'Legal',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          Over 60% of creators face payment delays or non-payment from brands. Learn how to protect yourself with proper contracts, early risk detection, and effective recovery strategies.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">1. Spot Payment Risks Early</h2>
        <p>
          The best protection is prevention. Before signing any brand deal, check for these warning signs:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li><strong>Vague payment terms:</strong> If the contract doesn't specify exact payment dates, amounts, or milestones, it's a red flag.</li>
          <li><strong>Long payment cycles:</strong> Payment terms longer than 30 days after deliverables are risky.</li>
          <li><strong>No late payment penalties:</strong> Contracts without interest or penalties for delayed payments give brands no incentive to pay on time.</li>
          <li><strong>Brand reputation:</strong> Check if other creators have complained about payment delays with this brand.</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">2. Draft Protective Contracts</h2>
        <p>
          A well-drafted contract is your first line of defense. Ensure your contract includes:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li><strong>Clear payment schedule:</strong> Specify exact dates and amounts for each milestone.</li>
          <li><strong>Late payment penalties:</strong> Include interest (typically 18% per annum) for delayed payments.</li>
          <li><strong>Content ownership:</strong> Clearly state who owns the content and usage rights.</li>
          <li><strong>Dispute resolution:</strong> Specify jurisdiction and method for resolving disputes.</li>
          <li><strong>Termination clauses:</strong> Define what happens if either party wants to end the agreement early.</li>
        </ul>
        <p>
          CreatorArmour's contract generator helps you create creator-friendly contracts with all these protections built-in.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. Track Payments and Deadlines</h2>
        <p>
          Once you've signed a deal, don't just wait for payment. Actively track:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li><strong>Payment due dates:</strong> Set reminders 7 days before each payment is due.</li>
          <li><strong>Deliverable deadlines:</strong> Ensure you meet your commitments to avoid giving brands an excuse to delay payment.</li>
          <li><strong>Payment status:</strong> Follow up immediately if payment is even 1 day late.</li>
        </ul>
        <p>
          CreatorArmour's payment tracking dashboard automatically monitors all your deals and alerts you when payments are due or overdue.
        </p>

        <h2 className="text-2xl font-bold text-foreground">4. Take Action When Payment is Delayed</h2>
        <p>
          If a brand delays payment, don't wait. Follow this escalation process:
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-2">
          <li><strong>Day 1-3:</strong> Send a polite reminder email with invoice attached.</li>
          <li><strong>Day 4-7:</strong> Send a formal follow-up mentioning the contract terms and late payment penalties.</li>
          <li><strong>Day 8-15:</strong> Send a legal notice drafted by a lawyer. This often prompts immediate payment.</li>
          <li><strong>Day 16+:</strong> Consider filing a consumer complaint or taking legal action.</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground">5. Use Legal Notices Effectively</h2>
        <p>
          A legal notice sent by a registered advocate carries significant weight. It:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Shows you're serious about recovering payment</li>
          <li>Often prompts immediate payment (85% recovery rate)</li>
          <li>Creates a legal paper trail if you need to take further action</li>
          <li>Can be used as evidence in court if needed</li>
        </ul>
        <p>
          Creator Pro includes 1 free legal notice per month, drafted and sent by verified lawyers.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Protect Your Brand Deals Today
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Creator Pro includes contract generation, payment tracking, risk alerts, and free legal notices. Start protecting your deals now.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/signup">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'consumer-complaints-guide-for-creators': {
    title: 'Consumer Complaints Guide: How Creators Can File Complaints Against Brands',
    date: 'Jan 15, 2026',
    category: 'Legal',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          As a creator, you're also a consumer. When brands, e-commerce platforms, or service providers wrong you, you have the right to file a consumer complaint. Here's how to do it effectively.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">What Can You File a Complaint About?</h2>
        <p>
          You can file consumer complaints for various issues:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li><strong>Unpaid brand deals:</strong> When brands don't pay as agreed</li>
          <li><strong>Defective products:</strong> Products that don't work as advertised</li>
          <li><strong>Service issues:</strong> Poor service from platforms, agencies, or service providers</li>
          <li><strong>Refund disputes:</strong> When companies refuse legitimate refunds</li>
          <li><strong>False advertising:</strong> When brands misrepresent their products or services</li>
          <li><strong>Data privacy violations:</strong> When companies misuse your personal data</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">Step 1: Gather Evidence</h2>
        <p>
          Before filing a complaint, collect all relevant documents:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Contracts or agreements</li>
          <li>Email correspondence</li>
          <li>Payment receipts or invoices</li>
          <li>Screenshots of conversations</li>
          <li>Photos or videos of defective products</li>
          <li>Any other proof of the issue</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">Step 2: Send a Legal Notice</h2>
        <p>
          Before filing a formal complaint, send a legal notice to the company. This:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Gives them a chance to resolve the issue amicably</li>
          <li>Shows you're serious about your rights</li>
          <li>Often leads to quick resolution (many companies respond within 7-14 days)</li>
          <li>Creates a legal paper trail</li>
        </ul>
        <p>
          Creator Pro includes unlimited consumer complaints with legal notice drafting and filing support.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Step 3: File the Complaint</h2>
        <p>
          If the legal notice doesn't resolve the issue, file a formal complaint with:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li><strong>Consumer Disputes Redressal Commission:</strong> For disputes up to ₹1 crore</li>
          <li><strong>National Consumer Disputes Redressal Commission:</strong> For disputes above ₹1 crore</li>
          <li><strong>Online portals:</strong> Many states have online complaint filing systems</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">Step 4: Track Your Complaint</h2>
        <p>
          After filing, regularly check the status of your complaint. CreatorArmour's Lifestyle Shield helps you track all your complaints in one place.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <Gavel className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                File Unlimited Consumer Complaints
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Creator Pro includes Lifestyle Shield - file unlimited consumer complaints, get legal notices drafted, and track resolution status.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/signup">
                Get Creator Pro <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
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
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          Not all brand deals are created equal. Some contracts contain clauses that can harm your career, limit your earnings, or expose you to legal risks. Here are the red flags to watch out for.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">1. Vague Payment Terms</h2>
        <p>
          <strong>Red Flag:</strong> Contracts that don't specify exact payment amounts, dates, or milestones.
        </p>
        <p>
          <strong>Why it's risky:</strong> Brands can delay or reduce payments, claiming deliverables weren't met or weren't satisfactory.
        </p>
        <p>
          <strong>What to look for:</strong> Clear payment schedule with specific dates, amounts, and conditions for each milestone.
        </p>

        <h2 className="text-2xl font-bold text-foreground">2. Excessive Exclusivity Clauses</h2>
        <p>
          <strong>Red Flag:</strong> Contracts that prevent you from working with competitors for extended periods (6+ months).
        </p>
        <p>
          <strong>Why it's risky:</strong> Limits your ability to earn from other brand deals, especially in the same category.
        </p>
        <p>
          <strong>What to negotiate:</strong> Limit exclusivity to 30-60 days, or only for direct competitors, not entire categories.
        </p>

        <h2 className="text-2xl font-bold text-foreground">3. Content Ownership Transfers</h2>
        <p>
          <strong>Red Flag:</strong> Clauses that transfer all rights to your content to the brand, including your right to use it.
        </p>
        <p>
          <strong>Why it's risky:</strong> You lose control over your own content and can't use it for your portfolio or future work.
        </p>
        <p>
          <strong>What to negotiate:</strong> Grant usage rights for the campaign period, but retain ownership and right to use in your portfolio.
        </p>

        <h2 className="text-2xl font-bold text-foreground">4. Unreasonable Approval Processes</h2>
        <p>
          <strong>Red Flag:</strong> Contracts requiring brand approval for every post, with no clear timeline or revision limits.
        </p>
        <p>
          <strong>Why it's risky:</strong> Brands can delay or reject content indefinitely, preventing you from completing deliverables.
        </p>
        <p>
          <strong>What to negotiate:</strong> Limit revisions to 2-3 rounds, with clear timelines (e.g., 48 hours for feedback).
        </p>

        <h2 className="text-2xl font-bold text-foreground">5. Indemnification Clauses</h2>
        <p>
          <strong>Red Flag:</strong> Clauses making you responsible for all legal issues, even those caused by the brand's products or services.
        </p>
        <p>
          <strong>Why it's risky:</strong> You could be held liable for product defects, false claims, or other issues beyond your control.
        </p>
        <p>
          <strong>What to negotiate:</strong> Limit indemnification to issues you directly cause, not product defects or brand claims.
        </p>

        <h2 className="text-2xl font-bold text-foreground">6. No Late Payment Penalties</h2>
        <p>
          <strong>Red Flag:</strong> Contracts without interest or penalties for delayed payments.
        </p>
        <p>
          <strong>Why it's risky:</strong> Brands have no incentive to pay on time, and you bear the cost of delayed payments.
        </p>
        <p>
          <strong>What to add:</strong> Include 18% per annum interest on delayed payments, plus late fees.
        </p>

        <h2 className="text-2xl font-bold text-foreground">7. Unclear Termination Clauses</h2>
        <p>
          <strong>Red Flag:</strong> Contracts that allow brands to terminate without cause or payment.
        </p>
        <p>
          <strong>Why it's risky:</strong> Brands can end deals without paying for work already completed.
        </p>
        <p>
          <strong>What to negotiate:</strong> Ensure payment for completed work, even if contract is terminated early.
        </p>

        <h2 className="text-2xl font-bold text-foreground">How CreatorArmour Helps</h2>
        <p>
          Our contract analyzer scans your contracts and flags these red flags automatically. Plus, Creator Pro includes human lawyer contract reviews to help you negotiate better terms.
        </p>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Scan Your Contracts for Free
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Use CreatorArmour's AI contract scanner to identify risky clauses before you sign. Creator Pro includes human lawyer reviews for complex contracts.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/signup">
                Scan a Contract Now <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'when-to-use-free-legal-consultations': {
    title: 'When to Use Free Legal Consultations: A Creator\'s Guide',
    date: 'Jan 10, 2026',
    category: 'Legal',
    content: (
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-muted-foreground">
          Free legal consultations are a powerful tool for creators, but knowing when to use them can maximize their value. Here's when to book a consultation and how to make the most of your 15-minute sessions.
        </p>
        
        <h2 className="text-2xl font-bold text-foreground">When to Book a Consultation</h2>
        
        <h3 className="text-xl font-semibold text-foreground">1. Before Signing a Contract</h3>
        <p>
          <strong>Best time:</strong> After you've reviewed the contract but before signing.
        </p>
        <p>
          <strong>What to ask:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Are there any red flags or risky clauses?</li>
          <li>What terms should I negotiate?</li>
          <li>Is the payment structure fair?</li>
          <li>What are my rights regarding content ownership?</li>
        </ul>

        <h3 className="text-xl font-semibold text-foreground">2. When Payment is Delayed</h3>
        <p>
          <strong>Best time:</strong> Within 7 days of the payment due date.
        </p>
        <p>
          <strong>What to ask:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>What steps should I take to recover payment?</li>
          <li>Should I send a legal notice?</li>
          <li>What are my legal options if they don't pay?</li>
          <li>How do I document everything for potential legal action?</li>
        </ul>

        <h3 className="text-xl font-semibold text-foreground">3. When Filing a Consumer Complaint</h3>
        <p>
          <strong>Best time:</strong> Before filing, to ensure you have the right evidence and approach.
        </p>
        <p>
          <strong>What to ask:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Do I have a valid consumer complaint?</li>
          <li>What evidence do I need to gather?</li>
          <li>Should I send a legal notice first?</li>
          <li>Where should I file the complaint?</li>
        </ul>

        <h3 className="text-xl font-semibold text-foreground">4. When Negotiating Terms</h3>
        <p>
          <strong>Best time:</strong> When a brand proposes terms you're unsure about.
        </p>
        <p>
          <strong>What to ask:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Are these terms standard or unusual?</li>
          <li>What should I counter-propose?</li>
          <li>What's negotiable and what's not?</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground">How to Prepare for Your Consultation</h2>
        <p>
          To make the most of your 15 minutes:
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-2">
          <li><strong>Gather all documents:</strong> Contracts, emails, invoices, screenshots</li>
          <li><strong>Write down your questions:</strong> Prioritize the most important ones</li>
          <li><strong>Be specific:</strong> Provide context and background information</li>
          <li><strong>Take notes:</strong> Write down the lawyer's advice and next steps</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground">What to Expect</h2>
        <p>
          During your consultation, the lawyer will:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Review your documents and situation</li>
          <li>Answer your specific questions</li>
          <li>Provide legal advice and recommendations</li>
          <li>Suggest next steps if needed</li>
        </ul>
        <p>
          <strong>Note:</strong> Consultations provide legal advice, not legal representation. For ongoing representation, you may need to engage a lawyer separately.
        </p>

        <h2 className="text-2xl font-bold text-foreground">Creator Pro Benefits</h2>
        <p>
          Creator Pro includes unlimited free legal consultations, so you can:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Get advice before every major contract</li>
          <li>Consult on payment recovery strategies</li>
          <li>Get guidance on consumer complaints</li>
          <li>Ask questions as they arise, without worrying about costs</li>
        </ul>
        
        <Card className="bg-secondary p-4 border-l-4 border-primary">
          <CardContent className="p-0 flex flex-col space-y-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
              <p className="text-sm text-foreground font-semibold">
                Get Unlimited Free Legal Consultations
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Creator Pro includes unlimited 15-minute consultations with verified lawyers. Get expert advice whenever you need it.
            </p>
            <Button asChild className="w-full sm:w-auto bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90">
              <Link to="/signup">
                Book a Consultation <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    ),
  },
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