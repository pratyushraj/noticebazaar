"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Youtube, Instagram, Globe, Facebook, Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePerformCopyrightScan } from '@/lib/hooks/usePerformCopyrightScan';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface PlatformOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  { id: 'Instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'YouTube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'TikTok', name: 'TikTok', icon: Globe, color: 'text-black dark:text-white' },
  { id: 'Facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'Other Web', name: 'Web', icon: Globe, color: 'text-gray-500' },
];

interface ScanStatus {
  message: string;
  platform?: string;
}

const CreatorCopyrightScanner: React.FC = () => {
  const [scanQuery, setScanQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [lastScanResults, setLastScanResults] = useState<any[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    includeScreenshotSimilarity: false,
    includeAudioFingerprinting: false,
    scanFullWeb: false,
  });
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);

  const performCopyrightScanMutation = usePerformCopyrightScan();

  // Simulate status updates during scan
  useEffect(() => {
    if (performCopyrightScanMutation.isPending) {
      const statuses: ScanStatus[] = [
        { message: 'Scanning Instagram...', platform: 'Instagram' },
        { message: 'Scanning YouTube...', platform: 'YouTube' },
        { message: 'Scanning TikTok...', platform: 'TikTok' },
        { message: 'Fetching similar posts...' },
        { message: 'Comparing frames...' },
        { message: 'Running AI match...' },
        { message: 'Uploading evidence...' },
      ];

      let currentIndex = 0;
      setScanStatus(statuses[currentIndex]);

      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % statuses.length;
        setScanStatus(statuses[currentIndex]);
      }, 2000);

      return () => {
        clearInterval(interval);
        setScanStatus(null);
      };
    } else {
      setScanStatus(null);
    }
  }, [performCopyrightScanMutation.isPending]);

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

  const togglePlatform = (platformId: string) => {
    if (performCopyrightScanMutation.isPending) return;
    
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const handlePerformScan = async () => {
    if (!scanQuery.trim()) {
      toast.error('Please enter a content link or description.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform to scan.');
      return;
    }
    try {
      await performCopyrightScanMutation.mutateAsync({ 
        query: scanQuery.trim(), 
        platforms: selectedPlatforms 
      });
    } catch (error) {
      // Error handled by useSupabaseMutation
    }
  };

  // Categorize results by confidence level
  const categorizeResults = (results: any[]) => {
    const highConfidence = results.filter(r => (r.similarity_score || 0) >= 0.9);
    const possibleReposts = results.filter(r => (r.similarity_score || 0) >= 0.6 && (r.similarity_score || 0) < 0.9);
    const noMatch = results.filter(r => (r.similarity_score || 0) < 0.6);
    return { highConfidence, possibleReposts, noMatch };
  };

  const { highConfidence, possibleReposts, noMatch } = categorizeResults(lastScanResults);

  return (
    <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between min-h-[200px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Copyright Scanner</CardTitle>
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">IP Protection</Badge>
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-grow">
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          We scan the internet to detect reposts of your videos using AI image matching and platform search APIs.
        </p>

        <div className="space-y-4">
          {/* Content Input */}
          <div>
            <Label htmlFor="scanQuery">What content do you want to scan?</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="scanQuery"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="Paste your original post link (IG post, YT video, TikTok link) or enter title/description"
                className="pl-9"
                disabled={performCopyrightScanMutation.isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter video link / title / description
            </p>
          </div>

          {/* Platform Selection - Icon-based */}
          <div>
            <Label>Scan Platforms</Label>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {PLATFORM_OPTIONS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    disabled={performCopyrightScanMutation.isPending}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      "hover:scale-105 active:scale-95",
                      isSelected
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                        : "bg-background border-border hover:border-primary/50",
                      performCopyrightScanMutation.isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", platform.color, isSelected && "scale-110")} />
                    <span className="text-sm font-medium">{platform.name}</span>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              disabled={performCopyrightScanMutation.isPending}
            >
              <span>Advanced Options</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {isAdvancedOpen && (
              <div className="space-y-3 pt-2 pl-2 border-l-2 border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="screenshot-similarity"
                    checked={advancedOptions.includeScreenshotSimilarity}
                    onCheckedChange={(checked) =>
                      setAdvancedOptions(prev => ({ ...prev, includeScreenshotSimilarity: checked as boolean }))
                    }
                    disabled={performCopyrightScanMutation.isPending}
                  />
                  <Label htmlFor="screenshot-similarity" className="text-sm font-normal cursor-pointer">
                    Include screenshot similarity
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audio-fingerprinting"
                    checked={advancedOptions.includeAudioFingerprinting}
                    onCheckedChange={(checked) =>
                      setAdvancedOptions(prev => ({ ...prev, includeAudioFingerprinting: checked as boolean }))
                    }
                    disabled={performCopyrightScanMutation.isPending}
                  />
                  <Label htmlFor="audio-fingerprinting" className="text-sm font-normal cursor-pointer">
                    Include audio fingerprinting
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scan-full-web"
                    checked={advancedOptions.scanFullWeb}
                    onCheckedChange={(checked) =>
                      setAdvancedOptions(prev => ({ ...prev, scanFullWeb: checked as boolean }))
                    }
                    disabled={performCopyrightScanMutation.isPending}
                  />
                  <Label htmlFor="scan-full-web" className="text-sm font-normal cursor-pointer">
                    Scan full web (slower)
                  </Label>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-4 flex flex-col items-start">
        {/* Status Indicator */}
        {scanStatus && (
          <div className="w-full mb-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-primary font-medium">{scanStatus.message}</span>
            </div>
          </div>
        )}

        {/* Scan Button */}
        <Button
          onClick={handlePerformScan}
          disabled={!scanQuery.trim() || selectedPlatforms.length === 0 || performCopyrightScanMutation.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {performCopyrightScanMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {scanStatus?.message || 'Scanning...'}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Start Copyright Scan
            </>
          )}
        </Button>

        {/* Last Scan Info */}
        {lastScanTime && (
          <p className="text-sm text-muted-foreground mt-2 w-full text-center">
            Last scan: {lastScanTime} - Found {lastScanResults.length} matches.
          </p>
        )}

        {/* Results with Confidence Levels */}
        {lastScanResults.length > 0 && (
          <div className="mt-4 w-full space-y-4">
            {/* High Confidence Matches (90-100%) */}
            {highConfidence.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-semibold text-foreground">
                    High Confidence Matches ({highConfidence.length})
                  </p>
                </div>
                <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
                  {highConfidence.map((alert, index) => (
                    <li key={alert.id || index}>
                      {alert.description} on {alert.platform}
                      {alert.infringingUrl && (
                        <a
                          href={alert.infringingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          (View)
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Possible Reposts (60-89%) */}
            {possibleReposts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-semibold text-foreground">
                    Possible Reposts ({possibleReposts.length})
                  </p>
                </div>
                <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
                  {possibleReposts.map((alert, index) => (
                    <li key={alert.id || index}>
                      {alert.description} on {alert.platform}
                      {alert.infringingUrl && (
                        <a
                          href={alert.infringingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          (View)
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No Match (0-59%) */}
            {noMatch.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No Match ({noMatch.length})
                  </p>
                </div>
                <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground space-y-1">
                  {noMatch.map((alert, index) => (
                    <li key={alert.id || index}>
                      {alert.description} on {alert.platform}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default CreatorCopyrightScanner;
