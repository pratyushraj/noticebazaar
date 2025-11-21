"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PitchHistory {
  id: string;
  input: string;
  output: string;
  type: 'pitch' | 'notice';
  tone?: 'firm' | 'friendly' | 'neutral';
  createdAt: Date;
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

  // Mock generation function - replace with actual API call
  const generatePitch = async (text: string, type: 'pitch' | 'notice', toneValue: number) => {
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let generatedText = '';
    
    if (type === 'pitch') {
      generatedText = `Subject: Collaboration Opportunity - ${text.split(' ').slice(0, 3).join(' ')} Brand Partnership

Dear Team,

I hope this message finds you well. I'm reaching out to explore a potential collaboration opportunity that I believe would be mutually beneficial.

${text}

I'm excited about the possibility of working together and would love to discuss how we can create something amazing together.

Looking forward to hearing from you!

Best regards,
[Your Name]`;
    } else {
      const toneLabel = toneValue < 33 ? 'firm' : toneValue > 66 ? 'friendly' : 'neutral';
      const toneText = toneValue < 33 
        ? 'I must respectfully address the claims made in your notice.'
        : toneValue > 66 
        ? 'Thank you for bringing this to my attention. I appreciate the opportunity to clarify.'
        : 'I would like to address the concerns raised in your notice.';
      
      generatedText = `${toneText}

Regarding the matter you've raised:

${text}

I believe we can resolve this matter amicably. Please let me know if you need any additional information or clarification.

Thank you for your understanding.

Best regards,
[Your Name]`;
    }
    
    setIsGenerating(false);
    return generatedText;
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please enter some text to generate');
      return;
    }

    const generated = await generatePitch(input, mode, tone);
    setOutput(generated);
    
    // Add to history
    const newHistoryItem: PitchHistory = {
      id: Date.now().toString(),
      input,
      output: generated,
      type: mode,
      tone: mode === 'notice' ? (tone < 33 ? 'firm' : tone > 66 ? 'friendly' : 'neutral') : undefined,
      createdAt: new Date(),
    };
    
    setHistory([newHistoryItem, ...history]);
    setSelectedHistory(newHistoryItem.id);
    toast.success('Generated successfully!');
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
  };

  const toneLabel = useMemo(() => {
    if (mode === 'notice') {
      return tone < 33 ? 'Firm' : tone > 66 ? 'Friendly' : 'Neutral';
    }
    return null;
  }, [tone, mode]);

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

  // Save to localStorage when offline
  useEffect(() => {
    if (!isOnline && history.length > 0) {
      const lastItem = history[0];
      if (!pendingSync.find(item => item.id === lastItem.id)) {
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
        setPendingSync(parsed);
        if (parsed.length > 0 && isOnline) {
          setHasSyncConflict(true);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [isOnline]);

  // Handle sync and conflict resolution
  const handleReconnectAndUpdate = async () => {
    setIsSyncing(true);
    
    try {
      // Simulate API sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check for conflicts (simulate)
      const hasConflicts = pendingSync.length > 0 && Math.random() > 0.7; // 30% chance of conflict
      
      if (hasConflicts) {
        toast.warning('Sync conflicts detected. Your local changes will be merged.', {
          duration: 4000,
        });
        // In real app, show conflict resolution UI
      }
      
      // Merge pending sync with current history
      const mergedHistory = [...pendingSync, ...history].filter(
        (item, index, self) => index === self.findIndex(t => t.id === item.id)
      );
      
      setHistory(mergedHistory);
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
    <div className="min-h-screen text-white relative pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white">AI Pitch Generator</h1>
                <p className="text-sm text-white/60">Save hours on sponsor outreach with AI-powered pitch generation</p>
              </div>
            </div>
            
            {/* Network Status & Sync */}
            <div className="flex items-center gap-3">
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

            {/* Input Section */}
            <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {mode === 'pitch' ? 'Pitch Details' : 'Notice Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === 'notice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80">Tone</Label>
                      <span className="text-sm font-medium text-white/60">{toneLabel}</span>
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
                    className="min-h-[200px] bg-white/5 text-white border-white/10 placeholder:text-white/40 focus:border-purple-500/50"
                  />
                </div>
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !input.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
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
              </CardContent>
            </Card>

            {/* Output Section */}
            {output && (
              <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Generated {mode === 'pitch' ? 'Pitch' : 'Response'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(output)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <pre className="whitespace-pre-wrap text-sm text-white/90 font-sans leading-relaxed">
                      {output}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Sidebar */}
          <div className="w-80 hidden lg:block">
            <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-24">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No history yet</p>
                    <p className="text-xs mt-1">Generated pitches will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPitchGenerator;

