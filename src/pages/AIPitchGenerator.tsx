"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { 
  Sparkles, 
  Send, 
  History, 
  Copy, 
  Trash2,
  MessageSquare,
  FileText,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Wand2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { fetchWithTimeout, getApiBaseUrl, isNetworkError } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';

interface PitchHistory {
  id: string;
  input: string;
  output: string;
  type: 'pitch' | 'notice';
  tone?: 'firm' | 'friendly' | 'neutral';
  createdAt: Date;
  source?: 'server' | 'local';
}

const AIPitchGenerator = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<PitchHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [mode, setMode] = useState<'pitch' | 'notice'>('pitch');
  const [tone, setTone] = useState<number>(50); // 0 = firm, 100 = friendly
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<PitchHistory[]>([]);
  const [hasSyncConflict, setHasSyncConflict] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Preparing prompt');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const quickPrompts = useMemo(() => ({
    pitch: [
      'Eco-friendly fashion drop for Gen Z',
      'Fitness challenge with high engagement',
      'Skincare routine featuring a hero product',
      'Travel staycation mini-series',
    ],
    notice: [
      'Trademark/copyright claim on my post',
      'Payment delayed beyond agreed terms',
      'Usage rights exceeded in paid ads',
      'Brand requested extra deliverables',
    ]
  }), []);

  const inputStats = useMemo(() => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chars = input.length;
    return { words, chars };
  }, [input]);

  const toneBadge = useMemo(() => {
    if (mode !== 'notice') return null;
    return tone < 33 ? 'Firm' : tone > 66 ? 'Friendly' : 'Neutral';
  }, [tone, mode]);

  // Real generation function - calls backend API
  const generatePitch = async (text: string, type: 'pitch' | 'notice', toneValue: number) => {
    const apiBaseUrl = getApiBaseUrl();
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;

    const response = await fetchWithRetry(`${apiBaseUrl}/api/ai/pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        input: text,
        type,
        tone: toneValue
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to generate');
    }

    return data.data as { output: string; id?: string | null; created_at?: string | null };
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please enter some text to generate');
      return;
    }

    if (!isOnline) {
      toast.error('You are offline. Reconnect to generate.');
      return;
    }

    setIsGenerating(true);
    setProgress(8);
    setProgressLabel('Preparing prompt');

    const interval = window.setInterval(() => {
      setProgress((prev) => Math.min(90, prev + Math.floor(Math.random() * 8) + 4));
    }, 420);

    const labelTimers = [
      window.setTimeout(() => setProgressLabel('Drafting response'), 700),
      window.setTimeout(() => setProgressLabel('Polishing tone'), 1400),
    ];

    try {
      const result = await generatePitch(input, mode, tone);
      const generated = result.output;
      setOutput(generated);
    
      // Add to history
      const newHistoryItem: PitchHistory = {
        id: result.id || Date.now().toString(),
        input,
        output: generated,
        type: mode,
        tone: mode === 'notice' ? (tone < 33 ? 'firm' : tone > 66 ? 'friendly' : 'neutral') : undefined,
        createdAt: result.created_at ? new Date(result.created_at) : new Date(),
        source: result.id ? 'server' : 'local',
      };
      
      setHistory([newHistoryItem, ...history]);
      setSelectedHistory(newHistoryItem.id);
      toast.success('Generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate');
    } finally {
      window.clearInterval(interval);
      labelTimers.forEach((t) => window.clearTimeout(t));
      setProgress(100);
      setProgressLabel('Complete');
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 350);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(history.filter(item => item.id !== id));
    if (selectedHistory === id) {
      setSelectedHistory(null);
      setOutput('');
    }
    toast.success('Deleted from history');
  };

  const handleLoadHistory = (item: PitchHistory) => {
    setInput(item.input);
    setOutput(item.output);
    setMode(item.type);
    if (item.tone) {
      setTone(item.tone === 'firm' ? 0 : item.tone === 'friendly' ? 100 : 50);
    }
    setSelectedHistory(item.id);
    setIsHistoryOpen(false);
  };

  const toneLabel = useMemo(() => {
    if (mode === 'notice') {
      return tone < 33 ? 'Firm' : tone > 66 ? 'Friendly' : 'Neutral';
    }
    return null;
  }, [tone, mode]);

  const containerVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 }
  };

  const historyContent = (
    <>
      {history.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No history yet</p>
          <p className="text-xs mt-1">Generated pitches will appear here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100dvh-300px)] overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-xl border transition-all cursor-pointer",
                selectedHistory === item.id
                  ? "bg-purple-500/20 border-purple-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              )}
              onClick={() => handleLoadHistory(item)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {item.type === 'pitch' ? (
                    <FileText className="w-4 h-4 text-purple-400" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-xs font-medium text-white/80 capitalize">
                    {item.type === 'pitch' ? 'Pitch' : 'Notice'}
                  </span>
                  {item.tone && (
                    <span className="text-xs text-white/50">• {item.tone}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteHistory(item.id);
                  }}
                  className="h-6 w-6 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-white/60 line-clamp-2">
                {item.input}
              </p>
              <p className="text-[10px] text-white/40 mt-2">
                {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 2
  ): Promise<Response> => {
    let attempt = 0;
    let lastError: any = null;
    while (attempt <= retries) {
      try {
        const response = await fetchWithTimeout(url, options, 30000);
        if (response.status >= 500 || response.status === 429) {
          if (attempt < retries) {
            const retryAfter = response.headers.get('retry-after');
            const delay = retryAfter ? Number(retryAfter) * 1000 : 500 * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt += 1;
            continue;
          }
        }
        return response;
      } catch (error: any) {
        lastError = error;
        if (!isNetworkError(error) || attempt >= retries) {
          throw error;
        }
        const delay = 500 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
      }
    }
    throw lastError || new Error('Failed to fetch');
  };

  const loadHistoryFromServer = async () => {
    setIsLoadingHistory(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetchWithRetry(
        `${apiBaseUrl}/api/ai/pitch/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to load history');
      }

      const serverHistory: PitchHistory[] = (data.data || []).map((item: any) => ({
        id: item.id,
        input: item.input,
        output: item.output,
        type: item.type === 'notice' ? 'notice' : 'pitch',
        tone: item.tone || undefined,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        source: 'server'
      }));

      const merged = [...serverHistory, ...pendingSync].filter(
        (item, index, self) => index === self.findIndex(t => t.id === item.id)
      );
      merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setHistory(merged);
    } catch (error: any) {
      console.error('[AI Pitch] Load history failed:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Offline/Online detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSync.length > 0) {
        setHasSyncConflict(true);
        toast.info('Connection restored. Click "Reconnect & Update" to sync your changes.', {
          duration: 5000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline. Your work will be saved locally and synced when you reconnect.', {
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync.length]);

  // Save to localStorage when offline (only for locally created drafts)
  useEffect(() => {
    if (!isOnline && history.length > 0) {
      const lastItem = history[0];
      if (lastItem.source === 'local' && !pendingSync.find(item => item.id === lastItem.id)) {
        setPendingSync(prev => [lastItem, ...prev]);
        localStorage.setItem('aiPitchGenerator_pendingSync', JSON.stringify([lastItem, ...pendingSync]));
      }
    }
  }, [history, isOnline, pendingSync]);

  // Load pending sync on mount
  useEffect(() => {
    const stored = localStorage.getItem('aiPitchGenerator_pendingSync');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = (parsed || []).map((item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }));
        setPendingSync(normalized);
        if (normalized.length > 0 && isOnline) {
          setHasSyncConflict(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [isOnline]);

  // Load history from server
  useEffect(() => {
    if (isOnline) {
      loadHistoryFromServer();
    }
  }, [isOnline]);

  // Handle sync and conflict resolution
  const handleReconnectAndUpdate = async () => {
    setIsSyncing(true);
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Please sign in to sync history.');

      if (pendingSync.length > 0) {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetchWithRetry(`${apiBaseUrl}/api/ai/pitch/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: pendingSync.map((item) => ({
              input: item.input,
              output: item.output,
              type: item.type,
              tone: item.tone,
              created_at: item.createdAt.toISOString()
            }))
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Sync failed');
        }
      }

      await loadHistoryFromServer();
      setPendingSync([]);
      setHasSyncConflict(false);
      localStorage.removeItem('aiPitchGenerator_pendingSync');

      toast.success(`Synced ${pendingSync.length} item(s) successfully!`);
    } catch (error) {
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="nb-screen-height text-white relative pb-24 md:pb-8 overflow-hidden font-['Space_Grotesk']">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-purple-500/25 blur-[120px]" />
        <div className="absolute top-20 right-[-140px] h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-rose-500/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-4 py-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/40 to-blue-500/30 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.35)]">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight font-['Fraunces']">
                  AI Pitch Studio
                </h1>
                <p className="text-sm text-white/70">
                  Generate sponsor pitches and legal responses with a single prompt.
                </p>
              </div>
            </div>
            
            {/* Network Status & Sync */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsHistoryOpen(true)}
                className="lg:hidden bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              {!isOnline && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <WifiOff className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">Offline</span>
                </div>
              )}
              
              {isOnline && hasSyncConflict && (
                <Button
                  onClick={handleReconnectAndUpdate}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconnect & Update
                    </>
                  )}
                </Button>
              )}
              
              {isOnline && !hasSyncConflict && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Online</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Instant drafts</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Tone control</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Offline safe</span>
          </div>
          
          {/* Sync Conflict Alert */}
          {hasSyncConflict && pendingSync.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400 mb-1">
                  Sync Conflicts Detected
                </p>
                <p className="text-xs text-white/60">
                  You have {pendingSync.length} item(s) saved offline. Click "Reconnect & Update" to sync with the server.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Mode Toggle */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={mode === 'pitch' ? 'default' : 'outline'}
                      onClick={() => setMode('pitch')}
                      className={cn(
                        "flex-1",
                        mode === 'pitch' 
                          ? "bg-purple-600 hover:bg-purple-700 text-white" 
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      )}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Pitch Generator
                    </Button>
                    <Button
                      variant={mode === 'notice' ? 'default' : 'outline'}
                      onClick={() => setMode('notice')}
                      className={cn(
                        "flex-1",
                        mode === 'notice' 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Notice Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Input Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/[0.07] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_10px_36px_rgba(0,0,0,0.35)]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-300" />
                    {mode === 'pitch' ? 'Pitch Details' : 'Notice Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'notice' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-white/80">Tone</Label>
                        <span className="text-xs font-medium text-white/60 px-2 py-1 rounded-full bg-white/10 border border-white/10">
                          {toneLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-white/50 w-12">Firm</span>
                        <Slider
                          value={[tone]}
                          onValueChange={(value) => setTone(value[0])}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-white/50 w-16">Friendly</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-white/80">
                      {mode === 'pitch' 
                        ? 'Describe your brand collaboration idea or key points' 
                        : 'Describe the notice or claim you need to respond to'}
                    </Label>
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mode === 'pitch' 
                        ? "e.g., I'm a lifestyle creator with 50K followers interested in promoting sustainable fashion..."
                        : "e.g., Received a notice about copyright claim on my Instagram post..."}
                      className="min-h-[200px] bg-white/5 text-white border-white/10 placeholder:text-white/40 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/30"
                    />
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{inputStats.words} words • {inputStats.chars} chars</span>
                      {toneBadge && <span>Suggested tone: {toneBadge}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(mode === 'pitch' ? quickPrompts.pitch : quickPrompts.notice).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput((prev) => prev ? `${prev}\n${prompt}` : prompt)}
                        className="text-xs text-white/70 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.15] transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !input.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Generate {mode === 'pitch' ? 'Pitch' : 'Response'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setInput('')}
                      className="bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Output Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Generated {mode === 'pitch' ? 'Pitch' : 'Response'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(output)}
                        disabled={!output}
                        className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isGenerating && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                        <span>{progressLabel}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {output ? (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <pre className="whitespace-pre-wrap text-sm text-white/90 font-sans leading-relaxed">
                        {output}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-10 border border-dashed border-white/10 text-center">
                      <Sparkles className="w-6 h-6 text-purple-300 mx-auto mb-3" />
                      <p className="text-sm text-white/70">Your generated copy will appear here.</p>
                      <p className="text-xs text-white/40 mt-1">Tip: add a specific goal and audience for better output.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* History Sidebar */}
          <div className="w-80 hidden lg:block">
            <motion.div variants={itemVariants}>
              <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="text-center py-8 text-white/40">
                      <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin" />
                      <p className="text-sm">Loading history...</p>
                    </div>
                  ) : (
                    historyContent
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Mobile History Drawer */}
        <BottomSheet
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title="History"
          className="lg:hidden"
        >
          {isLoadingHistory ? (
            <div className="text-center py-8 text-white/40">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : (
            historyContent
          )}
        </BottomSheet>
      </div>
    </div>
  );
};

export default AIPitchGenerator;
