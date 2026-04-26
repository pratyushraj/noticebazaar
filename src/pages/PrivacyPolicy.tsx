

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <ShieldCheck className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last Updated: October 26, 2025</p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            CreatorArmour ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by CreatorArmour. This policy applies to our website, dashboards, and escrow services.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect information necessary to facilitate secure collaborations and payments.</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Identity Data:</strong> Name, email address, social media handles (Instagram/YouTube), and profile photos.</li>
            <li><strong>Financial Data:</strong> UPI IDs, Bank Account details (for payouts), and transaction history. Payment card/bank data is processed securely by Razorpay.</li>
            <li><strong>Collaboration Data:</strong> Contracts, campaign briefs, tracking numbers, content URLs, and communication logs.</li>
            <li><strong>Verification Data:</strong> Documents used to verify creator identity or brand authenticity.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use your data for the following purposes:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>To verify identity and prevent fraud in the escrow system.</li>
            <li>To facilitate contract generation between Brands and Creators.</li>
            <li>To process payouts and maintain a record of transactions for tax and compliance.</li>
            <li>To notify users of deal updates, shipping progress, and payment status.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. Data Security</h2>
          <p>
            <Lock className="h-4 w-4 inline mx-1 text-secondary" /> We use industry-standard encryption and secure cloud infrastructure (Supabase) to protect your financial and collaboration data. Your payout details are encrypted and only accessible to authorized payment systems.
          </p>

          <h2 className="text-2xl font-bold text-foreground">4. Disclosure of Information</h2>
          <p>We share data only when necessary for service delivery:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>With Collaboration Partners:</strong> Brands see Creator identity/social data; Creators see Brand contact/shipping data.</li>
            <li><strong>With Payment Partners:</strong> Transaction data is shared with Razorpay for payment processing.</li>
            <li><strong>Legal Requirements:</strong> If required by law to prevent fraud or comply with a court order.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">5. Your Rights</h2>
          <p>You have the right to access, update, or request deletion of your account and personal data at any time through your dashboard settings.</p>

          <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
          <p>For privacy-related inquiries, contact us at:</p>
          <p className="font-semibold">
            Email: <a href="mailto:hello@creatorarmour.com" className="text-primary hover:underline">hello@creatorarmour.com</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;