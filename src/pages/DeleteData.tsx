"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, ArrowLeft, Mail, Shield } from 'lucide-react';

const DeleteData = () => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <Button
        variant="outline"
        asChild
        className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground"
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>

      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <Trash2 className="h-8 w-8 text-destructive mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">User Data Deletion</h1>
          <p className="text-sm text-muted-foreground">
            Last Updated: November 12, 2025
          </p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            We respect your right to control your personal information. If you would like to delete
            your NoticeBazaar account or remove associated data, please follow the steps below. Data
            deletion requests are handled in line with applicable Indian IT laws and Bar Council
            regulations for legal records.
          </p>

          <h2 className="text-2xl font-bold text-foreground">Option 1 — In-App Request</h2>
          <ol className="list-decimal list-inside ml-4 space-y-2">
            <li>Log into the NoticeBazaar client portal.</li>
            <li>Navigate to <strong>Settings &gt; Account</strong>.</li>
            <li>Click <strong>"Request Data Deletion"</strong> and confirm the prompt.</li>
            <li>
              Our support team will acknowledge the request within 24 hours and begin secure
              deletion (processing completes within 7 business days).
            </li>
          </ol>

          <h2 className="text-2xl font-bold text-foreground">Option 2 — Email Request</h2>
          <div className="flex items-start gap-3 card p-4">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div>
              <p>
                Send an email from your registered email address to
                <a
                  href="mailto:support@noticebazaar.com?subject=Data%20Deletion%20Request"
                  className="text-primary font-semibold ml-1"
                >
                  support@noticebazaar.com
                </a>
              </p>
              <p className="text-sm text-muted">
                Include your full name, registered phone number, and the words “Delete my data”. We
                will verify identity and confirm deletion status via email.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">What gets deleted?</h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Account profile and login credentials.</li>
            <li>Uploaded documents, chat transcripts, consultation notes, and billing records.</li>
            <li>
              Linked social accounts, legal tasks, reminders, and activity logs, unless statutory
              retention is required.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground">Retention Exceptions</h2>
          <div className="card p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-purple-400 mt-1" />
            <p className="text-sm">
              Certain documents (e.g., legal notices issued, invoices raised, compliance filings)
              may need to be retained for up to 8 years to comply with the Bar Council of India,
              NCLT, or taxation regulations. Such items are archived securely and cannot be accessed
              by staff unless legally mandated.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Need help?</h2>
          <p>
            Contact our Data Protection Officer at
            <a
              href="mailto:dpo@noticebazaar.com"
              className="text-primary font-semibold ml-1"
            >
              dpo@noticebazaar.com
            </a>
            or via WhatsApp at
            <a href="https://wa.me/919205376316" target="_blank" rel="noopener" className="text-primary font-semibold ml-1">
              +91 92053 76316
            </a>
            . We respond to all deletion requests within 24 hours.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DeleteData;
