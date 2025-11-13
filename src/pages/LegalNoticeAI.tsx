"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, FileText, ShieldCheck, Clock, Send, Check, 
  IndianRupee, Bot, Users, Briefcase, User, Home, 
  MessageSquare, Phone, Zap, AlertCircle, HelpCircle,
  Upload, MapPin, Calendar, FileCheck, Lock, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';

const LegalNoticeAI = () => {
  const { session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    noticeType: '',
    oppositePartyName: '',
    incidentDescription: '',
    contractFile: null as File | null,
    yourAddress: '',
    theirAddress: '',
    desiredOutcome: '',
  });
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const noticeTypes = [
    { id: 'payment_recovery', name: 'Payment Recovery Notice', icon: IndianRupee },
    { id: 'copyright', name: 'Content IP / Copyright Notice', icon: FileText },
    { id: 'defamation', name: 'Defamation Notice', icon: AlertCircle },
    { id: 'contract_breach', name: 'Breach of Contract', icon: FileCheck },
    { id: 'service_non_delivery', name: 'Service Non-Delivery', icon: Briefcase },
    { id: 'consumer_complaint', name: 'Consumer Complaint', icon: Users },
    { id: 'property_dispute', name: 'Property/Lease Disputes', icon: Home },
    { id: 'loan_recovery', name: 'Loan Recovery', icon: IndianRupee },
  ];

  const handleGenerateNotice = async () => {
    setIsGenerating(true);
    // TODO: Call AI draft endpoint
    // Simulate AI generation
    setTimeout(() => {
      setDraftNotice(`LEGAL NOTICE

To,
${formData.oppositePartyName}
${formData.theirAddress}

Subject: Legal Notice for ${formData.noticeType}

Dear Sir/Madam,

This is to bring to your notice that you have failed to comply with the terms and conditions as agreed between us.

${formData.incidentDescription}

We hereby demand that you:
${formData.desiredOutcome}

You are hereby given 7 (seven) days from the date of receipt of this notice to comply with the above demands, failing which we shall be constrained to initiate appropriate legal proceedings against you without any further notice.

Thanking you,
Yours faithfully,

[Your Name]
${formData.yourAddress}

Date: ${new Date().toLocaleDateString()}`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <style>{`
        :root{
          --bg:#0B1325;
          --card:#131F3B;
          --muted: #9CA3AF;
          --accent-blue:#3B82F6;
          --accent-purple:#8B5CF6;
          --accent-green:#22C55E;
          --accent-yellow:#FACC15;
          --accent-red:#EF4444;
          --glass: rgba(255,255,255,0.03);
        }
        .gradient-text{background:linear-gradient(90deg,var(--accent-blue),var(--accent-purple)); -webkit-background-clip:text; -webkit-text-fill-color:transparent;}
        .cta-primary{background:linear-gradient(90deg,var(--accent-yellow),#F59E0B); color:#0b1020}
        .cta-primary:hover{transform:translateY(-3px) scale(1.02)}
        .cta-secondary{background:linear-gradient(90deg,var(--accent-blue),#2563EB); color:white}
        .card{background:var(--card); border:1px solid rgba(255,255,255,0.08); box-shadow: 0 6px 18px rgba(3,7,18,0.6); border-radius: 0.75rem;}
      `}</style>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400">AI-Powered Legal Notice Generator</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              ⚡ Draft & Send Legal Notices in <span className="gradient-text">Minutes</span>
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              Get a lawyer-verified, professionally formatted legal notice without hiring expensive law firms.
            </p>
            <p className="text-gray-400 mb-8">
              Used by creators, influencers, freelancers & businesses across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowForm(true)}
                className="cta-primary px-8 py-6 text-lg font-bold"
              >
                Draft Your Legal Notice <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="cta-secondary px-8 py-6 text-lg font-bold"
              >
                Try Free Demo
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="card p-8 rounded-2xl">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bot className="h-8 w-8 text-blue-400" />
                    <span className="font-semibold">AI Drafting Notice...</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">87%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="card p-4 flex-1">
                  <FileText className="h-6 w-6 text-blue-400 mb-2" />
                  <p className="text-sm text-gray-300">Legal Notice Draft</p>
                </div>
                <div className="card p-4 flex-1">
                  <ShieldCheck className="h-6 w-6 text-green-400 mb-2" />
                  <p className="text-sm text-gray-300">Lawyer Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Who Is This For?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: 'Creators & Influencers', items: ['Brand payment disputes', 'Unauthorized content usage', 'Defamation notices'] },
            { icon: Briefcase, title: 'Freelancers', items: ['Non-payment', 'Contract breach', 'Deliverables disputes'] },
            { icon: Briefcase, title: 'Businesses / SMEs', items: ['Vendor disputes', 'Employee issues', 'Contract violations'] },
            { icon: User, title: 'Individuals', items: ['Property disputes', 'Loan recovery', 'Consumer complaints'] },
          ].map((segment, idx) => (
            <div key={idx} className="card p-6 rounded-xl">
              <segment.icon className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-4">{segment.title}</h3>
              <ul className="space-y-2">
                {segment.items.map((item, i) => (
                  <li key={i} className="flex items-start text-gray-300">
                    <Check className="h-4 w-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => setShowForm(true)} className="cta-primary px-8 py-4 text-lg font-bold">
            Start Drafting <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16 bg-card rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Describe Your Issue', desc: 'Simple form → "What happened?"', icon: FileText },
            { step: 2, title: 'AI Drafts Your Notice', desc: 'Our AI creates a legally structured draft instantly.', icon: Bot },
            { step: 3, title: 'Lawyer Reviews & Approves', desc: 'Our partner advocate verifies it for legal accuracy.', icon: ShieldCheck },
            { step: 4, title: 'We Send the Notice', desc: 'Sent via Email, Speed Post, WhatsApp. Tracking in dashboard.', icon: Send },
          ].map((step, idx) => (
            <div key={idx} className="relative">
              <div className="card p-6 rounded-xl text-center">
                <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-400">{step.step}</span>
                </div>
                <step.icon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-300 text-sm">{step.desc}</p>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 text-gray-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Notice Types */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">Notice Types You Can Send</h2>
        <p className="text-center text-gray-400 mb-12">Choose the type of legal notice you need</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {noticeTypes.map((type) => (
            <div 
              key={type.id} 
              className="card p-6 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => {
                setFormData({ ...formData, noticeType: type.id });
                setShowForm(true);
              }}
            >
              <type.icon className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="font-semibold">{type.name}</h3>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => setShowForm(true)} className="cta-primary px-8 py-4 text-lg font-bold">
            Start Legal Notice <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* AI Notice Generator Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">AI Legal Notice Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Type of Notice</label>
              <select
                value={formData.noticeType}
                onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white"
              >
                <option value="">Select notice type</option>
                {noticeTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Name of Opposite Party</label>
              <input
                type="text"
                value={formData.oppositePartyName}
                onChange={(e) => setFormData({ ...formData, oppositePartyName: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white"
                placeholder="Enter name or company name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Incident Description</label>
              <textarea
                value={formData.incidentDescription}
                onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white min-h-[120px]"
                placeholder="Describe what happened, when, and any relevant details..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Contract/Proof Upload (Optional)</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, contractFile: e.target.files?.[0] || null })}
                  className="hidden"
                  id="contract-upload"
                />
                <label htmlFor="contract-upload" className="cursor-pointer text-blue-400 hover:text-blue-300">
                  Click to upload or drag and drop
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Your Address</label>
              <textarea
                value={formData.yourAddress}
                onChange={(e) => setFormData({ ...formData, yourAddress: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white min-h-[80px]"
                placeholder="Your full address"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Their Address</label>
              <textarea
                value={formData.theirAddress}
                onChange={(e) => setFormData({ ...formData, theirAddress: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white min-h-[80px]"
                placeholder="Opposite party's address"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Desired Outcome</label>
              <textarea
                value={formData.desiredOutcome}
                onChange={(e) => setFormData({ ...formData, desiredOutcome: e.target.value })}
                className="w-full px-4 py-3 bg-[#0b1020] border border-white/10 rounded-lg text-white min-h-[80px]"
                placeholder="What do you want them to do? (e.g., Pay ₹50,000 within 7 days)"
              />
            </div>
            <Button
              onClick={handleGenerateNotice}
              disabled={isGenerating || !formData.noticeType || !formData.oppositePartyName}
              className="w-full cta-primary py-6 text-lg font-bold"
            >
              {isGenerating ? (
                <>Generating Notice... <Bot className="ml-2 h-5 w-5 animate-spin" /></>
              ) : (
                <>Generate Notice With AI <Bot className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Output Preview */}
      {draftNotice && (
        <Dialog open={!!draftNotice} onOpenChange={() => setDraftNotice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Your Draft Notice is Ready</DialogTitle>
            </DialogHeader>
            <div className="mt-4 card p-6 bg-white text-black rounded-lg">
              <pre className="whitespace-pre-wrap font-serif text-sm">{draftNotice}</pre>
            </div>
            <div className="flex gap-4 mt-6">
              <Button className="flex-1 cta-primary py-4">
                Continue to Lawyer Verification <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={() => setDraftNotice(null)}>
                Edit & Regenerate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Section */}
      <section className="container mx-auto px-6 py-16 bg-card rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-gray-400 mb-12">Pay once, get lawyer-verified notice</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="card p-8 rounded-xl border-2 border-blue-500/30">
            <h3 className="text-2xl font-bold mb-4">Standard Notice</h3>
            <div className="text-4xl font-extrabold mb-4">₹499</div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> AI Draft</li>
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Lawyer Review</li>
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Email Delivery</li>
            </ul>
            <Button className="w-full cta-secondary py-4">Pay ₹499</Button>
          </div>
          <div className="card p-8 rounded-xl border-2 border-yellow-500/50">
            <div className="bg-yellow-500/10 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">POPULAR</div>
            <h3 className="text-2xl font-bold mb-4">Premium Notice</h3>
            <div className="text-4xl font-extrabold mb-4">₹999</div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> AI Draft</li>
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Lawyer Review</li>
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Email + Speed Post</li>
              <li className="flex items-center"><Check className="h-5 w-5 text-green-400 mr-2" /> Priority Processing</li>
            </ul>
            <Button className="w-full cta-primary py-4">Pay ₹999</Button>
          </div>
        </div>
        <div className="text-center mt-8 text-gray-400 text-sm">
          After payment: Lawyer receives draft → Makes edits → Approves → Notice is sent → You receive tracking details
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Success Stories</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { text: "I recovered ₹42,000 from a brand using this AI-generated notice.", author: "Influencer", rating: 5 },
            { text: "Vendor released my payment within 48 hours.", author: "SME Owner", rating: 5 },
            { text: "Quick and affordable. Saved me ₹8,000 in lawyer fees.", author: "Freelancer", rating: 5 },
          ].map((testimonial, idx) => (
            <div key={idx} className="card p-6 rounded-xl">
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
              <p className="text-sm text-gray-400">— {testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 py-16 bg-card rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { q: "Is this legally valid?", a: "Yes. Lawyer-reviewed notices carry full legal weight and can be used in court proceedings." },
            { q: "Is AI drafting safe?", a: "All data is encrypted & stored securely. Your information is never shared with third parties." },
            { q: "How soon will the notice be sent?", a: "Within 12–24 hours after lawyer review and approval." },
            { q: "What if I need changes to the draft?", a: "You can request edits before payment, or the lawyer will make necessary corrections during review." },
            { q: "Can I track the notice delivery?", a: "Yes, you'll receive tracking details via email and can monitor status in your dashboard." },
          ].map((faq, idx) => (
            <div key={idx} className="card p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <HelpCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-300">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Send a Legal Notice?</h2>
        <p className="text-xl text-gray-300 mb-8">Let AI draft it. Let lawyers send it.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setShowForm(true)} className="cta-primary px-8 py-6 text-lg font-bold">
            Draft Legal Notice Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <a 
            href="https://wa.me/919205376316?text=Hi%20NoticeBazaar,%20I%20need%20legal%20assistance" 
            target="_blank" 
            rel="noopener"
            className="cta-secondary px-8 py-6 text-lg font-bold rounded-lg inline-flex items-center justify-center"
          >
            Get WhatsApp Legal Assistance <MessageSquare className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default LegalNoticeAI;

