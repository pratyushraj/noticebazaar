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
import { OriginalContent, CopyrightMatch, CopyrightAction } from '@/types';
import { useOriginalContent, useAddOriginalContent, useDeleteOriginalContent, useStartCopyrightScan, useCopyrightMatches, usePerformCopyrightAction } from '@/lib/hooks/useCopyrightScanner';

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

  // --- Hooks ---
  const { data: originalContentList, isLoading: isLoadingContent, refetch: refetchContent } = useOriginalContent({
    creatorId,
    enabled: !sessionLoading && isCreator,
  });
  const addContentMutation = useAddOriginalContent();
  const deleteContentMutation = useDeleteOriginalContent();
  const startScanMutation = useStartCopyrightScan();
  const performActionMutation = usePerformCopyrightAction();

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
    } catch (error) {
      // Handled by hook
    }
  };

  const selectedContent = originalContentList?.find(c => c.id === selectedContentId);

  if (sessionLoading || isLoadingContent) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading content protection...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">My Content Protection</h1>

      {/* --- 1. Register Original Content --- */}
      <Card className="bg-card p-6 rounded-lg shadow-sm border border-border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-purple-500" /> Registered Original Content
          </h2>
          <Button onClick={() => setIsContentFormOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Register New Content
          </Button>
        </div>

        <div className="space-y-4">
          <Label htmlFor="contentSelector">Select Content to Scan/View Matches</Label>
          <Select
            onValueChange={setSelectedContentId}
            value={selectedContentId || ''}
            disabled={!originalContentList || originalContentList.length === 0}
          >
            <SelectTrigger id="contentSelector">
              <SelectValue placeholder="Choose content to manage" />
            </SelectTrigger>
            <SelectContent>
              {originalContentList?.map((content) => (
                <SelectItem key={content.id} value={content.id}>
                  {content.platform} - {content.original_url.substring(0, 50)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* --- 2. Scan and Matches View --- */}
      {selectedContent && (
        <Card className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Matches for: <span className="text-primary">{selectedContent.platform} Content</span>
            </h2>
            <Button
              onClick={() => handleStartScan(selectedContent.id)}
              disabled={startScanMutation.isPending}
              className="bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90"
            >
              {startScanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Run New Scan
                </>
              )}
            </Button>
          </div>

          {isLoadingMatches ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-lg text-muted-foreground">Loading matches...</p>
            </div>
          ) : matches && matches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Platform</TableHead>
                  <TableHead className="text-muted-foreground">Similarity</TableHead>
                  <TableHead className="text-muted-foreground">Matched URL</TableHead>
                  <TableHead className="text-muted-foreground">Last Action</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const lastAction = match.copyright_actions?.[0];
                  const isIgnored = lastAction?.action_type === 'ignored';
                  const isTakedownSent = lastAction?.action_type === 'takedown';
                  const isHighRisk = match.similarity_score > 80;

                  return (
                    <TableRow key={match.id} className={cn("border-border", isHighRisk && 'bg-red-500/10')}>
                      <TableCell className="font-medium text-foreground">{match.platform}</TableCell>
                      <TableCell>
                        <Badge variant={isHighRisk ? 'destructive' : match.similarity_score > 50 ? 'accent' : 'secondary'}>
                          {match.similarity_score}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <a href={match.matched_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
            <p className="text-muted-foreground text-center py-8">No copyright matches found in the latest scan.</p>
          )}
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
    </>
  );
};

export default CreatorContentProtection;