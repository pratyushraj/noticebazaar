"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Youtube, Instagram, Globe, Facebook, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePerformCopyrightScan } from '@/lib/hooks/usePerformCopyrightScan';

type Platform = 'Instagram' | 'YouTube' | 'TikTok' | 'Facebook' | 'Web';

interface AICopyrightScannerCardProps {
  onScanStart?: () => void;
  onScanComplete?: (results: any[]) => void;
}

const PLATFORMS: { value: Platform; label: string; icon: React.ElementType }[] = [
  { value: 'Instagram', label: 'Instagram', icon: Instagram },
  { value: 'YouTube', label: 'YouTube', icon: Youtube },
  { value: 'TikTok', label: 'TikTok', icon: Globe },
  { value: 'Facebook', label: 'Facebook', icon: Facebook },
  { value: 'Web', label: 'Web', icon: Globe },
];

const AICopyrightScannerCard: React.FC<AICopyrightScannerCardProps> = ({
  onScanStart,
  onScanComplete,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('Instagram');
  const [scanQuery, setScanQuery] = useState('');
  const [monitorAutomatically, setMonitorAutomatically] = useState(false);
  
  const performCopyrightScanMutation = usePerformCopyrightScan();

  const handleStartScan = async () => {
    if (!scanQuery.trim()) {
      toast.error('Please enter a URL or text to scan');
      return;
    }

    if (onScanStart) {
      onScanStart();
    }

    try {
      const result = await performCopyrightScanMutation.mutateAsync({
        query: scanQuery.trim(),
        platforms: [selectedPlatform],
        options: {
          includeScreenshotSimilarity: true,
          includeAudioFingerprinting: true,
          scanFullWeb: selectedPlatform === 'Web',
        },
      });

      if (onScanComplete && result.alerts) {
        onScanComplete(result.alerts);
      }

      toast.success('Scan completed! Found matches.');
    } catch (error: any) {
      toast.error('Scan failed', { description: error.message });
    }
  };

  const isScanning = performCopyrightScanMutation.isPending;
  const PlatformIcon = PLATFORMS.find(p => p.value === selectedPlatform)?.icon || Search;

  return (
    <Card className="creator-card-base shadow-sm p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="absolute inset-0 rounded-full opacity-30 blur-sm bg-purple-500"></span>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">AI Copyright Scanner</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-4">
        {/* Platform Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="platform" className="text-sm font-medium text-foreground">
            Platform
          </Label>
          <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
            <SelectTrigger id="platform" className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <PlatformIcon className="h-4 w-4" />
                  <span>{PLATFORMS.find(p => p.value === selectedPlatform)?.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{platform.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* URL/Text Input */}
        <div className="space-y-2">
          <Label htmlFor="scan-input" className="text-sm font-medium text-foreground">
            URL or Text
          </Label>
          <Input
            id="scan-input"
            placeholder="Paste content URL or describe your content..."
            value={scanQuery}
            onChange={(e) => setScanQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isScanning) {
                handleStartScan();
              }
            }}
            disabled={isScanning}
            className="w-full"
          />
        </div>

        {/* Monitor Automatically Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="monitor-auto"
            checked={monitorAutomatically}
            onCheckedChange={(checked) => setMonitorAutomatically(checked === true)}
            disabled={isScanning}
          />
          <Label
            htmlFor="monitor-auto"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Monitor automatically <span className="text-xs text-muted-foreground">(coming soon)</span>
          </Label>
        </div>

        {/* Start Scan Button */}
        <Button
          onClick={handleStartScan}
          disabled={isScanning || !scanQuery.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>

        {/* Status Message */}
        {isScanning && (
          <div className="text-xs text-center text-muted-foreground animate-pulse">
            Searching {selectedPlatform} for copyright matches...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICopyrightScannerCard;
