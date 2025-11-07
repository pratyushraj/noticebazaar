"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';

const routes = [
  { category: 'Public & Marketing', links: [
    { path: '/', label: 'Homepage' },
    { path: '/login', label: 'Client Login' },
    { path: '/pricing-comparison', label: 'Pricing Comparison' },
    { path: '/blog', label: 'Blog' },
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/terms-of-service', label: 'Terms of Service' },
    { path: '/refund-policy', label: 'Refund Policy' },
  ]},
  { category: 'Client Portal (Protected)', links: [
    { path: '/client-dashboard', label: 'Dashboard' },
    { path: '/client-profile', label: 'My Profile' },
    { path: '/client-subscription', label: 'My Subscription' },
    { path: '/client-cases', label: 'My Cases' },
    { path: '/client-documents', label: 'My Documents (Secure Vault)' },
    { path: '/client-consultations', label: 'My Consultations' },
    { path: '/client-activity-log', label: 'My Activity Log' },
  ]},
  { category: 'Advisor Portal (Admin/CA)', links: [
    { path: '/admin-dashboard', label: 'Admin Dashboard' },
    { path: '/ca-dashboard', label: 'CA Dashboard' },
    { path: '/admin-clients', label: 'Manage Clients' },
    { path: '/admin-cases', label: 'Manage Cases' },
    { path: '/admin-documents', label: 'Manage Documents' },
    { path: '/admin-consultations', label: 'Manage Consultations' },
    { path: '/admin-subscriptions', label: 'Manage Subscriptions' },
    { path: '/admin-activity-log', label: 'Admin Activity Log' },
    { path: '/admin-profile', label: 'Admin/CA Profile Settings' },
  ]},
  { category: 'Shared', links: [
    { path: '/messages', label: 'Secure Messages' },
  ]},
];

const Sitemap = () => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <Map className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Site Map</h1>
          <p className="text-sm text-muted-foreground">A comprehensive list of all accessible pages within the NoticeBazaar application.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {routes.map((section) => (
            <div key={section.category} className="space-y-4">
              <h2 className="text-xl font-bold text-primary border-b border-border/50 pb-2">{section.category}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-foreground hover:text-primary transition-colors flex items-center">
                      <span className="text-sm font-medium">{link.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({link.path})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Sitemap;