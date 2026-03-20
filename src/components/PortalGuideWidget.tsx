"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Briefcase, ArrowRight, Check } from 'lucide-react';

const PortalGuideWidget = () => {
  return (
    <Card className="bg-card shadow-lg rounded-xl border border-border overflow-hidden col-span-full">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-2xl font-bold text-foreground">Your Secure Client Portal</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <p className="text-muted-foreground text-lg">
            Everything you need to manage your legal and financial compliance is here. Use the portal to:
          </p>
          <ul className="space-y-2 text-foreground">
            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Track real-time case progress.</li>
            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Securely upload and manage documents.</li>
            <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Chat directly with your dedicated advisor.</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/client-documents">
                <FileText className="h-4 w-4 mr-2" /> Go to Secure Vault
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-primary border-border hover:bg-accent">
              <Link to="/messages">
                <MessageSquare className="h-4 w-4 mr-2" /> Chat Now
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-center lg:justify-end">
          <img 
            src="/Pixel-True-Mockup-(1).png" 
            alt="Client Portal Dashboard Preview" 
            className="rounded-lg shadow-xl max-h-80 w-auto object-contain border border-border"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PortalGuideWidget;