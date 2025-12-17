"use client";

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');
  const { profile } = useSession();

  const features = [
    'Unlimited consumer complaints',
    'Faster resolutions',
    'Priority support',
    'Full Lifestyle Shield protection',
    'Unlimited AI contract scans',
    'Lawyer contract review and drafting',
    '24-hour legal notice delivery',
    'Defamation support',
    'Full payment recovery support',
  ];

  const handleUpgrade = () => {
    // Navigate to creator profile billing tab
    navigate('/creator-profile?tab=billing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A] p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-emerald-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Upgrade to Creator Pro
            </h1>
          </div>
          {source === 'consumer-complaints' && (
            <p className="text-white/70 text-lg">
              Lifestyle Shield is a Creator Pro benefit
            </p>
          )}
        </div>

        {/* Main Card */}
        <Card variant="default" className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              What you'll get with Creator Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={handleUpgrade}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg"
          >
            Upgrade to Creator Pro
          </Button>
          <p className="text-white/60 text-sm mt-4">
            Starting at ₹2,999/month
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;




