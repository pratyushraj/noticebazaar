"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, UserCheck, Link, Scale, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { cn } from '@/lib/utils';
import SocialAccountLinkForm from '@/components/forms/SocialAccountLinkForm';
import TaxProfileSetupForm from '@/components/creator-tax/TaxProfileSetupForm';
import { useTaxSettings } from '@/lib/hooks/useTaxSettings';
import { useNavigate } from 'react-router-dom';

const TOTAL_STEPS = 3;

const CreatorOnboardingWizard = () => {
  const { profile, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const updateProfileMutation = useUpdateProfile();
  
  // Fetch tax settings to pre-populate the form in step 3
  const { data: taxSettings, isLoading: isLoadingSettings, refetch: refetchTaxSettings } = useTaxSettings({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate('/creator-dashboard', { replace: true });
    }
  }, [profile, navigate]);

  const handleStepCompletion = (nextStep: number) => {
    setStep(nextStep);
    window.scrollTo(0, 0);
  };

  const handleOnboardingComplete = async () => {
    if (!profile?.id) return;

    try {
      // Final step: Mark onboarding as complete
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || null,
        onboarding_complete: true,
      });
      toast.success('Onboarding complete! Welcome to your dashboard.');
      refetchProfile(); // Ensure session context updates
      navigate('/creator-dashboard', { replace: true });
    } catch (error: any) {
      toast.error('Failed to finalize onboarding', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingSettings || !profile) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const progress = Math.min(Math.floor(((step - 1) / TOTAL_STEPS) * 100), 100);

  const StepIndicator = ({ stepNum, title, Icon }: { stepNum: number, title: string, Icon: React.ElementType }) => (
    <div className="flex flex-col items-center">
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
        stepNum <= step ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
      )}>
        {stepNum < step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <span className={cn("text-sm mt-2 text-center hidden sm:block", stepNum <= step ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {title}
      </span>
    </div>
  );

  return (
    <Card className="max-w-3xl mx-auto bg-card shadow-lg border border-border">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-2xl font-bold text-foreground">Creator Onboarding Wizard</CardTitle>
        <p className="text-muted-foreground">Complete these {TOTAL_STEPS} steps to activate your full legal protection suite.</p>
      </CardHeader>
      <CardContent className="p-6">
        
        {/* Progress Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between px-4">
            <StepIndicator stepNum={1} title="Welcome & Personal" Icon={UserCheck} />
            <div className="flex-1 h-0.5 bg-border mt-5" />
            <StepIndicator stepNum={2} title="Link Socials" Icon={Link} />
            <div className="flex-1 h-0.5 bg-border mt-5" />
            <StepIndicator stepNum={3} title="Business & Tax" Icon={Scale} />
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary">Step 1: Welcome, {profile.first_name}!</h3>
            <p className="text-muted-foreground">
              We need a few details to tailor your legal protection, ensure tax compliance, and enable features like payment recovery and copyright scanning. This information is kept strictly confidential.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Takes less than 5 minutes.</li>
              <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Activates your full dashboard features.</li>
            </ul>
            <div className="flex justify-end">
              <Button onClick={() => handleStepCompletion(2)}>
                Start Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Social Links */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary">Step 2: Link Social Accounts</h3>
            <p className="text-muted-foreground">
              Linking your main platforms allows us to monitor for copyright infringement and track brand deal performance.
            </p>
            <SocialAccountLinkForm
              initialData={profile}
              onSaveSuccess={() => handleStepCompletion(3)}
              onClose={() => {}} // No close button in wizard flow
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => handleStepCompletion(3)} variant="secondary">
                Skip for Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Business & Tax Setup */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-primary">Step 3: Business & Tax Setup</h3>
            <p className="text-muted-foreground">
              Provide your business entity details and estimated tax rates. This is crucial for accurate compliance tracking and tax filing support.
            </p>
            <TaxProfileSetupForm
              initialProfile={profile}
              initialTaxSettings={taxSettings}
              onSaveSuccess={() => handleStepCompletion(4)}
              onClose={() => {}} // No close button in wizard flow
            />
            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="space-y-6 text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-foreground">Setup Complete!</h3>
            <p className="text-lg text-muted-foreground">
              You are all set. Click below to access your personalized Creator Dashboard.
            </p>
            <Button onClick={handleOnboardingComplete} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatorOnboardingWizard;