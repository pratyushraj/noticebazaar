"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Play, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { useRunDiscoveryScan, DiscoveryScanParams } from '@/lib/hooks/useInfluencers';
import { formatDateTime } from '@/lib/utils/date';

const AdminDiscovery = () => {
  const { session, loading: sessionLoading, isAdmin } = useSession();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  // Form state
  const [hashtags, setHashtags] = useState('fitnessindia,fashionindia,techcreator,lifestyleindia,beautyindia,ugccreator');
  const [keywords, setKeywords] = useState('influencer,content creator,creator,indian creator');
  const [minFollowers, setMinFollowers] = useState('10000');
  const [maxFollowers, setMaxFollowers] = useState('500000');
  const [limit, setLimit] = useState('30');
  const [source, setSource] = useState<'apify' | 'phantombuster' | 'google' | 'manual'>('apify');

  const runScanMutation = useRunDiscoveryScan();

  const handleRunScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setLastScanResult(null);

    try {
      const params: DiscoveryScanParams = {
        hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean),
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        minFollowers: parseInt(minFollowers) || 10000,
        maxFollowers: parseInt(maxFollowers) || 500000,
        limit: parseInt(limit) || 30,
        source,
      };

      const result = await runScanMutation.mutateAsync(params);
      setLastScanResult(result);
      
      if (result.success) {
        toast.success('Discovery scan completed successfully!', {
          description: `Found ${result.result.influencersFound} influencers, saved ${result.result.influencersSaved}`,
        });
      } else {
        toast.error('Discovery scan completed with errors', {
          description: result.result.errors?.join(', ') || 'Unknown error',
        });
      }
    } catch (error: any) {
      toast.error('Failed to run discovery scan', {
        description: error.message || 'An unexpected error occurred',
      });
      setLastScanResult({ success: false, error: error.message });
    } finally {
      setIsScanning(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Influencer Discovery</h1>
          <p className="text-muted-foreground mt-2">
            Run automated scans to discover new influencers using Apify, Phantombuster, or Google search
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scan Configuration</CardTitle>
            <CardDescription>Configure parameters for influencer discovery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
              <Input
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="fitnessindia,fashionindia,techcreator"
              />
              <p className="text-xs text-muted-foreground">
                Instagram hashtags to search (without #)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="influencer,content creator,creator"
              />
              <p className="text-xs text-muted-foreground">
                Keywords to search for in profiles
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minFollowers">Min Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFollowers">Max Followers</Label>
                <Input
                  id="maxFollowers"
                  type="number"
                  value={maxFollowers}
                  onChange={(e) => setMaxFollowers(e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limit">Result Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Data Source</Label>
                <Select value={source} onValueChange={(value: any) => setSource(value)}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apify">Apify</SelectItem>
                    <SelectItem value="phantombuster">Phantombuster</SelectItem>
                    <SelectItem value="google">Google Search</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleRunScan}
              disabled={isScanning || runScanMutation.isPending}
              className="w-full"
              size="lg"
            >
              {isScanning || runScanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Scan...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Discovery Scan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Last Scan Result</CardTitle>
            <CardDescription>Results from the most recent scan</CardDescription>
          </CardHeader>
          <CardContent>
            {!lastScanResult ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scan results yet</p>
                <p className="text-xs mt-2">Run a discovery scan to see results</p>
              </div>
            ) : lastScanResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Scan Completed</span>
                </div>
                
                {lastScanResult.result && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Influencers Found</span>
                        <Badge variant="default" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {lastScanResult.result.influencersFound}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Influencers Saved</span>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {lastScanResult.result.influencersSaved}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm font-medium">
                          {lastScanResult.result.duration_ms}ms
                        </span>
                      </div>
                      {lastScanResult.result.timestamp && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Timestamp</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastScanResult.result.timestamp).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {lastScanResult.result.errors && lastScanResult.result.errors.length > 0 && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                        <p className="text-sm font-semibold text-destructive mb-2">Errors:</p>
                        <ul className="text-xs text-destructive space-y-1">
                          {lastScanResult.result.errors.map((error: string, idx: number) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">Scan Failed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lastScanResult.error || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>1. Configure Parameters:</strong> Set hashtags, keywords, follower range, and data source.
          </p>
          <p>
            <strong>2. Run Scan:</strong> Click "Run Discovery Scan" to start the automated discovery process.
          </p>
          <p>
            <strong>3. Review Results:</strong> Found influencers are automatically classified and saved to the database.
          </p>
          <p>
            <strong>4. Manage Influencers:</strong> Go to the Influencers page to view, filter, and manage discovered influencers.
          </p>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="font-semibold mb-2">Data Sources:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Apify:</strong> Instagram scraper (requires APIFY_API_TOKEN)</li>
              <li>• <strong>Phantombuster:</strong> Instagram API (requires PHANTOMBUSTER_API_KEY)</li>
              <li>• <strong>Google:</strong> Google Custom Search (placeholder)</li>
              <li>• <strong>Manual:</strong> Manual data import</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDiscovery;

