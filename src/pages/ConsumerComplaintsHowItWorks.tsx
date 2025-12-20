// Public informational page: How Consumer Complaints Work on CreatorArmour
// Route: /consumer-complaints/how-it-works
// Audience: Creators, general consumers, non-lawyers

import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Scale, CheckCircle, ArrowRight, Shield, 
  FileCheck, UserCheck, Lock, MessageSquare, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ConsumerComplaintsHowItWorks() {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Submit Your Complaint',
      description: 'Fill out a simple form with your issue details, company name, amount involved, and upload any proof documents.',
      details: 'We support complaints against e-commerce platforms (Amazon, Flipkart), food delivery services (Swiggy, Zomato), travel services (Airlines, IRCTC), and offline service providers.',
      icon: FileText,
    },
    {
      number: 2,
      title: 'Optional Legal Support (Free – Pilot)',
      description: 'Choose from two optional services to strengthen your complaint:',
      options: [
        {
          label: 'Lawyer Review',
          description: 'A legal advisor will review your complaint and suggest improvements before you file.',
          badge: 'Free during pilot',
        },
        {
          label: 'Legal Notice Drafting',
          description: 'We\'ll draft a formal legal notice you can send to the company.',
          badge: 'Free during pilot',
        },
      ],
      icon: Scale,
    },
    {
      number: 3,
      title: 'Review & Preparation',
      description: 'Our legal team reviews your complaint or drafts the necessary documents. This process ensures your complaint is clear, complete, and legally sound.',
      details: 'No court filing happens automatically. You maintain full control over the process.',
      icon: CheckCircle,
    },
    {
      number: 4,
      title: 'You Decide What\'s Next',
      description: 'Once your complaint is ready, you can:',
      options: [
        'Send the legal notice to the company',
        'Approach consumer forum with your prepared documents',
        'Use the draft independently for your own filing',
      ],
      icon: ArrowRight,
    },
  ];

  const doesList = [
    {
      icon: FileText,
      title: 'Drafting Support',
      description: 'Help you prepare clear, professional complaint documents',
    },
    {
      icon: Scale,
      title: 'Legal Review',
      description: 'Review your complaint for completeness and legal soundness',
    },
    {
      icon: FileCheck,
      title: 'Document Preparation',
      description: 'Prepare legal notices and complaint drafts',
    },
    {
      icon: Shield,
      title: 'Secure Document Storage',
      description: 'Safely store your complaint documents and proof files',
    },
  ];

  const doesNotList = [
    'File cases on your behalf',
    'Represent you in court',
    'Guarantee specific outcomes',
    'Act as your legal counsel (unless explicitly agreed)',
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Resolve Consumer Issues, the Right Way
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            CreatorArmour helps you draft and review consumer complaints before you take any formal legal step.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {/* Step-by-Step Flow */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card
                key={step.number}
                className="bg-white/5 backdrop-blur-md border-white/10 overflow-hidden"
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex gap-6">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <step.icon className="w-6 h-6 text-purple-300 flex-shrink-0 mt-1" />
                        <h3 className="text-xl font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      
                      <p className="text-white/80 mb-4">
                        {step.description}
                      </p>

                      {step.details && (
                        <p className="text-white/60 text-sm mb-4">
                          {step.details}
                        </p>
                      )}

                      {step.options && (
                        <div className="space-y-3 mt-4">
                          {step.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="bg-white/5 rounded-lg p-4 border border-white/10"
                            >
                              {typeof option === 'string' ? (
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-white/80">{option}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-white">{option.label}</span>
                                    {option.badge && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                                        {option.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/70 text-sm">{option.description}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What CreatorArmour Does */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            What CreatorArmour Does
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {doesList.map((item, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-md border-white/10"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-white/70 text-sm">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What CreatorArmour Does NOT Do */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            What CreatorArmour Does Not Do
          </h2>
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-6 md:p-8">
              <ul className="space-y-3">
                {doesNotList.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Trust & Safety */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            Trust & Safety
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Lock className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Private Documents</h3>
                <p className="text-white/70 text-sm">
                  All your complaint documents and proof files are stored securely and privately.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <UserCheck className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Verified Lawyers</h3>
                <p className="text-white/70 text-sm">
                  Our legal review team consists of verified legal professionals.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">You Stay in Control</h3>
                <p className="text-white/70 text-sm">
                  You decide when and how to proceed with your complaint.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-md border-purple-400/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Submit your consumer complaint and get professional legal support to strengthen your case.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/lifestyle/consumer-complaints')}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-lg"
                >
                  Raise a Consumer Complaint
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/lawyer-dashboard')}
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Talk to a Lawyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

