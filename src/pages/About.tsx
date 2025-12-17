"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Users, Target, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';

const About = () => {
  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <Shield className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">About CreatorArmour</h1>
          <p className="text-sm text-muted-foreground">Empowering creators with legal protection and financial security</p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-muted-foreground">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
            <p>
              CreatorArmour is India's first subscription-based legal and financial protection platform designed specifically for content creators and influencers. We believe that every creator deserves access to professional legal and financial services without the traditional barriers of high costs and complex processes.
            </p>
            <p>
              Our mission is to democratize legal and financial protection for creators, ensuring they can focus on what they do best—creating content—while we handle the complexities of contracts, payments, compliance, and legal recovery.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Shield className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Contract Protection</h3>
                <p className="text-sm">
                  AI-powered contract review and analysis to identify risks, missing clauses, and unfair terms before you sign.
                </p>
              </div>
              <div className="space-y-2">
                <Target className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Payment Recovery</h3>
                <p className="text-sm">
                  Legal notice services and payment recovery support to help you get paid on time and recover overdue amounts.
                </p>
              </div>
              <div className="space-y-2">
                <Users className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Dedicated Advisors</h3>
                <p className="text-sm">
                  Access to licensed advocates and chartered accountants who understand the creator economy and your unique needs.
                </p>
              </div>
              <div className="space-y-2">
                <Heart className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Tax & Compliance</h3>
                <p className="text-sm">
                  GST filing, tax planning, and compliance support to keep your business in good standing with Indian regulations.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
            <p>
              CreatorArmour was born from a simple observation: content creators in India face unique legal and financial challenges that traditional service providers don't fully understand. From unfair contract terms to delayed payments and complex tax requirements, creators often navigate these waters alone.
            </p>
            <p>
              We built CreatorArmour to bridge this gap, combining technology with human expertise to provide affordable, accessible, and creator-focused legal and financial services. Today, we're trusted by hundreds of creators across India who rely on us to protect their interests and grow their businesses.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Our Values</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Creator-First:</strong> Every decision we make prioritizes the needs and success of content creators.</li>
              <li><strong>Transparency:</strong> Clear pricing, honest communication, and no hidden fees.</li>
              <li><strong>Accessibility:</strong> Making professional legal and financial services affordable and approachable.</li>
              <li><strong>Innovation:</strong> Using technology to simplify complex processes and deliver better outcomes.</li>
              <li><strong>Trust:</strong> Building long-term relationships based on reliability, expertise, and results.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Join Us</h2>
            <p>
              Whether you're a new creator just starting out or an established influencer managing multiple brand partnerships, CreatorArmour is here to protect your interests and help you succeed.
            </p>
            <div className="flex gap-4 mt-6">
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/careers">View Careers</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default About;

