import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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

const FreeInfluencerContract = () => {
  const [brandName, setBrandName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDeliverableToggle = (deliverable: string) => {
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
  };

  const [contractGenerated, setContractGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!brandName || !creatorName || !dealAmount || deliverables.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setContractGenerated(true);
      toast.success('Contract generated! Upgrade to download.');
      setIsGenerating(false);
    }, 2000);
  };

  const faqs = [
    {
      question: 'Is this contract generator free?',
      answer: 'Yes, you can generate a contract for free. However, to download the contract document and access advanced features like contract storage, payment tracking, and legal support, you\'ll need to upgrade to CreatorArmour Pro.',
    },
    {
      question: 'Are the generated contracts legally valid?',
      answer: 'The contracts generated follow Indian contract law and include standard clauses for influencer collaborations. However, for complex deals or high-value contracts, we recommend consulting with a lawyer. CreatorArmour Pro includes free legal consultations.',
    },
    {
      question: 'What information do I need to generate a contract?',
      answer: 'You need the brand name, your name (creator), deal amount, deliverables, payment terms, and any specific requirements like exclusivity or usage rights. The tool guides you through each step.',
    },
    {
      question: 'Can I customize the contract terms?',
      answer: 'Yes, the free version allows basic customization. CreatorArmour Pro members can add custom clauses, negotiate terms, and get AI-powered contract analysis.',
    },
    {
      question: 'What happens after I generate a contract?',
      answer: 'With the free version, you can preview the contract. To download, sign, and manage contracts, upgrade to CreatorArmour Pro. Pro members also get contract storage, payment tracking, and legal support.',
    },
  ];

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = `${baseUrl}/free-influencer-contract`;

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title="Free Influencer Contract Generator | Create Brand Deal Contracts"
        description="Generate professional influencer contracts for free. Create legally compliant brand deal agreements with payment terms, deliverables, and IP rights. Download with CreatorArmour Pro."
        keywords={[
          'free influencer contract',
          'brand deal contract generator',
          'influencer agreement template',
          'creator contract generator',
          'India',
          'free contract maker',
        ]}
        canonicalUrl={canonicalUrl}
      />

      {/* SoftwareApplication Schema */}
      <SoftwareApplicationSchema
        name="Free Influencer Contract Generator"
        description="Generate professional influencer contracts for brand collaborations"
        applicationCategory="BusinessApplication"
        operatingSystem="Web"
        offers={{
          price: '0',
          priceCurrency: 'INR',
        }}
        featureList={[
          'Contract generation',
          'Payment terms',
          'Deliverables specification',
          'IP rights management',
        ]}
      />

      {/* FAQ Schema */}
      <FAQSchema faqs={faqs} />

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* SEO Content Above Fold */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              Free Influencer Contract Generator
            </h1>
            <p className="text-xl text-purple-200 mb-6 leading-relaxed">
              Create professional, legally compliant influencer contracts in minutes. Our free contract generator helps content creators and influencers draft brand collaboration agreements with proper payment terms, deliverables, and intellectual property protection.
            </p>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Legally Compliant</h3>
                  <p className="text-sm text-purple-200">
                    Contracts follow Indian contract law and include standard clauses for influencer collaborations.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <FileText className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Professional Format</h3>
                  <p className="text-sm text-purple-200">
                    Generate Word documents ready for signing. Includes all essential clauses and terms.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Creator-Friendly</h3>
                  <p className="text-sm text-purple-200">
                    Built by creators, for creators. Protects your rights and ensures fair payment terms.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Why Use This Tool */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Why Use Our Free Influencer Contract Generator?
              </h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                As a content creator or influencer, protecting yourself in brand collaborations is crucial. Our free contract generator helps you create professional agreements that include:
              </p>
              <ul className="space-y-2 text-purple-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Clear Payment Terms:</strong> Specify amounts, schedules, and late payment penalties (18% per annum as per Indian law)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Deliverables Definition:</strong> Clearly outline what content you'll create, platforms, and deadlines</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">IP Rights Protection:</strong> Ensure you retain ownership of your content while granting usage rights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Termination Clauses:</strong> Define how either party can end the agreement fairly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Dispute Resolution:</strong> Include jurisdiction and resolution methods per Indian Contract Act, 1872</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tool Section - Below Fold */}
          <div id="contract-generator" className="scroll-mt-20">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Generate Your Contract
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
                        Creator Name <span className="text-red-400">*</span>
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
                    disabled={isGenerating || !brandName || !creatorName || !dealAmount || deliverables.length === 0}
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
                        Generate Contract
                      </>
                    )}
                  </Button>

                  {/* Collab Link CTA - Funnel */}
                  {contractGenerated ? (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                        <CardContent className="p-4">
                          <p className="text-white text-sm leading-relaxed mb-3">
                            <strong>✅ Contract Generated!</strong> This contract can be sent via your collab link.
                          </p>
                          <p className="text-purple-200 text-sm leading-relaxed mb-4">
                            When brands submit collaboration requests through your collab link, contracts are automatically generated 
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
                          <strong className="text-white">💡 Pro Tip:</strong> This contract can be sent via your collab link. 
                          When brands submit collaboration requests through your collab link, contracts are automatically generated 
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
                    Download contracts, track payments, get legal support, and protect all your brand deals in one place.
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

export default FreeInfluencerContract;

