// Public informational page: How Consumer Complaints Work on NoticeBazaar
// Route: /consumer-complaints/how-it-works
// Audience: Creators, general consumers, non-lawyers

import { useNavigate } from 'react-router-dom';
import { 
  FileText, Scale, CheckCircle, ArrowRight, Shield, 
  FileCheck, UserCheck, Lock, MessageSquare, X, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/lifestyle/consumer-complaints')}
            className="mb-6 text-foreground/70 hover:text-foreground hover:bg-secondary/50 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Resolve Consumer Issues, the Right Way
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            NoticeBazaar helps you draft and review consumer complaints before you take any formal legal step.
          </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {/* Step-by-Step Flow */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card
                key={step.number}
                className="bg-card backdrop-blur-md border-border overflow-hidden"
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex gap-6">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-lg">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <step.icon className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                        <h3 className="text-xl font-semibold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      
                      <p className="text-foreground/80 mb-4">
                        {step.description}
                      </p>

                      {step.details && (
                        <p className="text-foreground/60 text-sm mb-4">
                          {step.details}
                        </p>
                      )}

                      {step.options && (
                        <div className="space-y-3 mt-4">
                          {step.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="bg-card rounded-lg p-4 border border-border"
                            >
                              {typeof option === 'string' ? (
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-foreground/80">{option}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-foreground">{option.label}</span>
                                    {option.badge && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-purple-400/30">
                                        {option.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-foreground/70 text-sm">{option.description}</p>
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

        {/* What NoticeBazaar Does */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            What NoticeBazaar Does
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {doesList.map((item, index) => (
              <Card
                key={index}
                className="bg-card backdrop-blur-md border-border"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-foreground/70 text-sm">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What NoticeBazaar Does NOT Do */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            What NoticeBazaar Does Not Do
          </h2>
          <Card className="bg-card backdrop-blur-md border-border">
            <CardContent className="p-6 md:p-8">
              <ul className="space-y-3">
                {doesNotList.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Trust & Safety */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Trust & Safety
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-card backdrop-blur-md border-border">
              <CardContent className="p-6 text-center">
                <Lock className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Private Documents</h3>
                <p className="text-foreground/70 text-sm">
                  All your complaint documents and proof files are stored securely and privately.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card backdrop-blur-md border-border">
              <CardContent className="p-6 text-center">
                <UserCheck className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Verified Lawyers</h3>
                <p className="text-foreground/70 text-sm">
                  Our legal review team consists of verified legal professionals.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card backdrop-blur-md border-border">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">You Stay in Control</h3>
                <p className="text-foreground/70 text-sm">
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
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-foreground/80 mb-6 max-w-xl mx-auto">
                Submit your consumer complaint and get professional legal support to strengthen your case.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/lifestyle/consumer-complaints')}
                  className="bg-secondary hover:bg-secondary text-foreground px-8 py-3 text-lg"
                >
                  Raise a Consumer Complaint
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/lawyer-dashboard')}
                  className="border-border text-foreground hover:bg-secondary/50 px-8 py-3 text-lg"
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
