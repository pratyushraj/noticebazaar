"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Youtube, Instagram, Globe, Facebook, Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Link2, ExternalLink, Image as ImageIcon, LayoutDashboard, IndianRupee, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [isMobile, setIsMobile] = useState(false);
  const [openHigh, setOpenHigh] = useState(true);
  const [openPossible, setOpenPossible] = useState(true);
  const [openNoMatch, setOpenNoMatch] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    includeScreenshotSimilarity: false,
    includeAudioFingerprinting: false,
    scanFullWeb: false,
  });
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [platformScanStatus, setPlatformScanStatus] = useState<Record<string, 'scanning' | 'scanned' | 'not-scanned'>>({});
  const [platformMatchCounts, setPlatformMatchCounts] = useState<Record<string, number>>({});

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
      const alerts = performCopyrightScanMutation.data?.alerts || [];
      setLastScanResults(alerts);
      setLastScanTime(new Date().toLocaleString());
      
      // Update platform scan status
      const newStatus: Record<string, 'scanning' | 'scanned' | 'not-scanned'> = {};
      const newCounts: Record<string, number> = {};
      
      selectedPlatforms.forEach(platform => {
        newStatus[platform] = 'scanned';
        newCounts[platform] = alerts.filter(a => a.platform === platform).length;
      });
      
      setPlatformScanStatus(newStatus);
      setPlatformMatchCounts(newCounts);
      
      toast.success('Copyright scan completed!');
    }
    if (performCopyrightScanMutation.isError) {
      toast.error('Copyright scan failed', { description: performCopyrightScanMutation.error?.message });
    }
  }, [performCopyrightScanMutation.isSuccess, performCopyrightScanMutation.isError, performCopyrightScanMutation.data, selectedPlatforms]);

  // Update platform status during scanning
  useEffect(() => {
    if (performCopyrightScanMutation.isPending) {
      const newStatus: Record<string, 'scanning' | 'scanned' | 'not-scanned'> = {};
      selectedPlatforms.forEach(platform => {
        newStatus[platform] = 'scanning';
      });
      setPlatformScanStatus(newStatus);
    }
  }, [performCopyrightScanMutation.isPending, selectedPlatforms]);

  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

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

  // Get confidence description
  const getConfidenceDescription = (score: number) => {
    if (score >= 0.9) return 'likely repost';
    if (score >= 0.6) return 'possibly commentary';
    return 'false match';
  };

  // Get platform icon component
  const getPlatformIcon = (platformName: string) => {
    const platform = PLATFORM_OPTIONS.find(p => p.id === platformName || p.name === platformName);
    return platform ? platform.icon : Globe;
  };

  return (
    <div className="relative pb-24 md:pb-0">
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

          {/* Platform Status Badges */}
          {selectedPlatforms.length > 0 && (
            <div className="mt-4 w-full space-y-2">
              <Label className="text-xs text-muted-foreground">Platform Status</Label>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((platformId) => {
                  const platform = PLATFORM_OPTIONS.find(p => p.id === platformId);
                  if (!platform) return null;
                  
                  const Icon = platform.icon;
                  const status = platformScanStatus[platformId] || 'not-scanned';
                  const matchCount = platformMatchCounts[platformId] || 0;
                  
                  return (
                    <Badge
                      key={platformId}
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1",
                        status === 'scanned' && matchCount > 0 && "bg-green-500/10 border-green-500/30 text-green-600",
                        status === 'scanned' && matchCount === 0 && "bg-gray-500/10 border-gray-500/30 text-gray-600",
                        status === 'scanning' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
                        status === 'not-scanned' && "bg-gray-500/10 border-gray-500/30 text-gray-400"
                      )}
                    >
                      {status === 'scanned' && matchCount > 0 && <CheckCircle className="h-3 w-3" />}
                      {status === 'scanning' && <Loader2 className="h-3 w-3 animate-spin" />}
                      {status === 'not-scanned' && <XCircle className="h-3 w-3" />}
                      <Icon className={cn("h-3 w-3", platform.color)} />
                      <span className="text-xs font-medium">{platform.name}</span>
                      {status === 'scanned' && matchCount > 0 && (
                        <span className="text-xs">– {matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
                      )}
                      {status === 'scanning' && <span className="text-xs">– scanning…</span>}
                      {status === 'not-scanned' && <span className="text-xs">– not scanned</span>}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results with Confidence Levels, Thumbnails, and View Buttons */}
          {lastScanResults.length > 0 && (
            <div className="mt-4 w-full space-y-4 overflow-x-hidden md:overflow-visible">
              {/* High Confidence Matches (90-100%) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => isMobile && setOpenHigh(prev => !prev)}
                  className="md:hidden w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> High Confidence Matches ({highConfidence.length})
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openHigh ? "rotate-180" : "rotate-0")} />
                </button>
                <div className="hidden md:flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-semibold text-foreground">
                    High Confidence Matches ({highConfidence.length})
                  </p>
                </div>
                <div className={cn("space-y-3", isMobile ? (openHigh ? "block" : "hidden") : "block")}>
                  {highConfidence.map((alert, index) => {
                    const similarityScore = (alert.similarity_score || 0) * 100;
                    const PlatformIcon = getPlatformIcon(alert.platform);
                    return (
                      <Card key={alert.id || index} className="p-3 border-l-4 border-l-green-500">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            {alert.screenshot_url ? (
                              <img
                                src={alert.screenshot_url}
                                alt={`Match on ${alert.platform}`}
                                className="w-20 h-20 rounded-lg object-cover border border-border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <PlatformIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">
                                  {alert.platform}
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                                {Math.round(similarityScore)}% similarity
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {getConfidenceDescription(alert.similarity_score || 0)}
                            </p>
                            <p className="text-sm text-foreground mb-2 line-clamp-2">
                              {alert.description}
                            </p>
                            {alert.infringingUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => window.open(alert.infringingUrl, '_blank', 'noopener,noreferrer')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                View Match
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Possible Reposts (60-89%) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => isMobile && setOpenPossible(prev => !prev)}
                  className="md:hidden w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" /> Possible Reposts ({possibleReposts.length})
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openPossible ? "rotate-180" : "rotate-0")} />
                </button>
                <div className="hidden md:flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-sm font-semibold text-foreground">
                    Possible Reposts ({possibleReposts.length})
                  </p>
                </div>
                <div className={cn("space-y-3", isMobile ? (openPossible ? "block" : "hidden") : "block")}>
                  {possibleReposts.map((alert, index) => {
                    const similarityScore = (alert.similarity_score || 0) * 100;
                    const PlatformIcon = getPlatformIcon(alert.platform);
                    return (
                      <Card key={alert.id || index} className="p-3 border-l-4 border-l-yellow-500">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            {alert.screenshot_url ? (
                              <img
                                src={alert.screenshot_url}
                                alt={`Match on ${alert.platform}`}
                                className="w-20 h-20 rounded-lg object-cover border border-border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <PlatformIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">
                                  {alert.platform}
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-xs">
                                {Math.round(similarityScore)}% similarity
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {getConfidenceDescription(alert.similarity_score || 0)}
                            </p>
                            <p className="text-sm text-foreground mb-2 line-clamp-2">
                              {alert.description}
                            </p>
                            {alert.infringingUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => window.open(alert.infringingUrl, '_blank', 'noopener,noreferrer')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                View Match
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* No Match (0-59%) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => isMobile && setOpenNoMatch(prev => !prev)}
                  className="md:hidden w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-400" /> No Match ({noMatch.length})
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openNoMatch ? "rotate-180" : "rotate-0")} />
                </button>
                <div className="hidden md:flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No Match ({noMatch.length})
                  </p>
                </div>
                <div className={cn("space-y-2", isMobile ? (openNoMatch ? "block" : "hidden") : "block")}>
                  {noMatch.map((alert, index) => {
                    const similarityScore = (alert.similarity_score || 0) * 100;
                    const PlatformIcon = getPlatformIcon(alert.platform);
                    return (
                      <div key={alert.id || index} className="p-2 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{alert.platform}</span>
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs ml-auto">
                            {Math.round(similarityScore)}% similarity
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getConfidenceDescription(alert.similarity_score || 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur border-t border-white/10 shadow-[0_-10px_30px_rgba(2,6,23,0.6)]">
        <div className="grid grid-cols-4 text-xs text-gray-300">
          <Link to="/creator-dashboard" className="flex flex-col items-center justify-center py-3 gap-1 hover:text-white">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link to="/creator-payments" className="flex flex-col items-center justify-center py-3 gap-1 hover:text-white">
            <IndianRupee className="h-5 w-5" />
            Payments
          </Link>
          <Link to="/creator-contracts" className="flex flex-col items-center justify-center py-3 gap-1 hover:text-white">
            <FileText className="h-5 w-5" />
            Contracts
          </Link>
          <Link to="/creator-profile" className="flex flex-col items-center justify-center py-3 gap-1 hover:text-white">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CreatorCopyrightScanner;
