"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';

const RefundPolicy = () => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <RefreshCw className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-sm text-muted-foreground">Effective Date: October 26, 2025</p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            This Refund Policy outlines the terms and conditions under which NoticeBazaar provides refunds for its subscription services. By subscribing to our services, you agree to this policy.
          </p>

          <h2 className="text-2xl font-bold text-foreground">1. General Policy (Non-Refundable Fees)</h2>
          <p>
            All subscription fees for NoticeBazaar services are generally non-refundable. We operate on a subscription model where access to our platform, dedicated advisors, and resources is provided immediately upon payment.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Monthly Subscriptions:</strong> Fees paid for monthly plans are non-refundable. If you cancel, your service will continue until the end of the current billing cycle.</li>
            <li><strong>Annual Subscriptions:</strong> Fees paid for annual plans are non-refundable. If you cancel, your service will continue until the end of the current annual term.</li>
            <li><strong>Setup Fees:</strong> Any one-time setup or onboarding fees are strictly non-refundable.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">2. Exceptions (Service Failure)</h2>
          <p>
            A refund may be considered only in the event of a proven, critical failure of service delivery directly attributable to NoticeBazaar, and only if the issue cannot be resolved within a reasonable timeframe (15 business days).
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Critical Failure Defined:</strong> This includes prolonged, complete inability to access the client portal or failure to assign a dedicated advisor within 7 days of successful onboarding.</li>
            <li><strong>Exclusions:</strong> Dissatisfaction with legal advice, case outcomes, or delays caused by external factors (e.g., court schedules, government processing times) do not qualify for a refund.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">3. How to Request a Refund</h2>
          <p>
            All refund requests must be submitted in writing within 7 days of the incident that constitutes a critical service failure.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Submission:</strong> Email your detailed request, including the subscription ID and description of the service failure, to <a href="mailto:billing@noticebazaar.com" className="text-primary hover:underline">billing@noticebazaar.com</a>.</li>
            <li><strong>Processing:</strong> Approved refunds will be processed within 30 business days and credited back to the original payment method.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">4. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time through your client portal settings. Cancellation will prevent future billing, but you will retain access to the service until the end of the paid billing period.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RefundPolicy;