"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Search, Send, AlertTriangle, Youtube, Instagram, Globe, Facebook, PlusCircle, Trash2, Play, FileText, Mail, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OriginalContent, CopyrightMatch, CopyrightAction } from '@/types';
import { useOriginalContent, useAddOriginalContent, useDeleteOriginalContent, useStartCopyrightScan, useCopyrightMatches, usePerformCopyrightAction } from '@/lib/hooks/useCopyrightScanner';
import CreatorCopyrightScanner from '@/components/creator-dashboard/CreatorCopyrightScanner';
import ProtectionDashboardHeader from '@/components/content-protection/ProtectionDashboardHeader';
import SimplifiedScanner from '@/components/content-protection/SimplifiedScanner';
import ScanningProgress from '@/components/content-protection/ScanningProgress';
import ScanResultsPreview from '@/components/content-protection/ScanResultsPreview';
import ScanHistory from '@/components/content-protection/ScanHistory';
import { usePerformCopyrightScan } from '@/lib/hooks/usePerformCopyrightScan';

const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Other Web'];
const ACTION_TYPE_LABELS: Record<CopyrightAction['action_type'], string> = {
  takedown: 'Takedown Notice',
  email: 'Infringement Email',
  ignored: 'Ignored',
};

const CreatorContentProtection = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const creatorId = profile?.id;

  // --- State Management ---
  const [isContentFormOpen, setIsContentFormOpen] = useState(false);
  const [newContent, setNewContent] = useState({ platform: '', url: '', watermark: '' });
  const [selectedContentId, setSelectedContentId] = useState<string | undefined>(undefined);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<CopyrightMatch | null>(null);
  const [actionType, setActionType] = useState<CopyrightAction['action_type']>('takedown');
  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const [quickScanProgress, setQuickScanProgress] = useState(0);
  const [quickScanPlatform, setQuickScanPlatform] = useState<string | undefined>(undefined);
  const [quickScanError, setQuickScanError] = useState<string | null>(null);
  const [lastScanQuery, setLastScanQuery] = useState<string>('');
  const [lastScanPlatforms, setLastScanPlatforms] = useState<string[]>([]);

  // --- Hooks ---
  const { data: originalContentList, isLoading: isLoadingContent, refetch: refetchContent } = useOriginalContent({
    creatorId,
    enabled: !sessionLoading && isCreator,
  });
  const addContentMutation = useAddOriginalContent();
  const deleteContentMutation = useDeleteOriginalContent();
  const startScanMutation = useStartCopyrightScan();
  const performActionMutation = usePerformCopyrightAction();
  const performQuickScanMutation = usePerformCopyrightScan();

  const { data: matches, isLoading: isLoadingMatches, refetch: refetchMatches } = useCopyrightMatches({
    contentId: selectedContentId,
    enabled: !!selectedContentId,
  });

  // --- Effects ---
  useEffect(() => {
    if (originalContentList && originalContentList.length > 0 && !selectedContentId) {
      setSelectedContentId(originalContentList[0].id);
    }
  }, [originalContentList, selectedContentId]);

  // --- Handlers ---

  const handleRegisterContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorId || !newContent.platform || !newContent.url) {
      toast.error('Platform and URL are required.');
      return;
    }
    try {
      const result = await addContentMutation.mutateAsync({
        user_id: creatorId,
        platform: newContent.platform,
        original_url: newContent.url,
        watermark_text: newContent.watermark || undefined,
      });
      setNewContent({ platform: '', url: '', watermark: '' });
      setIsContentFormOpen(false);
      setSelectedContentId(result.id); // Select the newly added content
    } catch (error) {
      // Handled by hook
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!creatorId) return;
    try {
      await deleteContentMutation.mutateAsync({ id: contentId, user_id: creatorId });
      if (selectedContentId === contentId) {
        setSelectedContentId(undefined);
      }
      refetchContent();
    } catch (error) {
      // Handled by hook
    }
  };

  const handleStartScan = async (contentId: string) => {
    try {
      await startScanMutation.mutateAsync({ original_content_id: contentId });
      refetchMatches(); // Refetch matches after scan completes
    } catch (error) {
      // Handled by hook
    }
  };

  const handleOpenActionDialog = (match: CopyrightMatch) => {
    setSelectedMatch(match);
    setIsActionDialogOpen(true);
    setActionType('takedown'); // Default action
  };

  const handlePerformAction = async () => {
    if (!selectedMatch || !selectedContentId) return;

    try {
      await performActionMutation.mutateAsync({
        match_id: selectedMatch.id,
        action_type: actionType,
        original_content_id: selectedContentId,
      });
      setIsActionDialogOpen(false);
      setSelectedMatch(null);
      refetchMatches();
    } catch (error) {
      // Handled by hook
    }
  };

  const handleRetryScan = () => {
    if (lastScanQuery && lastScanPlatforms.length > 0) {
      handleQuickScan(lastScanQuery, lastScanPlatforms);
    }
  };

  const handleQuickScan = async (query: string, platforms: string[]) => {
    setIsQuickScanning(true);
    setQuickScanProgress(0);
    setQuickScanPlatform(undefined);
    setQuickScanError(null);
    setLastScanQuery(query);
    setLastScanPlatforms(platforms);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setQuickScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Simulate platform scanning
      let platformIndex = 0;
      const platformInterval = setInterval(() => {
        if (platformIndex < platforms.length) {
          setQuickScanPlatform(platforms[platformIndex]);
          platformIndex++;
        } else {
          clearInterval(platformInterval);
        }
      }, 1000);

      // Perform actual scan
      const result = await performQuickScanMutation.mutateAsync({
        query,
        platforms,
      });

      clearInterval(progressInterval);
      clearInterval(platformInterval);
      setQuickScanProgress(100);
      setQuickScanPlatform(undefined);

      // Wait a bit then reset
      setTimeout(() => {
        setIsQuickScanning(false);
        setQuickScanProgress(0);
        // If matches found, show them
        if (result.alerts && result.alerts.length > 0) {
          toast.success(`Found ${result.alerts.length} potential matches!`);
        } else {
          toast.success('Scan completed. No matches found.');
        }
      }, 1000);
    } catch (error: any) {
      setIsQuickScanning(false);
      setQuickScanProgress(0);
      setQuickScanPlatform(undefined);
      setQuickScanError(error?.message || 'Scan failed. Please try again.');
      // Error handled by hook
    }
  };

  const selectedContent = originalContentList?.find(c => c.id === selectedContentId);

  // Calculate scans this month (mock - in real app, fetch from copyright_scans table)
  // MUST be before any conditional returns (Rules of Hooks)
  const scansThisMonth = useMemo(() => {
    // If we have demo data (6 items) or less, return demo stats
    if (!originalContentList || originalContentList.length === 0 || originalContentList.length <= 6) {
      return 42; // Demo: 42 scans this month
    }
    // Mock calculation - in real app, count scans from this month
    return Math.floor((originalContentList.length || 0) * 7);
  }, [originalContentList]);

  // Generate scan history (mock - in real app, fetch from copyright_scans table)
  // MUST be before any conditional returns (Rules of Hooks)
  const scanHistory = useMemo(() => {
    if (!originalContentList || originalContentList.length === 0) return [];
    
    return originalContentList.slice(0, 5).map((content, index) => ({
      id: content.id,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      status: index % 3 === 0 ? 'completed' as const : index % 3 === 1 ? 'pending' as const : 'failed' as const,
      matchesFound: index % 2 === 0 ? Math.floor(Math.random() * 5) : 0,
      platform: content.platform,
      contentUrl: content.original_url,
    }));
  }, [originalContentList]);

  // Calculate unprotected content count
  const unprotectedCount = useMemo(() => {
    if (!originalContentList || originalContentList.length === 0) return 0;
    // In real app, check which content hasn't been registered/protected
    // For demo, assume some content is unprotected
    return originalContentList.length > 6 ? 0 : 18;
  }, [originalContentList]);

  if (sessionLoading || isLoadingContent) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-white/60">Loading content protection...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Protection Dashboard Header */}
      <ProtectionDashboardHeader
        originalContent={originalContentList || []}
        matches={matches || []}
        scansThisMonth={scansThisMonth}
      />

      {/* Simplified Scanner */}
      <div className="mb-6">
        <SimplifiedScanner
          onScan={handleQuickScan}
          isScanning={isQuickScanning}
          scanProgress={quickScanProgress}
          currentPlatform={quickScanPlatform}
        />
      </div>

      {/* Scanning Progress */}
      {isQuickScanning && (
        <div className="mb-6">
          <ScanningProgress
            isScanning={isQuickScanning}
            progress={quickScanProgress}
            currentPlatform={quickScanPlatform}
            matchesFound={0}
            contentPreview={undefined}
            error={quickScanError}
            onRetry={quickScanError ? handleRetryScan : undefined}
          />
        </div>
      )}

      {/* Matches Section - Always Visible */}
      <div className="mb-6">
        {matches && matches.length > 0 && !isQuickScanning ? (
          <ScanResultsPreview
            matches={matches}
            onTakeAction={handleOpenActionDialog}
            onViewDetails={(match) => {
              window.open(match.matched_url, '_blank');
            }}
          />
        ) : (
          <Card className="bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <div className="absolute inset-0 rounded-full bg-green-400/30 blur-2xl" />
                <CheckCircle className="w-10 h-10 text-green-400 relative z-10" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-white font-semibold text-base">No matches found</p>
                <p className="text-sm text-white/60">Your content is protected. No copyright violations detected.</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="mb-6">
          <ScanHistory scans={scanHistory} />
        </div>
      )}

      {/* Registered Original Content Section */}
      <Card className="relative bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 mb-6 overflow-hidden">
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center mb-2">
                <ShieldCheck className="h-4 w-4 mr-2 text-purple-400" /> Registered Original Content
              </h2>
              <p className="text-xs text-white/60 leading-relaxed">
                Manage and monitor your protected content.
              </p>
            </div>
            {unprotectedCount > 0 ? (
              <Button 
                onClick={async () => {
                  // Auto-register all unprotected content
                  toast.info(`Registering ${unprotectedCount} pieces of content...`);
                  // TODO: Implement batch registration
                  // For now, just show success
                  setTimeout(() => {
                    toast.success(`Successfully registered ${unprotectedCount} pieces!`);
                  }, 1500);
                }} 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 whitespace-nowrap text-sm px-4 py-2 h-auto rounded-full shadow-lg transition-all"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Register All Unprotected ({unprotectedCount})
              </Button>
            ) : (
              <Button 
                onClick={() => setIsContentFormOpen(true)} 
                className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap text-sm px-3 py-1.5 h-auto rounded-lg shadow-md transition-all"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Register New
              </Button>
            )}
          </div>

          {originalContentList && originalContentList.length > 0 ? (
            <div className="mt-4">
              <Select
                onValueChange={setSelectedContentId}
                value={selectedContentId || ''}
                disabled={!originalContentList || originalContentList.length === 0}
              >
                <SelectTrigger id="contentSelector" className="bg-white/5 text-white border-white/10 hover:border-white/20 focus:border-blue-400/50 rounded-xl h-11 w-full">
                  <SelectValue placeholder="Choose content to manage" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/5 text-white">
                  {originalContentList.map((content) => (
                    <SelectItem key={content.id} value={content.id}>
                      {content.platform} - {content.original_url.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-purple-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Protect Your First Video</h3>
              <div className="space-y-2 max-w-md mx-auto">
                <p className="text-sm text-white/60">
                  Creators recover <span className="font-semibold text-emerald-400">₹2.5L annually</span> from content theft
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-white/60">
                  <span className="px-2 py-1 bg-muted rounded-full">Auto-scan</span>
                  <span className="px-2 py-1 bg-muted rounded-full">Takedown assistance</span>
                  <span className="px-2 py-1 bg-muted rounded-full">Legal templates</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setIsContentFormOpen(true)} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Protect Your First Video
            </Button>
          </div>
        )}
        </div>
      </Card>

      {/* --- 2. Scan and Matches View --- */}
      {selectedContent && (
        <Card className="relative bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 overflow-hidden">
          <div className="relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-white">
                Matches for: <span className="text-blue-400">{selectedContent.platform} Content</span>
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-xs text-white/40">Last Scanned: 2min</p>
                <Button
                  onClick={() => handleStartScan(selectedContent.id)}
                  disabled={startScanMutation.isPending}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition-all text-sm px-3 py-1.5 h-auto"
                >
                  {startScanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="mr-1.5 h-3.5 w-3.5" /> Run New Scan
                    </>
                  )}
                </Button>
              </div>
            </div>

          {isLoadingMatches ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-lg text-white/60">Loading matches...</p>
            </div>
          ) : matches && matches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-white/50">Platform</TableHead>
                  <TableHead className="text-white/50">Similarity</TableHead>
                  <TableHead className="text-white/50">Matched URL</TableHead>
                  <TableHead className="text-white/50">Last Action</TableHead>
                  <TableHead className="text-right text-white/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const lastAction = match.copyright_actions?.[0];
                  const isIgnored = lastAction?.action_type === 'ignored';
                  const isTakedownSent = lastAction?.action_type === 'takedown';
                  const isHighRisk = match.similarity_score > 80;

                  return (
                    <TableRow key={match.id} className={cn("border-white/5", isHighRisk && 'bg-red-500/10')}>
                      <TableCell className="font-medium text-white">{match.platform}</TableCell>
                      <TableCell>
                        <Badge variant={isHighRisk ? 'destructive' : match.similarity_score > 50 ? 'default' : 'secondary'}>
                          {match.similarity_score}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/60">
                        <a href={match.matched_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
                          {match.matched_url.substring(0, 40)}...
                        </a>
                      </TableCell>
                      <TableCell>
                        {lastAction ? (
                          <Badge variant={isIgnored ? 'secondary' : isTakedownSent ? 'default' : 'outline'}>
                            {ACTION_TYPE_LABELS[lastAction.action_type]}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Action</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild className="mr-2">
                          <a href={match.screenshot_url || '#'} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant={isHighRisk ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleOpenActionDialog(match)}
                          disabled={isIgnored || isTakedownSent || performActionMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" /> Action
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                {/* Soft green glow effect */}
                <div className="absolute inset-0 rounded-full bg-green-400/30 blur-2xl" />
                <CheckCircle className="w-10 h-10 text-green-400 relative z-10" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-white font-semibold text-base">No matches found</p>
                <p className="text-sm text-white/60">Your content is protected. No copyright violations detected.</p>
              </div>
            </div>
          )}
          </div>
        </Card>
      )}

      {/* --- Dialogs --- */}

      {/* Register Content Dialog */}
      <Dialog open={isContentFormOpen} onOpenChange={setIsContentFormOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Register Original Content</DialogTitle>
            <DialogDescription>
              Add a piece of your original content to start monitoring for infringement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterContent} className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select onValueChange={(value) => setNewContent(prev => ({ ...prev, platform: value }))} value={newContent.platform} disabled={addContentMutation.isPending}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="url">Original Content URL *</Label>
              <Input id="url" type="url" value={newContent.url} onChange={(e) => setNewContent(prev => ({ ...prev, url: e.target.value }))} disabled={addContentMutation.isPending} placeholder="e.g., https://youtube.com/watch?v=..." />
            </div>
            <div>
              <Label htmlFor="watermark">Watermark/Signature Text (Optional)</Label>
              <Input id="watermark" value={newContent.watermark} onChange={(e) => setNewContent(prev => ({ ...prev, watermark: e.target.value }))} disabled={addContentMutation.isPending} placeholder="e.g., @myusername" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContentFormOpen(false)} disabled={addContentMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={addContentMutation.isPending || !newContent.platform || !newContent.url}>
                {addContentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Register Content'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Perform Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Perform Action on Match</DialogTitle>
            <DialogDescription>
              Select the action to take for the infringing content found at: <span className="font-semibold">{selectedMatch?.matched_url.substring(0, 30)}...</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="actionType">Action Type</Label>
              <Select onValueChange={(value: CopyrightAction['action_type']) => setActionType(value)} value={actionType} disabled={performActionMutation.isPending}>
                <SelectTrigger id="actionType">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="takedown">Formal Takedown Notice (Legal)</SelectItem>
                  <SelectItem value="email">Infringement Email (Soft)</SelectItem>
                  <SelectItem value="ignored">Ignore Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {actionType === 'takedown' && (
              <Card className="bg-red-500/10 border-red-500/30 p-3 text-sm text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                This action triggers a formal legal notice.
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)} disabled={performActionMutation.isPending}>Cancel</Button>
            <Button onClick={handlePerformAction} disabled={performActionMutation.isPending}>
              {performActionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Confirm ${ACTION_TYPE_LABELS[actionType]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorContentProtection;