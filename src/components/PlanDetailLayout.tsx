"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, ArrowRight, Lightbulb } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PlanDetail, PLAN_COMPARISON_FEATURES, PlanFeature, PLAN_FAQS, PlanName } from '@/data/planDetails';
import { Separator } from '@/components/ui/separator';

interface PlanDetailLayoutProps {
  plan: PlanDetail;
}

// Helper component to render feature cells in the comparison table
const FeatureCell = ({ value, isCurrentPlan }: { value: string | boolean, isCurrentPlan: boolean }) => {
  const baseClasses = "text-center font-medium";
  
  if (typeof value === 'boolean') {
    return (
      <TableCell className={cn(baseClasses, isCurrentPlan && 'bg-primary/10')}>
        {value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
      </TableCell>
    );
  }
  
  return (
    <TableCell className={cn(baseClasses, isCurrentPlan && 'bg-primary/10')}>
      {value}
    </TableCell>
  );
};

// Helper component to render the comparison table
const PlanComparisonTable = ({ currentPlanName }: { currentPlanName: PlanName }) => {
  const plans = [
    { name: 'Essential' as PlanName, isCurrent: currentPlanName === 'Essential' },
    { name: 'Business Growth' as PlanName, isCurrent: currentPlanName === 'Business Growth' },
    { name: 'Strategic Partner' as PlanName, isCurrent: currentPlanName === 'Strategic Partner' },
  ];

  const getFeatureValue = (feature: PlanFeature, planName: PlanName) => {
    if (planName === 'Essential') return feature.essential;
    if (planName === 'Business Growth') return feature.growth;
    if (planName === 'Strategic Partner') return feature.strategic;
    return false;
  };

  return (
    <div className="bg-secondary p-4 rounded-xl shadow-inner border border-border overflow-x-auto">
      <h3 className="text-2xl font-bold text-foreground mb-4">Compare All Plans</h3>
      <Table className="min-w-[700px]">
        <TableHeader className="bg-card">
          <TableRow className="border-border">
            <TableHead className="w-[250px] text-left text-foreground font-bold text-base">Feature</TableHead>
            {plans.map((plan) => (
              <TableHead key={plan.name} className={cn("text-center text-foreground font-bold text-base", plan.isCurrent && 'bg-primary/20')}>
                {plan.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PLAN_COMPARISON_FEATURES.map((section) => (
            <React.Fragment key={section.category}>
              <TableRow className="bg-accent/20 border-border hover:bg-accent/20">
                <TableCell colSpan={4} className="text-left font-bold text-primary text-sm py-3">{section.category}</TableCell>
              </TableRow>
              {section.features.map((feature) => (
                <TableRow key={feature.name} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground">{feature.name}</TableCell>
                  {plans.map((plan) => (
                    <FeatureCell 
                      key={plan.name} 
                      value={getFeatureValue(feature, plan.name)} 
                      isCurrentPlan={plan.isCurrent} 
                    />
                  ))}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


const PlanDetailLayout: React.FC<PlanDetailLayoutProps> = ({ plan }) => {
  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/pricing-comparison">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Comparison
        </Link>
      </Button>
      
      <Card className="max-w-5xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold text-foreground mb-1">{plan.name} Plan</h1>
            <div className="text-3xl font-extrabold text-primary">{plan.price}</div>
          </div>
          <p className="text-lg text-muted-foreground">{plan.tagline}</p>
          {plan.isPopular && (
            <span className="inline-block mt-2 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold text-white">MOST POPULAR</span>
          )}
        </header>

        <div className="space-y-10">
          {/* Overview and CTA */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-primary">Plan Overview</h2>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>
            <div className="md:col-span-1 flex flex-col justify-center">
              <Button asChild className="w-full cta-primary py-3 rounded-lg font-bold text-lg">
                <Link to={plan.link}>
                  Choose {plan.name} Plan <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="link" asChild className="w-full mt-2 text-primary hover:text-primary/80">
                <Link to="/login">Already a client? Login</Link>
              </Button>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Included / Not Included */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-green-500 flex items-center mb-4">
                <Check className="h-6 w-6 mr-2" /> What's Included
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                {plan.included.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-destructive flex items-center mb-4">
                <X className="h-6 w-6 mr-2" /> What's Not Included
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                {plan.notIncluded.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <X className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-1" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Real-World Examples */}
          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Real-World Use Cases</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {plan.examples.map((example, index) => (
                <Card key={index} className="bg-secondary p-4 border-l-4 border-yellow-500">
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-lg font-semibold text-foreground">{example.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-sm text-muted-foreground">
                    {example.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Comparison Table */}
          <section>
            <PlanComparisonTable currentPlanName={plan.name} />
          </section>

          <Separator className="bg-border" />

          {/* FAQs */}
          <section>
            <h2 className="text-2xl font-bold text-primary mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {PLAN_FAQS.map((faq, index) => (
                <Card key={index} className="bg-secondary p-4 border border-border">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-3" /> {faq.question}
                  </CardTitle>
                  <CardContent className="p-0 pt-2 text-muted-foreground">
                    {faq.answer}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default PlanDetailLayout;