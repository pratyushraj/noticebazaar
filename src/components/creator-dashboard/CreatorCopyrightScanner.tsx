"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CreatorCopyrightScanner: React.FC = () => {
  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Copyright Scanner</CardTitle>
        <ShieldCheck className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Run a deep scan across major platforms (YouTube, Instagram, TikTok) to find unauthorized reposts of your content.
        </p>
        <div className="relative flex items-center mb-4">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Scan for Reposts" className="pl-9 bg-input text-foreground border-border" />
        </div>
        <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Start Copyright Scan <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">Last scan found 2 alerts.</p>
      </CardContent>
    </Card>
  );
};

export default CreatorCopyrightScanner;