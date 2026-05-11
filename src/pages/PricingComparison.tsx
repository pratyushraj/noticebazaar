import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSection } from '@/components/seo/FAQSection';
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
import { PLAN_COMPARISON_FEATURES, PLAN_DETAILS, PlanName } from '@/data/planDetails'; // Import data

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
      <TableCell className={cn(baseClasses, isPopular && 'bg-card0')}>
        {value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-destructive mx-auto" />}
      </TableCell>
    );
  }
  
  return (
    <TableCell className={cn(baseClasses, isPopular && 'bg-card0')}>
      {value}
    </TableCell>
  );
};

const PricingComparison = () => {
  const whatsappMessage = encodeURIComponent("Hi Creator Armour, I need help choosing the right subscription plan for my business.");
  const whatsappLink = `https://wa.me/919205376316?text=${whatsappMessage}`;

  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <SEOHead
        title="Creator Armour Pricing — Plans for Every Creator"
        description="Compare Creator Armour plans. Free deal page, essential protection, and growth features for Indian influencers and creators."
        keywords={['creator armour pricing', 'influencer tools pricing', 'brand deal platform cost']}
        canonicalUrl="https://creatorarmour.com/pricing-comparison"
      />
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
        
        {/* FAQ Section */}
        <FAQSection 
          title="Pricing & Value"
          description="Common questions about our plans and how they pay for themselves."
          containerClassName="bg-white/5 backdrop-blur-xl border-y border-white/10 my-24"
          items={[
            {
              question: "Is there a free version of Creator Armour?",
              answer: "Yes! Our Free plan allows you to create a professional collaboration link, list your services, and receive brand inquiries. It's perfect for creators just starting to professionalize their workflow."
            },
            {
              question: "Can I upgrade or downgrade my plan later?",
              answer: "Absolutely. You can upgrade to a higher tier at any time to unlock more features, or downgrade to the free tier if your volume of deals changes."
            },
            {
              question: "How does the legal support work in the Pro and Business plans?",
              answer: "Pro members get access to pre-vetted legal templates and basic email support. Business members get priority legal consultations and assistance with complex contract negotiations from our partner legal advisors."
            },
            {
              question: "What are 'Programmatic Profile Pages'?",
              answer: "These are SEO-optimized pages that help brands find you on Google. We use structured data to ensure your profile ranks for relevant keywords like '[Your Name] influencer rates' or '[Your Category] creator in India'."
            },
            {
              question: "What payment methods do you support?",
              answer: "We support UPI, Net Banking, and Credit/Debit cards for platform subscriptions. For your brand deals, we provide tracking tools for various payment methods to ensure you always have an audit trail."
            }
          ]}
        />

        {/* Final CTA */}
        <div className="mt-24 text-center">
          <Button asChild className="bg-green-600 hover:bg-green-700 text-foreground font-semibold text-lg px-6 py-3 shadow-md">
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
                <TableHead key={plan.name} className={cn("text-center text-foreground font-bold text-base relative", plan.isPopular && 'bg-card0')}>
                  {plan.isPopular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary px-3 py-1 rounded-full text-xs font-bold text-primary-foreground">MOST POPULAR</div>}
                  <div className="mt-4">{plan.name}</div>
                  <div className="text-2xl font-extrabold mt-1">{plan.price}</div>
                  <Button variant="link" asChild className="text-xs p-0 h-auto mt-1 text-info hover:text-info">
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
                  <TableRow key={feature.name} className="border-border hover:bg-card0">
                    <TableCell className="font-medium text-foreground">{feature.name}</TableCell>
                    <FeatureCell value={feature.essential} isPopular={false} />
                    <FeatureCell value={feature.growth} isPopular={true} />
                    <FeatureCell value={feature.strategic} isPopular={false} />
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            <TableRow className="border-border bg-card0">
              <TableCell className="font-bold text-foreground text-lg">Get Started</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.name} className={cn("text-center py-4", plan.isPopular && 'bg-card0')}>
                  <Button asChild className={cn("w-full", plan.isPopular ? 'cta-primary text-black hover:bg-yellow-500' : 'cta-secondary hover:bg-info')}>
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