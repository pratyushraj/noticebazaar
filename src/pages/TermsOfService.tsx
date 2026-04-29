

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gavel } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <Gavel className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2025</p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            Welcome to NoticeBazaar. These Terms of Service ("Terms") govern your access to and use of the NoticeBazaar platform, dashboards, and escrow services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. Service Description</h2>
          <p>
            NoticeBazaar is an escrow-protected collaboration platform that facilitates secure transactions between Brands and Content Creators. We provide tools for contract generation, shipping tracking, content review, and secure payment holding.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Escrow Protection:</strong> Funds deposited by Brands are held securely in escrow until content is delivered and approved by the Brand.</li>
            <li><strong>72-Hour Review Window:</strong> Once a Creator delivers content, Brands have exactly 72 hours to review and request revisions. If no action is taken within 72 hours, the platform automatically approves the content and initiates the payout release process.</li>
            <li><strong>NoticeBazaar's Role:</strong> We act as a neutral technology provider and escrow agent. We are not a party to the individual collaboration agreements between Brands and Creators.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. Payments and Payouts</h2>
          <p>
            All payments are processed securely through our authorized payment partners. 
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Fund Collection:</strong> Brands must fund the escrow in full before a collaboration is considered active.</li>
            <li><strong>Payout Release:</strong> Funds are released to the Creator's verified UPI ID or Bank Account only after the Brand confirms approval or the 72-hour window expires.</li>
            <li><strong>Disputes:</strong> In the event of a dispute, NoticeBazaar reserves the right to hold funds until a resolution is reached or provide mediation services.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Provide accurate UPI and Bank details for payouts.</li>
            <li>Submit original, non-infringing content as per the agreed deliverables.</li>
            <li>Maintain professional communication throughout the collaboration.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">4. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately if you violate these terms, attempt to bypass the escrow system, or engage in fraudulent activities.
          </p>

          <h2 className="text-2xl font-bold text-foreground">5. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Mumbai, India.
          </p>

          <h2 className="text-2xl font-bold text-foreground">6. Contact Information</h2>
          <p>For any questions regarding these Terms, please contact us:</p>
          <p className="font-semibold">
            Email: <a href="mailto:hello@noticebazaar.com" className="text-primary hover:underline">hello@noticebazaar.com</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfService;