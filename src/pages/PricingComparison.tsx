"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, ArrowRight, MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PLAN_COMPARISON_FEATURES, PLAN_DETAILS, PlanName, PlanFeature } from '@/data/planDetails'; // Import data

const plans = [
  { name: 'Essential' as PlanName, price: PLAN_DETAILS['Essential'].price, link: '/plan/essential', loginLink: PLAN_DETAILS['Essential'].link, isPopular: PLAN_DETAILS['Essential'].isPopular },
  { name: 'Business Growth' as PlanName, price: PLAN_DETAILS['Business Growth'].price, link: '/plan/growth', loginLink: PLAN_DETAILS['Business Growth'].link, isPopular: PLAN_DETAILS['Business Growth'].isPopular },
  { name: 'Strategic Partner' as PlanName, price: PLAN_DETAILS['Strategic Partner'].price, link: '/plan/strategic', loginLink: PLAN_DETAILS['Strategic Partner'].link, isPopular: PLAN_DETAILS['Strategic Partner'].isPopular },
];

const features = PLAN_COMPARISON_FEATURES;

const FeatureCell = ({ value, isPopular }: { value: string | boolean, isPopular: boolean }) => {
  const baseClasses = "text-center font-medium";
  
  if (typeof value === 'boolean') {
    return (
      <TableCell className={cn(baseClasses, isPopular && 'bg-secondary/50')}>
        {value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
      </TableCell>
    );
  }
  
  return (
    <TableCell className={cn(baseClasses, isPopular && 'bg-secondary/50')}>
      {value}
    </TableCell>
  );
};

const PricingComparison = () => {
  const whatsappMessage = encodeURIComponent("Hi NoticeBazaar, I need help choosing the right subscription plan for my business.");
  const whatsappLink = `https://wa.me/919205376316?text=${whatsappMessage}`;

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Subscription Plan Comparison</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Find the perfect legal and CA support for your business. All plans include secure portal access and the AI Assistant, Lexi.
        </p>
        
        {/* New WhatsApp CTA */}
        <div className="mt-6">
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-6 py-3 shadow-md">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" /> Need help choosing a plan?
            </a>
          </Button>
        </div>
      </header>

      <div className="bg-card p-6 rounded-xl shadow-lg border border-border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-secondary">
            <TableRow className="border-border">
              <TableHead className="w-[250px] text-left text-foreground font-bold text-base">Features</TableHead>
              {plans.map((plan, index) => (
                <TableHead key={plan.name} className={cn("text-center text-foreground font-bold text-base relative", plan.isPopular && 'bg-secondary/50')}>
                  {plan.isPopular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs font-bold text-primary-foreground">MOST POPULAR</div>}
                  <div className="mt-4">{plan.name}</div>
                  <div className="text-2xl font-extrabold mt-1">{plan.price}</div>
                  <Button variant="link" asChild className="text-xs p-0 h-auto mt-1 text-blue-400 hover:text-blue-300">
                    <Link to={plan.link}>View Details</Link>
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((section) => (
              <React.Fragment key={section.category}>
                <TableRow className="bg-accent/20 border-border hover:bg-accent/20">
                  <TableCell colSpan={4} className="text-left font-bold text-primary text-sm py-3">{section.category}</TableCell>
                </TableRow>
                {section.features.map((feature) => (
                  <TableRow key={feature.name} className="border-border hover:bg-secondary/50">
                    <TableCell className="font-medium text-foreground">{feature.name}</TableCell>
                    <FeatureCell value={feature.essential} isPopular={false} />
                    <FeatureCell value={feature.growth} isPopular={true} />
                    <FeatureCell value={feature.strategic} isPopular={false} />
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            <TableRow className="border-border bg-secondary/50">
              <TableCell className="font-bold text-foreground text-lg">Get Started</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className={cn("text-center py-4", plan.isPopular && 'bg-secondary/50')}>
                  <Button asChild className={cn("w-full", plan.isPopular ? 'cta-primary text-black hover:bg-yellow-500' : 'cta-secondary hover:bg-blue-600')}>
                    <Link to={plan.loginLink}>
                      Choose Plan <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PricingComparison;