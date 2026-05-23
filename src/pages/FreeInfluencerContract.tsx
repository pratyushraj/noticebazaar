import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Shield, CheckCircle2, ArrowRight, Loader2, 
  Copy, Check, Sparkles, Scale, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSchema } from '@/components/seo/SchemaMarkup';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

// SoftwareApplication Schema Component
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
  const [isBarter, setIsBarter] = useState(false);
  const [dealAmount, setDealAmount] = useState('15000');
  const [productDetails, setProductDetails] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>(['Instagram Reel']);
  const [paymentTerms, setPaymentTerms] = useState('50_50');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contractGenerated, setContractGenerated] = useState(false);

  const handleDeliverableToggle = (deliverable: string) => {
    triggerHaptic(HapticPatterns.light);
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
  };

  const handleCopy = () => {
    triggerHaptic(HapticPatterns.medium);
    const contractText = generateContractMarkup();
    navigator.clipboard.writeText(contractText);
    setCopied(true);
    toast.success('Contract copied to clipboard! Ready to paste.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    triggerHaptic(HapticPatterns.heavy);
    setIsGenerating(true);
    setTimeout(() => {
      setContractGenerated(true);
      setIsGenerating(false);
      toast.success('Professional e-sign contract layout generated below!');
      // Scroll to preview paper on mobile
      const preview = document.getElementById('contract-preview-paper');
      if (preview) {
        preview.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1200);
  };

  const todayDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const generateContractMarkup = () => {
    const brand = brandName || '[BRAND NAME]';
    const creator = creatorName || '[CREATOR NAME]';
    const deliverablesList = deliverables.length > 0 
      ? deliverables.map(d => `   - ${d} (to be published on Creator's handles)`).join('\n')
      : '   - [NO DELIVERABLES SELECTED]';

    if (isBarter) {
      const product = productDetails || '[PRODUCT NAME/VOUCHER]';
      const val = dealAmount || '[PRODUCT RETAIL VALUE]';
      return `BARTER COLLABORATION AGREEMENT (PRODUCT EXCHANGE)

This Agreement is made and entered into on ${todayDate} (the "Effective Date") by and between:

1. THE BRAND: ${brand} (hereinafter referred to as the "Brand")
AND
2. THE CREATOR: ${creator} (hereinafter referred to as the "Creator").

WHEREAS, the Brand desires to send its physical product(s) to the Creator, and the Creator agrees to produce creative promotional content in exchange for the product (non-monetary barter exchange):

1. BARTER CONSIDERATION (PRODUCT DETAILS):
   The Brand agrees to ship the following product(s) at its own expense to the Creator's verified address:
   - Product/Voucher: ${product}
   - Estimated Fair Retail Value: ₹${val}

2. SCOPE OF WORK & DELIVERABLES:
   The Creator shall create and publish the following deliverables:
${deliverablesList}

3. SHIPMENT & TIMELINE:
   - The Brand agrees to dispatch the barter product within 3 business days of this Agreement.
   - The Creator agrees to record, edit, and publish the agreed deliverables within 7 days of receiving the physical product.

4. NO CASH COMPENSATION:
   The parties explicitly agree that no cash/monetary compensation shall be paid under this barter exchange. The Creator accepts the barter product as full and final payment for their creative services.

5. INTELLECTUAL PROPERTY & USAGE RIGHTS:
   The Creator retains all primary copyright to the created media. The Brand is granted a non-exclusive, royalty-free, worldwide license to repost, share, and utilize the content for organic social media marketing purposes for a period of 30 days from the post date. Any paid ad usage rights must be negotiated separately.

6. GOVERNING LAW & JURISDICTION:
   This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of this Agreement shall be subject to the exclusive jurisdiction of the courts of New Delhi, India.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement as of the Effective Date.

Signed by:
For the Brand: ____________________
For the Creator: ____________________`;
    } else {
      const amount = dealAmount || '[DEAL AMOUNT]';
      let paymentDesc = '';
      if (paymentTerms === '50_50') {
        paymentDesc = `50% Advance (₹${(Number(amount) * 0.5) || '[ADVANCE]'} paid prior to content filming) and 50% Post-delivery (₹${(Number(amount) * 0.5) || '[BALANCE]'} paid within 7 business days of successful post publication).`;
      } else if (paymentTerms === '100_post') {
        paymentDesc = `100% Post-delivery (₹${amount} paid within 15 business days of successful deliverables publication).`;
      } else {
        paymentDesc = `100% Upfront Advance (₹${amount} paid prior to content creation).`;
      }

      return `INFLUENCER COLLABORATION AGREEMENT (PAID)

This Agreement is made and entered into on ${todayDate} (the "Effective Date") by and between:

1. THE BRAND: ${brand} (hereinafter referred to as the "Brand")
AND
2. THE CREATOR: ${creator} (hereinafter referred to as the "Creator").

WHEREAS, the Brand desires to engage the Creator to produce creative promotional content, and the Creator agrees to perform such services under the terms below:

1. SCOPE OF WORK & DELIVERABLES:
   The Creator shall create and publish the following deliverables:
${deliverablesList}

2. CONSIDERATION & PAYMENT TERMS:
   - The Brand agrees to pay the Creator a total sum of ₹${amount} (Indian Rupees) in exchange for the deliverables.
   - Payment Schedule: ${paymentDesc}
   - All payments are subject to a late payment penalty of 18% per annum under the Indian Contract Act, 1872, for any invoices unpaid after 30 days.

3. INTELLECTUAL PROPERTY & USAGE RIGHTS:
   The Creator retains all primary copyright to the created media. The Brand is granted a non-exclusive, royalty-free, worldwide license to repost, share, and utilize the content for organic social media marketing purposes for a period of 30 days from the post date. Any paid ad usage rights must be negotiated separately.

4. INDEPENDENT CONTRACTOR STATUS:
   The parties agree that the Creator operates as an independent contractor, and nothing in this Agreement creates any employment, partnership, or agency relationship.

5. GOVERNING LAW & JURISDICTION:
   This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of this Agreement shall be subject to the exclusive jurisdiction of the courts of New Delhi, India.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement as of the Effective Date.

Signed by:
For the Brand: ____________________
For the Creator: ____________________`;
    }
  };

  const faqs = [
    {
      question: 'Is this contract generator free?',
      answer: 'Yes, you can generate and copy your custom influencer collaboration contract completely for free. To download signed PDF copies, secure e-signatures, and track delivery automatically, upgrade to Creator Armour Pro.',
    },
    {
      question: 'Are barter agreements legally binding in India?',
      answer: 'Yes. Under the Indian Contract Act, 1872, a barter exchange (non-monetary product gifting) is a valid contract as long as there is an offer, acceptance, and consideration (which is the physical product and the creative UGC content).',
    },
    {
      question: 'What is the standard payment terms for creators in India?',
      answer: 'The most popular format is a 50/50 split (50% advance upfront to secure the date, and 50% post-delivery after publishing). Barter campaigns typically require product shipment within 3 days and content delivery within 7 days of arrival.',
    },
    {
      question: 'Can I add a late payment penalty clause?',
      answer: 'Absolutely. Our paid contract generator automatically incorporates an 18% per annum late payment interest clause to protect creators from delayed brand payments, in compliance with Indian business standards.',
    },
  ];

  return (
    <>
      <SEOHead
        title="Free Influencer Contract Generator India | Barter & Paid"
        description="Generate professional influencer collaboration agreements for free. Design legal barter product exchange templates and paid brand deal contracts in 1 minute."
        keywords={[
          'free influencer contract generator',
          'barter contract agreement template',
          'influencer product exchange agreement India',
          'creator agreement creator India',
          'prevent influencer ghosting contract',
          'brand deal contract maker',
        ]}
        canonicalUrl="https://creatorarmour.com/free-influencer-contract"
      />

      <SoftwareApplicationSchema
        name="Free Influencer Contract Generator"
        description="Generate professional barter and paid influencer contracts for brand collaborations"
        applicationCategory="BusinessApplication"
        operatingSystem="Web"
        offers={{ price: '0', priceCurrency: 'INR' }}
        featureList={[
          'Barter agreement templates',
          'Paid contract templates',
          'Late payment interest clauses',
          'Usage rights management',
          'Deliverables checklists'
        ]}
      />

      <FAQSchema faqs={faqs} />

      <div className="min-h-dvh bg-[#091E16] text-[#E2E8F0] font-sans pb-20 overflow-x-hidden">
        {/* Custom Header Nav */}
        <nav className="border-b border-[#14532D]/30 bg-[#091E16]/80 backdrop-blur-md sticky top-0 z-50 h-16 flex items-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" onClick={() => triggerHaptic(HapticPatterns.light)}>
              <div className="w-8 h-8 bg-[#16A34A] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[15px] font-black tracking-tight text-white">Creator Armour</span>
            </Link>
            <Link 
              to="/signup?mode=brand" 
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-full text-xs font-black transition-all"
            >
              Protect Campaigns
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#14532D]/40 text-[#4ADE80] rounded-full border border-[#16A34A]/20 mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Interactive Legal Utility</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-white">
              Free Influencer<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#16A34A]">Contract Generator</span>
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#94A3B8] font-medium leading-relaxed">
              Tired of creator ghosting or delayed brand payments? Generate legally robust, Indian Contract Act-compliant agreements in under 60 seconds. Choose between **Barter** or **Paid** collaborations.
            </p>
          </div>

          {/* Generator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Panel (Left Column) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-[#0D2E21] border-[#14532D]/40 shadow-xl rounded-[24px] overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#14532D]/30 pb-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#4ADE80]" /> Custom Terms
                    </h2>
                    
                    {/* Barter/Paid Toggle */}
                    <div className="flex bg-[#091E16] p-1 rounded-full border border-[#14532D]/30">
                      <button
                        onClick={() => { setIsBarter(false); triggerHaptic(HapticPatterns.light); }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase transition-all ${!isBarter ? 'bg-[#16A34A] text-white' : 'text-[#94A3B8]'}`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => { setIsBarter(true); triggerHaptic(HapticPatterns.light); }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase transition-all ${isBarter ? 'bg-[#16A34A] text-white' : 'text-[#94A3B8]'}`}
                      >
                        Barter
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Brand Name */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Brand Name *</label>
                      <Input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. Kapiva Skincare"
                        className="bg-[#091E16] border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] placeholder-[#64748B] focus-visible:ring-0"
                      />
                    </div>

                    {/* Creator Name */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Creator Name *</label>
                      <Input
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="e.g. Vidushi Sharan"
                        className="bg-[#091E16] border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] placeholder-[#64748B] focus-visible:ring-0"
                      />
                    </div>

                    {/* Barter Specific Details */}
                    {isBarter ? (
                      <>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Barter Product / Voucher *</label>
                          <Input
                            value={productDetails}
                            onChange={(e) => setProductDetails(e.target.value)}
                            placeholder="e.g. Premium Glow Kit & ₹5,000 Voucher"
                            className="bg-[#091E16] border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] placeholder-[#64748B] focus-visible:ring-0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Product Estimated Value (₹) *</label>
                          <Input
                            type="number"
                            value={dealAmount}
                            onChange={(e) => setDealAmount(e.target.value)}
                            placeholder="8000"
                            className="bg-[#091E16] border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] placeholder-[#64748B] focus-visible:ring-0"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Paid Specific Details */}
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Deal Amount (₹) *</label>
                          <Input
                            type="number"
                            value={dealAmount}
                            onChange={(e) => setDealAmount(e.target.value)}
                            placeholder="15000"
                            className="bg-[#091E16] border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] placeholder-[#64748B] focus-visible:ring-0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-2">Payment Terms</label>
                          <select
                            value={paymentTerms}
                            onChange={(e) => { setPaymentTerms(e.target.value); triggerHaptic(HapticPatterns.light); }}
                            className="w-full h-10 px-3 bg-[#091E16] border border-[#14532D]/40 text-white rounded-xl focus:border-[#16A34A] text-sm focus:outline-none"
                          >
                            <option value="50_50">50% Advance / 50% Post-delivery</option>
                            <option value="100_post">100% Post-delivery</option>
                            <option value="100_upfront">100% Upfront Advance</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Deliverables Checklist */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[#94A3B8] mb-3">Deliverables *</label>
                      <div className="grid grid-cols-2 gap-3 bg-[#091E16] p-4 rounded-xl border border-[#14532D]/30">
                        {['Instagram Reel', 'Instagram Story', 'Instagram Post', 'YouTube Short'].map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={item}
                              checked={deliverables.includes(item)}
                              onCheckedChange={() => handleDeliverableToggle(item)}
                              className="border-[#14532D]/60 data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A]"
                            />
                            <label htmlFor={item} className="text-xs text-[#E2E8F0] font-bold cursor-pointer select-none">
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !brandName || !creatorName || (isBarter && !productDetails)}
                    className="w-full h-12 bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Draft...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Generate Agreement
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Secure Trust Callout */}
              <div className="bg-[#14532D]/20 border border-[#16A34A]/20 rounded-[20px] p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
                <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
                  <strong className="text-[#4ADE80]">Secure Escrow Tip:</strong> Manual contracts protect you legally, but they don't automate delivery. Upgrade to secure **Creator Armour Escrow** to hold payments and release them only after delivery matches the contract.
                </p>
              </div>
            </div>

            {/* Live Preview Paper (Right Column) */}
            <div className="lg:col-span-7 space-y-6">
              <div id="contract-preview-paper" className="relative group bg-white border border-[#E2E8F0] rounded-[24px] shadow-2xl p-6 sm:p-10 font-mono text-[#0F172A] text-xs leading-relaxed max-h-[600px] overflow-y-auto select-text scroll-smooth border-t-8 border-t-[#16A34A]">
                {/* Red Legal Margin Line */}
                <div className="absolute left-6 inset-y-0 w-[1px] bg-red-200 pointer-events-none hidden sm:block" />

                <div className="sm:pl-6 space-y-4 whitespace-pre-wrap">
                  {generateContractMarkup()}
                </div>

                {/* Cover Gradient Layer */}
                {!contractGenerated && (
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-8 rounded-b-[24px]">
                    <div className="text-center px-4">
                      <p className="text-xs text-[#64748B] font-bold font-sans mb-3">Live contract draft updates instantly as you type!</p>
                      <Button
                        onClick={handleGenerate}
                        disabled={!brandName || !creatorName || (isBarter && !productDetails)}
                        className="bg-[#0F172A] text-white hover:bg-slate-800 font-bold px-6 py-3 rounded-full font-sans text-xs"
                      >
                        Unlock Draft Preview
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Panel */}
              {contractGenerated && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleCopy}
                    className="flex-1 h-12 bg-white border border-[#E2E8F0] hover:border-[#16A34A] text-[#0F172A] font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" /> Contract Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Agreement Text
                      </>
                    )}
                  </Button>
                  <Button
                    asChild
                    className="flex-1 h-12 bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Link to="/signup?mode=brand">
                      E-Sign & Secure Escrow <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* FAQs */}
          <div className="mt-20 max-w-3xl mx-auto border-t border-[#14532D]/20 pt-16">
            <h2 className="text-2xl font-black text-white text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-[#0D2E21] border-[#14532D]/30 rounded-[20px] overflow-hidden shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-black text-[#4ADE80] text-[15px] mb-2">{faq.question}</h3>
                    <p className="text-sm text-[#94A3B8] font-medium leading-relaxed">{faq.answer}</p>
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
