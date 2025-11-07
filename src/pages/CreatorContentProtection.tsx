"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Search, Send, AlertTriangle, Youtube, Instagram, Globe, Facebook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePerformCopyrightScan } from '@/lib/hooks/usePerformCopyrightScan'; // Import the new hook
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
import { Textarea } from '@/components/ui/textarea';
import { useSendTakedownNotice } from '@/lib/hooks/useSendTakedownNotice'; // Import the new hook

const PLATFORM_OPTIONS = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Other Web'];

const CreatorContentProtection = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [scanQuery, setScanQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [isTakedownDialogOpen, setIsTakedownDialogOpen] = useState(false);
  const [selectedAlertForTakedown, setSelectedAlertForTakedown] = useState<any>(null);
  const [infringingUser, setInfringingUser] = useState('');
  const [infringingUrl, setInfringingUrl] = useState('');
  const [originalContentUrl, setOriginalContentUrl] = useState('');
  const [takedownPlatform, setTakedownPlatform] = useState('');

  const performCopyrightScanMutation = usePerformCopyrightScan();
  const sendTakedownNoticeMutation = useSendTakedownNotice();

  useEffect(() => {
    if (performCopyrightScanMutation.isSuccess) {
      setScanResults(performCopyrightScanMutation.data?.alerts || []);
      setLastScanTime(new Date().toLocaleString());
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

  const handleOpenTakedownDialog = (alert: any) => {
    setSelectedAlertForTakedown(alert);
    setInfringingUser(alert.infringingUser || '');
    setInfringingUrl(alert.infringingUrl || '');
    setOriginalContentUrl(alert.originalContentUrl || '');
    setTakedownPlatform(alert.platform || '');
    setIsTakedownDialogOpen(true);
  };

  const handleSendTakedown = async () => {
    if (!selectedAlertForTakedown || !infringingUrl.trim() || !originalContentUrl.trim() || !takedownPlatform.trim()) {
      toast.error('Please fill in all required fields for the takedown notice.');
      return;
    }

    try {
      await sendTakedownNoticeMutation.mutateAsync({
        contentUrl: originalContentUrl.trim(),
        platform: takedownPlatform.trim(),
        infringingUrl: infringingUrl.trim(),
        infringingUser: infringingUser.trim() || undefined,
      });
      toast.success('Takedown notice sent successfully!');
      setIsTakedownDialogOpen(false);
      setSelectedAlertForTakedown(null);
      // Optionally remove the alert from the list or mark it as actioned
      setScanResults(prev => prev.filter(alert => alert.id !== selectedAlertForTakedown.id));
    } catch (error: any) {
      toast.error('Failed to send takedown notice', { description: error.message });
    }
  };

  if (sessionLoading || !isCreator) {
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

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2 text-purple-500" /> Copyright Scanner
        </h2>
        <p className="text-muted-foreground mb-4">
          Run a deep scan across major platforms to find unauthorized reposts or uses of your content.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="scanQuery">Content Identifier (e.g., video title, image description, URL)</Label>
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
        </div>
        {lastScanTime && (
          <p className="text-sm text-muted-foreground mt-4">Last scan: {lastScanTime}</p>
        )}
      </section>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> Takedown Alerts
        </h2>
        {scanResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">Platform</TableHead>
                <TableHead className="text-muted-foreground">Infringing URL</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanResults.map((alert, index) => (
                <TableRow key={alert.id || index} className="border-border">
                  <TableCell className="font-medium text-foreground">{alert.description}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.platform}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <a href={alert.infringingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {alert.infringingUrl.length > 40 ? alert.infringingUrl.substring(0, 37) + '...' : alert.infringingUrl}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenTakedownDialog(alert)}
                      disabled={sendTakedownNoticeMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-1" /> Send Takedown
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">No takedown alerts found. Run a scan above!</p>
        )}
      </section>

      <Dialog open={isTakedownDialogOpen} onOpenChange={setIsTakedownDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border"
          aria-labelledby="send-takedown-title"
          aria-describedby="send-takedown-description"
        >
          <DialogHeader>
            <DialogTitle id="send-takedown-title">Send Takedown Notice</DialogTitle>
            <DialogDescription id="send-takedown-description" className="text-muted-foreground">
              Confirm details to send a formal DMCA takedown notice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="takedownPlatform">Platform</Label>
              <Input id="takedownPlatform" value={takedownPlatform} onChange={(e) => setTakedownPlatform(e.target.value)} disabled={sendTakedownNoticeMutation.isPending} />
            </div>
            <div>
              <Label htmlFor="infringingUser">Infringing User/Channel (Optional)</Label>
              <Input id="infringingUser" value={infringingUser} onChange={(e) => setInfringingUser(e.target.value)} disabled={sendTakedownNoticeMutation.isPending} />
            </div>
            <div>
              <Label htmlFor="originalContentUrl">Your Original Content URL *</Label>
              <Input id="originalContentUrl" type="url" value={originalContentUrl} onChange={(e) => setOriginalContentUrl(e.target.value)} disabled={sendTakedownNoticeMutation.isPending} />
            </div>
            <div>
              <Label htmlFor="infringingUrl">Infringing Content URL *</Label>
              <Input id="infringingUrl" type="url" value={infringingUrl} onChange={(e) => setInfringingUrl(e.target.value)} disabled={sendTakedownNoticeMutation.isPending} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              By sending this, you confirm you are the copyright owner or authorized agent.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTakedownDialogOpen(false)} disabled={sendTakedownNoticeMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTakedown}
              disabled={!infringingUrl.trim() || !originalContentUrl.trim() || !takedownPlatform.trim() || sendTakedownNoticeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {sendTakedownNoticeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send Takedown Notice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorContentProtection;