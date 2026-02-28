import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Shield, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSchema } from '@/components/seo/SchemaMarkup';

// SoftwareApplication Schema Component (defined before use)
const SoftwareApplicationSchema = ({
  name,
  description,
  applicationCategory,
  operatingSystem,
  offers,
  featureList,
}: {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: { price: string; priceCurrency: string };
  featureList: string[];
}) => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description,
      applicationCategory,
      operatingSystem,
      offers: {
        '@type': 'Offer',
        price: offers.price,
        priceCurrency: offers.priceCurrency,
      },
      featureList,
      url: typeof window !== 'undefined' ? window.location.href : 'https://creatorarmour.com',
    };

    const existingScript = document.querySelector('script[data-schema="software"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'software');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="software"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, applicationCategory, operatingSystem, offers, featureList]);

  return null;
};

const CollaborationAgreementGenerator = () => {
  const [brandName, setBrandName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [collabType, setCollabType] = useState<'paid' | 'barter' | 'hybrid' | 'both'>('paid');
  const [dealAmount, setDealAmount] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agreementGenerated, setAgreementGenerated] = useState(false);

  const handleDeliverableToggle = (deliverable: string) => {
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
  };

  const handleGenerate = async () => {
    if (!brandName || !creatorName || deliverables.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if ((collabType === 'paid' || collabType === 'both' || collabType === 'hybrid') && !dealAmount) {
      toast.error('Please enter deal amount for paid collaborations');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setAgreementGenerated(true);
      toast.success('Collaboration agreement generated! Upgrade to download.');
      setIsGenerating(false);
    }, 2000);
  };

  const faqs = [
    {
      question: 'What is a collaboration agreement?',
      answer: 'A collaboration agreement is a legal contract between a brand and an influencer/creator that outlines the terms of their partnership, including deliverables, payment, content usage rights, and other important terms. It protects both parties and ensures clarity.',
    },
    {
      question: 'Is this collaboration agreement generator free?',
      answer: 'Yes, you can generate a collaboration agreement for free. To download the document, store it securely, track payments, and access legal support, upgrade to CreatorArmour Pro.',
    },
    {
      question: 'What\'s the difference between paid and barter collaborations?',
      answer: 'Paid collaborations involve monetary compensation, while barter collaborations involve product or service exchange. Our generator supports both types and can handle hybrid agreements that include both payment and product exchange.',
    },
    {
      question: 'Do I need a lawyer to use this?',
      answer: 'While our generator creates legally compliant agreements based on Indian contract law, we recommend consulting a lawyer for high-value deals or complex terms. CreatorArmour Pro includes free legal consultations with verified lawyers.',
    },
    {
      question: 'Can I edit the generated agreement?',
      answer: 'Yes, the free version generates a standard agreement. CreatorArmour Pro members can customize terms, add clauses, negotiate with brands, and get AI-powered contract analysis.',
    },
  ];

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = `${baseUrl}/collaboration-agreement-generator`;

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title="Collaboration Agreement Generator | Free Brand Partnership Tool"
        description="Generate professional collaboration agreements for brand partnerships. Free tool for creators and influencers to create legally compliant collaboration contracts with brands in India."
        keywords={[
          'collaboration agreement generator',
          'brand partnership agreement',
          'influencer collaboration contract',
          'creator agreement template',
          'India',
          'free collaboration tool',
        ]}
        canonicalUrl={canonicalUrl}
      />

      {/* SoftwareApplication Schema */}
      <SoftwareApplicationSchema
        name="Collaboration Agreement Generator"
        description="Generate professional collaboration agreements for brand partnerships"
        applicationCategory="BusinessApplication"
        operatingSystem="Web"
        offers={{
          price: '0',
          priceCurrency: 'INR',
        }}
        featureList={[
          'Paid collaboration agreements',
          'Barter collaboration agreements',
          'Hybrid agreements',
          'Deliverables specification',
        ]}
      />

      {/* FAQ Schema */}
      <FAQSchema faqs={faqs} />

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* SEO Content Above Fold */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              Collaboration Agreement Generator
            </h1>
            <p className="text-xl text-purple-200 mb-6 leading-relaxed">
              Create professional collaboration agreements for brand partnerships. Our free tool helps influencers, creators, and brands draft legally compliant collaboration contracts that protect both parties and ensure clear terms for successful partnerships.
            </p>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Protects Both Parties</h3>
                  <p className="text-sm text-purple-200">
                    Fair agreements that protect creators and brands. Includes standard clauses for Indian collaborations.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <FileText className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Supports All Types</h3>
                  <p className="text-sm text-purple-200">
                    Generate agreements for paid collaborations, barter deals, or hybrid partnerships.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Legally Compliant</h3>
                  <p className="text-sm text-purple-200">
                    Agreements follow Indian contract law and include ASCI compliance guidelines for influencer marketing.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Why Use This Tool */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Why Use Our Collaboration Agreement Generator?
              </h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                Whether you're a creator working with brands or a brand partnering with influencers, a clear collaboration agreement is essential. Our generator creates professional agreements that include:
              </p>
              <ul className="space-y-2 text-purple-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Clear Scope of Work:</strong> Define deliverables, platforms, timelines, and content requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Compensation Terms:</strong> Specify payment amounts, schedules, or barter product values</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Content Usage Rights:</strong> Define how brands can use your content, duration, and platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Exclusivity Clauses:</strong> Specify exclusivity periods and restrictions if applicable</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">ASCI Compliance:</strong> Include required disclosures and compliance with advertising standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Termination Terms:</strong> Fair termination clauses for both parties</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tool Section - Below Fold */}
          <div id="agreement-generator" className="scroll-mt-20">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Generate Your Collaboration Agreement
                </h2>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Brand Name <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Enter brand name"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Creator/Influencer Name <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="Your name"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Collaboration Type <span className="text-red-400">*</span>
                    </label>
                    <Select value={collabType} onValueChange={(value: 'paid' | 'barter' | 'hybrid' | 'both') => setCollabType(value)}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid Collaboration</SelectItem>
                        <SelectItem value="barter">Barter Collaboration</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Paid + Barter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(collabType === 'paid' || collabType === 'both' || collabType === 'hybrid') && (
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Deal Amount (₹) <span className="text-red-400">*</span>
                      </label>
                      <Input
                        type="number"
                        value={dealAmount}
                        onChange={(e) => setDealAmount(e.target.value)}
                        placeholder="50000"
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Deliverables <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Instagram Reel', 'Instagram Post', 'Instagram Story', 'YouTube Video', 'YouTube Short', 'Blog Post'].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={item}
                            checked={deliverables.includes(item)}
                            onCheckedChange={() => handleDeliverableToggle(item)}
                            className="border-white/30 data-[state=checked]:bg-purple-600"
                          />
                          <label htmlFor={item} className="text-sm text-purple-200 cursor-pointer">
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !brandName || !creatorName || deliverables.length === 0 || ((collabType === 'paid' || collabType === 'both' || collabType === 'hybrid') && !dealAmount)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5 mr-2" />
                        Generate Agreement
                      </>
                    )}
                  </Button>

                  {/* Collab Link CTA - Funnel */}
                  {agreementGenerated ? (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                        <CardContent className="p-4">
                          <p className="text-white text-sm leading-relaxed mb-3">
                            <strong>✅ Agreement Generated!</strong> This collaboration agreement can be sent via your collab link.
                          </p>
                          <p className="text-purple-200 text-sm leading-relaxed mb-4">
                            When brands submit collaboration requests through your collab link, agreements are automatically generated 
                            and managed securely—no manual sending needed.
                          </p>
                          <Button
                            asChild
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <Link to="/signup">
                              Get Your Free Collab Link <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-purple-200 text-sm leading-relaxed">
                          <strong className="text-white">💡 Pro Tip:</strong> This collaboration agreement can be sent via your collab link. 
                          When brands submit collaboration requests through your collab link, agreements are automatically generated 
                          and managed securely. <Link to="/signup" className="text-purple-300 hover:text-white underline font-medium">Get your free collab link →</Link>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade CTA */}
          <Card className="mt-8 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Upgrade to CreatorArmour for Full Protection
                  </h3>
                  <p className="text-purple-200">
                    Download agreements, track collaborations, get legal support, and manage all your brand partnerships in one secure platform.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  <Link to="/signup">
                    Upgrade Now <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-white/5 backdrop-blur-md border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-purple-200 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollaborationAgreementGenerator;
