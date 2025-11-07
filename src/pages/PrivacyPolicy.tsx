"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
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
            NoticeBazaar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by NoticeBazaar. This policy applies to our website, client portal, and related services.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect information that identifies, relates to, describes, or is capable of being associated with you ("Personal Data").</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Identity Data:</strong> Name, email address, phone number, and login data.</li>
            <li><strong>Business Data:</strong> Business name, GSTIN, business entity type, and incorporation documents.</li>
            <li><strong>Financial Data:</strong> Subscription details, payment history, and billing information (processed securely by third-party payment gateways like Razorpay).</li>
            <li><strong>Case Data:</strong> Documents, consultation notes, messages, and activity logs related to your legal and financial matters.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use your Personal Data for the following purposes:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>To provide and manage the subscription legal and CA services.</li>
            <li>To communicate with you regarding your cases, compliance deadlines, and consultations.</li>
            <li>To ensure the security and integrity of our client portal (ISO 27001 standards).</li>
            <li>For billing, account management, and internal reporting.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. Data Security and Storage</h2>
          <p>
            We take the security of your sensitive legal and financial documents seriously.
            <Lock className="h-4 w-4 inline mx-1 text-purple-400" /> All data is stored on secure, compliant servers (Supabase) with end-to-end encryption for communications. Access to case data is strictly limited to your assigned legal and CA advisors.
          </p>

          <h2 className="text-2xl font-bold text-foreground">4. Disclosure of Information</h2>
          <p>We do not sell your Personal Data. We may share your information only with:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Your dedicated legal advocates and chartered accountants for service delivery.</li>
            <li>Third-party service providers (e.g., payment processors, cloud hosting) under strict confidentiality agreements.</li>
            <li>When required by law or legal process.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">5. Your Rights</h2>
          <p>You have the right to access, correct, or request deletion of your Personal Data, subject to legal and regulatory retention requirements (especially concerning legal case files).</p>

          <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
          <p className="font-semibold">
            Email: <a href="mailto:support@noticebazaar.com" className="text-primary hover:underline">support@noticebazaar.com</a>
            <br />
            Phone: <a href="tel:+919205376316" className="text-primary hover:underline">+91 92053 76316</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;