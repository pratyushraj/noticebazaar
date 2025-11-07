"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Import CardFooter
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck, ArrowRight, Youtube, Instagram, Globe, Facebook, Loader2, AlertTriangle } from 'lucide-react'; // Replaced Tiktok with Globe, added Loader2, AlertTriangle
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';
import { usePerformCopyrightScan } from '@/lib/hooks/usePerformCopyrightScan'; // Import the new hook
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { Label } from '@/components/ui/label'; // Import Label

const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Other Web'];

const CreatorCopyrightScanner: React.FC = () => {
  const [scanQuery, setScanQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [lastScanResults, setLastScanResults] = useState<any[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const performCopyrightScanMutation = usePerformCopyrightScan();

  useEffect(() => {
    if (performCopyrightScanMutation.isSuccess) {
      setLastScanResults(performCopyrightScanMutation.data?.alerts || []);
      setLastScanTime(new Date().toLocaleString());
      toast.success('Copyright scan completed!');
    }
    if (performCopyrightScanMutation.isError) {
      toast.error('Copyright scan failed', { description: performCopyrightScanMutation.error?.message });
    }
  }, [performCopyrightScanMutation.isSuccess, performCopyrightScanMutation.isError, performCopyrightScanMutation.data]);

  const handlePerformScan = async () => {
    if (!scanQuery.trim()) {
      toast.error('Please enter a query for the scan.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform to scan.');
      return;
    }
    try {
      await performCopyrightScanMutation.mutateAsync({ query: scanQuery.trim(), platforms: selectedPlatforms });
    } catch (error) {
      // Error handled by useSupabaseMutation
    }
  };

  return (
    <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between min-h-[200px]"> {/* Applied new base card class */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0"> {/* Minimal padding */}
        <CardTitle className="text-sm font-medium text-muted-foreground">Copyright Scanner</CardTitle>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">IP Protection</Badge> {/* Purple protection label */}
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-grow"> {/* Minimal padding, added flex-grow */}
        <p className="text-sm text-muted-foreground mb-4">
          Run a deep scan across major platforms to find unauthorized reposts of your content.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="scanQuery">Content Identifier (e.g., video title, image description)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="scanQuery"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="e.g., 'My latest vlog on Goa' or 'Brand X Campaign Photo'"
                className="pl-9"
                disabled={performCopyrightScanMutation.isPending}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="platforms">Platforms to Scan</Label>
            <Select
              onValueChange={(value) => setSelectedPlatforms(value.split(','))}
              value={selectedPlatforms.join(',')}
              disabled={performCopyrightScanMutation.isPending}
              multiple // Enable multiple selection
            >
              <SelectTrigger id="platforms">
                <SelectValue placeholder="Select platforms" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((platform) => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple platforms.</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 my-4"> {/* Platform icons */}
          <Youtube className="h-6 w-6 text-red-500" />
          <Instagram className="h-6 w-6 text-pink-500" />
          <Globe className="h-6 w-6 text-gray-400" /> {/* Replaced Tiktok with Globe */}
          <Facebook className="h-6 w-6 text-blue-600" />
        </div>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-4 flex flex-col items-start"> {/* Added CardFooter, flex-col, items-start */}
        <Button
          onClick={handlePerformScan}
          disabled={!scanQuery.trim() || selectedPlatforms.length === 0 || performCopyrightScanMutation.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {performCopyrightScanMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Start Copyright Scan
            </>
          )}
        </Button>
        {lastScanTime && (
          <p className="text-sm text-muted-foreground mt-2 w-full text-center">
            Last scan: {lastScanTime} - Found {lastScanResults.length} alerts.
          </p>
        )}
        {lastScanResults.length > 0 && (
          <div className="mt-4 w-full space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" /> Recent Alerts:
            </p>
            <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
              {lastScanResults.map((alert, index) => (
                <li key={alert.id || index}>
                  {alert.description} on {alert.platform}
                  {alert.infringingUrl && (
                    <a href={alert.infringingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      (View)
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreatorCopyrightScanner;