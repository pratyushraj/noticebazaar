"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Gavel } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
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
            Welcome to CreatorArmour. These Terms of Service ("Terms") govern your access to and use of the CreatorArmour website, client portal, and subscription services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. Service Description</h2>
          <p>
            CreatorArmour provides a technology platform connecting small and medium enterprises (SMEs) with independent, licensed legal advocates and chartered accountants on a subscription basis. We facilitate communication, document management, and compliance tracking.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Disclaimer:</strong> CreatorArmour is a technology platform and is NOT a law firm or accounting firm. Legal and financial advice is provided solely by the independent professionals in our network.</li>
            <li><strong>No Attorney-Client Relationship:</strong> Use of the platform does not automatically create an attorney-client relationship with CreatorArmour itself. That relationship is formed directly between you and the assigned advocate/CA.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. Subscription and Payment</h2>
          <p>
            Access to the Service requires a valid, active subscription plan. All fees are billed monthly or annually, as selected, and are non-refundable, subject to our Refund Policy.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Billing:</strong> Subscriptions automatically renew unless cancelled prior to the next billing date.</li>
            <li><strong>Fair Use:</strong> Unlimited services (e.g., formal notices in the Strategic Partner plan) are subject to a fair use policy to prevent abuse and ensure quality service for all clients.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. Client Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Provide accurate and complete information during onboarding and throughout the service period.</li>
            <li>Maintain the confidentiality of your login credentials.</li>
            <li>Use the Service only for lawful business purposes in India.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">4. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice or liability, if you breach these Terms, including failure to pay subscription fees or misuse of the platform.
          </p>

          <h2 className="text-2xl font-bold text-foreground">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.
          </p>

          <h2 className="text-2xl font-bold text-foreground">6. Contact Information</h2>
          <p>For any questions regarding these Terms, please contact us:</p>
          <p className="font-semibold">
            Email: <a href="mailto:support@creatorarmour.com" className="text-primary hover:underline">support@creatorarmour.com</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfService;