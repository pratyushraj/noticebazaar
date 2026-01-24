"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertCircle, FileText, Clock } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <Button 
          asChild 
          className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
          </Link>
        </Button>
        
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              Why CreatorArmour Exists
            </h1>
            <p className="text-lg text-purple-200 max-w-2xl mx-auto">
              A simple explanation of the problems creators face and how we're trying to help.
            </p>
          </header>

          {/* Section 1: Why We Exist */}
          <section className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 space-y-4">
            <h2 className="text-2xl font-bold text-white">Why CreatorArmour Exists</h2>
            <p className="text-purple-100 leading-relaxed">
              Here's the thing: being a creator in India is hard. Not because creating content is hard—you're already doing that. But because the business side of being a creator is broken.
            </p>
            <p className="text-purple-100 leading-relaxed">
              Most creators we talk to are brilliant at making content, but they're not lawyers or accountants. Yet they're expected to negotiate contracts, chase payments, file taxes, and protect their rights—all while trying to grow their audience and create great content.
            </p>
            <p className="text-purple-100 leading-relaxed">
              That's why we built CreatorArmour. Not because we think creators are doing something wrong, but because the system isn't built for them. We're here to handle the stuff that shouldn't be your problem.
            </p>
          </section>

          {/* Section 2: Common Problems */}
          <section className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-purple-300" />
              Common Creator Problems in India
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">1. No Contracts, No Protection</h3>
                <p className="text-purple-100 leading-relaxed">
                  Many brand deals happen over WhatsApp or email. No formal contract. No clear terms. When something goes wrong—and it often does—you have nothing to fall back on. Brands can change requirements, delay payments, or refuse to pay entirely, and you're left with no legal recourse.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">2. Payment Delays Are Normalized</h3>
                <p className="text-purple-100 leading-relaxed">
                  "Payment in 30-45 days" has become standard. Sometimes it's 60 days. Sometimes it's never. Brands know most creators won't fight back because they don't have the time, money, or legal knowledge to pursue it. So they delay, hoping you'll give up.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">3. Unfair Contract Terms</h3>
                <p className="text-purple-100 leading-relaxed">
                  When contracts do exist, they're usually written by brands to protect brands. Unlimited usage rights. No late payment penalties. Vague deliverables. Exclusivity clauses that lock you out of other opportunities. You sign because you need the work, but you're signing away your rights.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">4. Tax Confusion</h3>
                <p className="text-purple-100 leading-relaxed">
                  GST registration? TDS deductions? Income tax filing? Most creators don't know where to start. They either ignore it (risky) or pay someone expensive to figure it out. There's no clear guidance for creators specifically.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">5. No One to Turn To</h3>
                <p className="text-purple-100 leading-relaxed">
                  When a brand doesn't pay or breaks a contract, who do you call? A lawyer? That costs ₹5,000-10,000 just for a consultation. Most creators can't afford that. So they either give up or try to handle it themselves, which rarely works.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How Contracts + Audit Trail Help */}
          <section className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-purple-300" />
              How Contracts + Audit Trail Protect Creators
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Contracts Create Clarity</h3>
                <p className="text-purple-100 leading-relaxed">
                  A proper contract isn't about being difficult—it's about being clear. It says exactly what you'll deliver, when you'll deliver it, how much you'll get paid, and when you'll get paid. No ambiguity. No "we'll figure it out later." Both sides know what to expect.
                </p>
                <p className="text-purple-100 leading-relaxed">
                  When everything is written down, there's no room for "I thought we agreed..." or "That's not what I meant." It protects both you and the brand by making expectations explicit.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Contracts Give You Leverage</h3>
                <p className="text-purple-100 leading-relaxed">
                  Here's the honest truth: brands are more likely to pay when they know you have legal options. A contract with late payment penalties, clear payment terms, and dispute resolution clauses shows you're serious. Most brands will pay on time just to avoid the hassle.
                </p>
                <p className="text-purple-100 leading-relaxed">
                  If they don't pay, you're not starting from zero. You have a signed document that says they owe you money. That's powerful.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Audit Trail = Proof</h3>
                <p className="text-purple-100 leading-relaxed">
                  An audit trail is just a fancy way of saying "we keep records of everything." Every message, every email, every contract, every payment—it's all saved and timestamped. If a brand says "we never agreed to that" or "we already paid," you can show them exactly when and how it happened.
                </p>
                <p className="text-purple-100 leading-relaxed">
                  This isn't about being paranoid. It's about having proof when you need it. In India, consumer complaints and legal notices require evidence. An audit trail gives you that evidence.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">It Makes Recovery Possible</h3>
                <p className="text-purple-100 leading-relaxed">
                  Without a contract and audit trail, recovering unpaid money is nearly impossible. With them, you can send a legal notice. You can file a consumer complaint. You can take legal action if needed. You have options.
                </p>
                <p className="text-purple-100 leading-relaxed">
                  Most creators never get to this point because they don't have the documents. We make sure you do.
                </p>
              </div>
            </div>
          </section>

          {/* Closing */}
          <section className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-8 rounded-xl border border-purple-400/30 space-y-4">
            <h2 className="text-2xl font-bold text-white">The Bottom Line</h2>
            <p className="text-purple-100 leading-relaxed">
              CreatorArmour exists because creators shouldn't have to be lawyers, accountants, and debt collectors just to get paid fairly. You should be able to focus on creating content, and we'll handle the rest.
            </p>
            <p className="text-purple-100 leading-relaxed">
              We're not here to sell you anything complicated. We're here to give you the tools and support you need to protect yourself—contracts, payment tracking, legal notices when needed, and someone to call when things go wrong.
            </p>
            <div className="pt-4">
              <Button 
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
