"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Instagram } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/navbar/Navbar';
import ContentAnalytics from '@/components/creator-dashboard/ContentAnalytics';

const CreatorAnalyticsPage: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-[#0A0F1A]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-dashboard')}
              className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Analytics Content */}
          <ContentAnalytics />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreatorAnalyticsPage;
