"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Import CardFooter
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck, ArrowRight, Youtube, Instagram, Tiktok, Facebook } from 'lucide-react'; // Import platform icons
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';

const CreatorCopyrightScanner: React.FC = () => {
  return (
    <Card className="bg-card shadow-sm border border-border p-6 flex flex-col justify-between min-h-[200px]"> {/* Added padding, flex-col, min-h */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0"> {/* Minimal padding */}
        <CardTitle className="text-sm font-medium text-muted-foreground">Copyright Scanner</CardTitle>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">IP Protection</Badge> {/* Purple protection label */}
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-grow"> {/* Minimal padding, added flex-grow */}
        <p className="text-sm text-muted-foreground mb-4">
          Run a deep scan across major platforms (YouTube, Instagram, TikTok) to find unauthorized reposts of your content.
        </p>
        <div className="relative flex items-center mb-4">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Scan for Reposts" className="pl-9 bg-input text-foreground border-border" />
        </div>
        <div className="flex items-center justify-center gap-4 mb-4"> {/* Platform icons */}
          <Youtube className="h-6 w-6 text-red-500" />
          <Instagram className="h-6 w-6 text-pink-500" />
          <Tiktok className="h-6 w-6 text-black dark:text-white" /> {/* TikTok icon might need dark/light mode adjustment */}
          <Facebook className="h-6 w-6 text-blue-600" />
        </div>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-4"> {/* Added CardFooter */}
        <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Start Copyright Scan <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Badge variant="outline" className="mt-2 w-full justify-center bg-secondary text-muted-foreground border-border">Last scan found: 2 alerts.</Badge> {/* Last scan badge */}
      </CardFooter>
    </Card>
  );
};

export default CreatorCopyrightScanner;