import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
import { generateScriptWithAI, generateChatResponseWithAI, BriefVariant } from '@/utils/briefGenerator';
import { 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  Sparkles, 
  Star, 
  Video, 
  Percent, 
  Instagram, 
  Users, 
  FileText, 
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Award,
  Check,
  Plus,
  Compass,
  Zap,
  Activity,
  Layers,
  Search,
  Eye,
  Sliders,
  Send,
  Download,
  AlertCircle,
  ThumbsUp,
  X,
  Lock,
  ArrowUpRight,
  PhoneCall,
  Navigation,
  BarChart3,
  CheckSquare,
  SendHorizontal,
  Flame,
  Globe,
  Bell,
  CalendarDays,
  ListTodo,
  Copy,
  PlusCircle,
  MessageCircle,
  ArrowRight
} from 'lucide-react';

interface ContentItem {
  id?: string;
  day: number | null;
  week: number | null;
  type: 'Reel' | 'Carousel' | 'Review' | 'Educational' | 'Influencer' | 'Photo Post' | 'Case Study';
  topic: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Scheduled' | 'Published';
  creator?: string;
  followers?: string;
  details: string;
  hook?: string;
  script?: string;
  caption?: string;
  assets?: string[];
  dueDate?: string;
  publishDate?: string;
  thumbnailUrl?: string;
  priority?: 'Low' | 'Medium' | 'High';
  sourceType?: string;
}

export default function ContentWorkspace() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'dashboard' | 'approvals' | 'creators' | 'vault' | 'ai'>('calendar');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [vaultFilter, setVaultFilter] = useState<'All' | 'Published' | 'Scheduled' | 'Draft'>('All');
  
  // Request Content Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'Reel' | 'Carousel' | 'Testimonial' | 'Google Review Graphic' | 'Influencer Campaign'>('Reel');
  const [requestPriority, setRequestPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [requestNotes, setRequestNotes] = useState('');

  // Comment Modal state for approvals queue
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [activeCommentItem, setActiveCommentItem] = useState<ContentItem | null>(null);
  const [changeComment, setChangeComment] = useState('');

  // New task input state
  const [newTaskText, setNewTaskText] = useState('');

  // Content Brief drawer tab state
  const [briefTab, setBriefTab] = useState<'overview' | 'script' | 'caption' | 'assets'>('overview');

  // Inline Request Changes state (inside drawer)
  const [drawerChangesOpen, setDrawerChangesOpen] = useState(false);
  const [drawerChangeText, setDrawerChangeText] = useState('');

  // Relative updated timestamp state
  const [lastUpdated, setLastUpdated] = useState('2 min ago');

  // File upload state for submission
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Custom script editing state
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [customScriptText, setCustomScriptText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // ── June demo seed data (YOUR DENTIST, Patna) ────────────────────────────
  const DEFAULT_ITEMS: ContentItem[] = [];

  const DEFAULT_TASKS: Array<{ id: number; text: string; dueDate: string; checked: boolean }> = [];

  // Content planner database
  const [items, setItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem('ca_content_workspace_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* fall through to seed */ }
    }
    return DEFAULT_ITEMS;
  });

  // Shoot Checklist with Due Dates
  const [shootTasks, setShootTasks] = useState<Array<{ id: number; text: string; dueDate: string; checked: boolean }>>(() => {
    const saved = localStorage.getItem('ca_content_workspace_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* fall through to seed */ }
    }
    return DEFAULT_TASKS;
  });

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { 
      sender: 'ai', 
      text: "Welcome. Content Workspace Assistant loaded. Select presets below to generate localized scripts, captions, or brief outlines." 
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem('ca_content_workspace_items', JSON.stringify(items));
  }, [items]);

  React.useEffect(() => {
    localStorage.setItem('ca_content_workspace_tasks', JSON.stringify(shootTasks));
  }, [shootTasks]);

  const handleStatusChange = (dayNum: number, nextStatus: ContentItem['status']) => {
    setItems(prev => prev.map(d => {
      if (d.day === dayNum) {
        toast.success(`Day ${dayNum} moved to ${nextStatus.toUpperCase()}`);
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleTaskToggle = (taskId: number) => {
    setShootTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, checked: !task.checked } : task
    ));
  };

  const handleGenerateWithAI = async (variant: BriefVariant) => {
    if (!selectedItem) return;
    setIsAiGenerating(true);
    toast.loading('Generating with NVIDIA AI...', { id: 'ai-gen' });
    try {
      const brief = await generateScriptWithAI(
        selectedItem.topic,
        selectedItem.hook || selectedItem.topic,
        variant,
      );
      if (brief) {
        setItems(prev => prev.map(item => {
          const match = selectedItem.id ? item.id === selectedItem.id : item.topic === selectedItem.topic;
          if (match) {
            const updated = { ...item, hook: brief.hook, script: brief.script, caption: brief.caption, assets: brief.shotList };
            setSelectedItem(updated);
            return updated;
          }
          return item;
        }));
        toast.success('AI script generated!', { id: 'ai-gen' });
      } else {
        toast.error('AI generation unavailable — please try again', { id: 'ai-gen' });
      }
    } catch {
      toast.error('AI generation error — please try again', { id: 'ai-gen' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const newMsg = { sender: 'user' as const, text: aiInput };
    setAiMessages(prev => [...prev, newMsg]);
    const userQuery = aiInput;
    setAiInput('');
    setIsAiLoading(true);

    try {
      const response = await generateChatResponseWithAI(
        userQuery,
        'Dr. Aryan Parmar',
        'YOUR DENTIST',
        'Patna'
      );
      const aiResponse = response || "I'm sorry, I couldn't process that request right now. Please try again.";
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error('[Chat Assistant Error]:', err);
      setAiMessages(prev => [...prev, { sender: 'ai', text: "Error calling AI Assistant. Please check your network and try again." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getStatusColor = (status: ContentItem['status']) => {
    switch (status) {
      case 'Draft': return 'border-l-2 border-l-amber-500/80 border-white/[0.06] bg-amber-500/[0.02] text-amber-400';
      case 'Review': return 'border-l-2 border-l-cyan-500/80 border-white/[0.06] bg-cyan-500/[0.02] text-cyan-400';
      case 'Approved': return 'border-l-2 border-l-purple-500/80 border-white/[0.06] bg-purple-500/[0.02] text-purple-400';
      case 'Scheduled': return 'border-l-2 border-l-orange-500/80 border-white/[0.06] bg-orange-500/[0.02] text-orange-400';
      case 'Published': return 'border-l-2 border-l-emerald-500/80 border-white/[0.06] bg-emerald-500/[0.02] text-emerald-400';
    }
  };

  const getStatusBadgeDot = (status: ContentItem['status']) => {
    switch (status) {
      case 'Draft': return 'bg-amber-500';
      case 'Review': return 'bg-cyan-500';
      case 'Approved': return 'bg-purple-500';
      case 'Scheduled': return 'bg-orange-500';
      case 'Published': return 'bg-emerald-500';
    }
  };

  // ── Brief helper functions ────────────────────────────────────────────────
  const getShootRequirements = (item: ContentItem): string[] => {
    switch (item.type) {
      case 'Reel':
        return ['Doctor talking head (15 sec)', 'Clinic reception shot', 'Dental chair B-roll', 'Close-up of procedure'];
      case 'Influencer':
        return ['Creator walking into clinic', 'Treatment experience footage', 'Creator reaction / testimonial', '3 Stories clips (behind the scenes)'];
      case 'Carousel':
        return ['Branded slide design assets', 'Doctor photo (if required)', 'Clinic logo & color assets'];
      case 'Photo Post':
        return ['High-res clinic interior shot', 'Natural lighting setup', 'Staff in frame (optional)'];
      case 'Educational':
        return ['Infographic design assets', 'Doctor quote or voiceover (optional)', 'Procedure reference photo'];
      case 'Case Study':
        return ['Before photo (patient consent required)', 'After photo (patient consent required)', 'Short doctor explanation clip'];
      case 'Review':
        return ['Google Review screenshot', 'Patient name & rating visible', 'Branded graphic template'];
      default:
        return ['Content brief assets', 'Clinic branding materials'];
    }
  };

  const getShootTime = (type: ContentItem['type']): string => {
    switch (type) {
      case 'Reel': return '15 Minutes';
      case 'Influencer': return '45–60 Minutes';
      case 'Carousel': return '20 Minutes (Design)';
      case 'Photo Post': return '10 Minutes';
      case 'Educational': return '15 Minutes (Design)';
      case 'Case Study': return '30 Minutes';
      case 'Review': return '5 Minutes (Design)';
      default: return '20 Minutes';
    }
  };

  const getDeliverable = (type: ContentItem['type']): string => {
    switch (type) {
      case 'Reel': return 'Instagram Reel (15–30s)';
      case 'Influencer': return 'Influencer Reel + 3 Stories';
      case 'Carousel': return 'Instagram Carousel (5–7 slides)';
      case 'Photo Post': return 'Instagram Photo Post';
      case 'Educational': return 'Educational Infographic Post';
      case 'Case Study': return 'Before/After Case Post';
      case 'Review': return 'Google Review Graphic';
      default: return 'Instagram Post';
    }
  };

  const getManagedStatusLabel = (status: ContentItem['status']) => {
    switch (status) {
      case 'Published': return { dot: 'bg-emerald-500', label: 'Published', sub: 'Created by Creator Armour · Approved by Dr. Aryan' };
      case 'Scheduled': return { dot: 'bg-orange-500', label: 'Scheduled', sub: 'Queued by Creator Armour · Ready to publish' };
      case 'Approved': return { dot: 'bg-purple-500', label: 'Approved', sub: 'Approved by Dr. Aryan · Awaiting scheduling' };
      case 'Review': return { dot: 'bg-cyan-500 animate-pulse', label: 'In Review', sub: 'Awaiting approval from Dr. Aryan' };
      case 'Draft': return { dot: 'bg-amber-500', label: 'Draft', sub: 'Creator Armour preparing this brief' };
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'Reel': return '🎥';
      case 'Carousel': return '📚';
      case 'Review': return '⭐';
      case 'Photo Post': return '📸';
      case 'Educational': return '🎓';
      case 'Influencer': return '🤝';
      case 'Case Study': return '🦷';
      default: return '📄';
    }
  };

  const scheduledCount = items.filter(d => d.status === 'Scheduled' || d.status === 'Published').length;
  const pendingApproval = items.filter(d => d.status === 'Review');

  const activeCreators = Array.from(new Set(items.filter(item => item.creator).map(item => item.creator!))).map(username => {
    const creatorItems = items.filter(item => item.creator === username);
    const hasReview = creatorItems.some(item => item.status === 'Review');
    const hasScheduled = creatorItems.some(item => item.status === 'Scheduled');
    const hasPublished = creatorItems.some(item => item.status === 'Published');
    
    let status = 'Awaiting Shoot';
    let color = 'text-yellow-400 animate-pulse';
    if (hasPublished) {
      status = 'Published';
      color = 'text-emerald-400';
    } else if (hasScheduled) {
      status = 'Scheduled';
      color = 'text-orange-400';
    } else if (hasReview) {
      status = 'Review';
      color = 'text-cyan-400 animate-pulse';
    }
    
    return { username: `@${username}`, status, color };
  });

  const upcomingItems = items
    .filter(item => item.status === 'Scheduled' || item.status === 'Approved' || item.status === 'Review')
    .slice(0, 3);

  const dynamicCreators = items
    .filter(item => item.creator)
    .reduce((acc, item) => {
      const existing = acc.find(c => c.username === item.creator);
      if (existing) {
        if (item.type === 'Reel' || item.type === 'Carousel') {
          existing.deliverables.push(`${item.status === 'Published' ? '✓' : '□'} 1 ${item.type}`);
        }
      } else {
        acc.push({
          username: item.creator!,
          type: item.topic,
          deliverables: [`${item.status === 'Published' ? '✓' : '□'} 1 ${item.type}`],
          status: item.status === 'Published' ? 'Scheduled' : item.status === 'Scheduled' ? 'Scheduled' : 'Awaiting Shoot',
          lastContacted: 'Recently'
        });
      }
      return acc;
    }, [] as Array<{ username: string; type: string; deliverables: string[]; status: string; lastContacted: string }>);

  const handleRequestContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDayNum = items.length + 1;
    const newItem: ContentItem = {
      day: newDayNum,
      week: Math.ceil(newDayNum / 7) || 4,
      type: requestType === 'Reel' ? 'Reel' : requestType === 'Carousel' ? 'Carousel' : requestType === 'Testimonial' ? 'Review' : 'Educational',
      topic: requestNotes || `${requestType} Request`,
      status: 'Draft',
      details: 'Manually requested asset pending Creator Armour production team assignment.',
      priority: requestPriority
    };
    
    setItems(prev => [...prev, newItem]);
    toast.success("Content Request Created");
    setIsRequestModalOpen(false);
    setRequestNotes('');
  };

  const handleOpenCommentModal = (item: ContentItem) => {
    setActiveCommentItem(item);
    setChangeComment('');
    setIsCommentModalOpen(true);
  };

  const handleSubmitChangesFeedback = () => {
    if (!activeCommentItem) return;
    if (!changeComment.trim()) {
      toast.error("Please provide changes feedback.");
      return;
    }
    toast.info(`Feedback sent for Day ${activeCommentItem.day}: "${changeComment}"`);
    setIsCommentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans antialiased overflow-x-hidden selection:bg-cyan-500/20 pb-20 lg:pb-0">
      <SEOHead
        title="Creator Armour | Content Workspace — YOUR DENTIST, Patna"
        description="June content calendar, creator briefs, and approval workflow for YOUR DENTIST. Managed by Creator Armour."
        image="https://creatorarmour.com/og-dentist-workspace.png"
        imageAlt="Creator Armour Content Workspace – Calendar and Content Brief for YOUR DENTIST, Patna"
      />

      {/* Lighting overlay */}
      <div className="absolute top-0 left-1/4 w-[1000px] h-[350px] bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main SaaS Shell */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-60 shrink-0 bg-[#090d16] border-b lg:border-b-0 lg:border-r border-white/[0.06] p-6 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-8">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white block">Creator Armour</span>
                <span className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider">Content Workspace</span>
              </div>
            </div>

            {/* Clinic Card with metrics */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-xs">
                  YD
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-white truncate">YOUR DENTIST</p>
                  <p className="text-[9px] text-neutral-400 truncate">Dr. Aryan Parmar</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 border-t border-white/5 pt-2 text-center text-[9px] font-mono">
                <div>
                  <p className="text-white font-bold">{scheduledCount}</p>
                  <p className="text-neutral-500 uppercase text-[7px] tracking-wider mt-0.5">Sched</p>
                </div>
                <div className="border-x border-white/5">
                  <p className="text-yellow-400 font-bold">{pendingApproval.length}</p>
                  <p className="text-neutral-500 uppercase text-[7px] tracking-wider mt-0.5">Pend</p>
                </div>
                <div>
                   <p className="text-purple-400 font-bold">{activeCreators.length}</p>
                   <p className="text-neutral-500 uppercase text-[7px] tracking-wider mt-0.5">Active</p>
                </div>
              </div>
            </div>

            {/* Workspace tabs */}
            <nav className="space-y-1">
              {[
                { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                { id: 'dashboard', label: 'Dashboard', icon: Activity },
                { id: 'approvals', label: 'Approvals', icon: CheckSquare },
                { id: 'creators', label: 'Creators', icon: Users },
                { id: 'vault', label: 'Content Vault', icon: FileText },
                { id: 'ai', label: 'AI Assistant', icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-3 transition-all ${
                      activeTab === tab.id 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/[0.06] mt-8 lg:mt-0 flex flex-col gap-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
            <span>Sync Status: Live</span>
            <span>Version v1.2</span>
          </div>
        </aside>

        {/* Main Panel App Window */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black uppercase text-white tracking-wide">Dr. Aryan's Workspace</h1>
                <span className="text-[9px] text-neutral-400 font-mono font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-lg">
                  Last updated {lastUpdated}
                </span>
              </div>
              
              {/* June Progress Bar prominently under title */}
              <div className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl flex items-center justify-between gap-6 max-w-md w-full">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase">June Progress</p>
                  <p className="text-[10px] font-mono text-cyan-400 font-bold mt-0.5">{scheduledCount} / 16 Posts Delivered</p>
                </div>
                <div className="flex-1 max-w-[200px] flex items-center gap-3">
                  <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((scheduledCount / 16) * 100))}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-black text-cyan-400">{Math.min(100, Math.round((scheduledCount / 16) * 100))}%</span>
                </div>
              </div>
            </div>

            {/* Desktop Request Button */}
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="hidden lg:flex px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider items-center gap-2 shadow-lg shadow-cyan-500/10 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Request Content
            </button>
          </header>

          {/* MOBILE FLOATING ACTION BUTTON */}
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* DEFAULT TAB LANDING: CALENDAR PLANNER */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left Column: Hero Content Calendar (65%) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <CalendarIcon className="h-4.5 w-4.5 text-cyan-400" /> June Content Calendar
                    </h2>
                    <span className="text-[9px] text-neutral-500 uppercase font-mono">30-Day Workspace</span>
                  </div>

                  {/* Calendar Grid Week-by-Week (COMPRESSED CARDS) */}
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-white/[0.06] rounded-xl">
                      <CalendarIcon className="h-8 w-8 text-neutral-700" />
                      <div className="text-center">
                        <p className="text-xs font-black uppercase text-neutral-500 tracking-wider">No content scheduled yet</p>
                        <p className="text-[10px] text-neutral-600 mt-1">Use ➕ Request Content to add your first post</p>
                      </div>
                      <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        + Request First Content
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[1, 2, 3, 4].map((weekNum) => {
                        const weekItems = items.filter(d => d.week === weekNum);
                        if (weekItems.length === 0) return null;
                        return (
                          <div key={weekNum} className="space-y-2.5">
                            <p className="text-[9.5px] font-black uppercase tracking-widest text-neutral-500">Week {weekNum}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {weekItems.map((item) => (
                                <div 
                                  key={item.day}
                                  onClick={() => setSelectedItem(item)}
                                  className={`border hover:border-cyan-500/40 p-3 rounded-lg cursor-pointer hover:bg-white/[0.02] transition-all flex flex-col justify-between min-h-[72px] group ${getStatusColor(item.status)}`}
                                >
                                  <div className="min-w-0">
                                    <span className="text-[8px] font-mono font-bold text-neutral-500 block uppercase">DAY {item.day}</span>
                                    <p className="text-xs font-black uppercase text-white truncate max-w-full leading-tight mt-1">
                                      {getTypeIcon(item.type)} {item.topic}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-1.5">
                                    <span className="text-[7.5px] font-bold uppercase tracking-wider">
                                      {item.status}
                                    </span>
                                    {item.creator && (
                                      <span className="text-[7.5px] font-bold text-amber-400 truncate max-w-[60px]">@{item.creator}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Draft Ideas Queue Panel */}
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <ListTodo className="h-4.5 w-4.5 text-purple-400" /> Draft Ideas Queue
                    </h3>
                    <span className="text-[9px] text-neutral-500 uppercase font-mono bg-white/5 px-2 py-0.5 rounded">
                      {items.filter(item => item.day === null).length} Ideas
                    </span>
                  </div>

                  {items.filter(item => item.day === null).length === 0 ? (
                    <p className="text-[10px] text-neutral-500 italic text-center py-4">
                      No draft ideas saved yet. Save ideas from the Dental Trend Finder to plan them here!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.filter(item => item.day === null).map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="border border-white/[0.06] bg-white/[0.01] hover:border-cyan-500/40 p-4 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-all flex flex-col justify-between h-[130px] group border-l-2 border-l-purple-500/80"
                        >
                          <div className="min-w-0">
                            <span className="text-[8px] font-mono font-black text-purple-400 block uppercase">
                              {item.sourceType === 'trend-finder' ? '⚡ TREND FINDER DRAFT' : 'DRAFT IDEA'}
                            </span>
                            <h4 className="text-xs font-black uppercase text-white truncate leading-tight mt-1">
                              {getTypeIcon(item.type)} {item.topic}
                            </h4>
                            <p className="text-[10px] text-neutral-400 line-clamp-2 mt-1 font-medium leading-tight">
                              {item.details}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const maxDay = items.reduce((max, i) => i.day && i.day > max ? i.day : max, 0);
                                const nextDay = maxDay + 1;
                                const nextWeek = Math.ceil(nextDay / 7);
                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, day: nextDay, week: nextWeek } : i));
                                toast.success(`Scheduled "${item.topic}" to Calendar (Day ${nextDay})!`);
                              }}
                              className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                            >
                              Schedule to Calendar →
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItems(prev => prev.filter(i => i.id !== item.id));
                                toast.success(`Deleted draft "${item.topic}"`);
                              }}
                              className="text-[9px] font-black text-rose-500/80 hover:text-rose-400 uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Tasks and Approvals (35%) */}
              <div className="lg:col-span-4 space-y-6">
                {/* To-Do List */}
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-cyan-400" /> Action Items
                  </h3>
                  <div className="space-y-2">
                    {shootTasks.map((task) => (
                      <div 
                        key={task.id} 
                        onClick={() => handleTaskToggle(task.id)}
                        className="flex items-start justify-between gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={task.checked} 
                            onChange={() => {}}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                          />
                          <span className={`text-[10px] leading-tight font-medium ${
                            task.checked ? 'text-neutral-500 line-through' : 'text-neutral-300'
                          }`}>
                            {task.text}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 font-bold shrink-0 self-center">Due: {task.dueDate}</span>
                      </div>
                    ))}
                    {shootTasks.length === 0 && (
                      <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider text-center py-3">No tasks yet</p>
                    )}
                  </div>
                  {/* Inline quick-add */}
                  <div className="flex gap-2 border-t border-white/5 pt-3">
                    <input
                      type="text"
                      placeholder="Add a task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskText.trim()) {
                          setShootTasks(prev => [...prev, { id: Date.now(), text: newTaskText.trim(), dueDate: 'Soon', checked: false }]);
                          setNewTaskText('');
                          toast.success('Task added');
                        }
                      }}
                      className="flex-1 bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-[10px] outline-none text-white placeholder:text-neutral-600 focus:border-cyan-500/30"
                    />
                    <button
                      onClick={() => {
                        if (!newTaskText.trim()) return;
                        setShootTasks(prev => [...prev, { id: Date.now(), text: newTaskText.trim(), dueDate: 'Soon', checked: false }]);
                        setNewTaskText('');
                        toast.success('Task added');
                      }}
                      className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Active Creators Widget */}
                {activeCreators.length > 0 && (
                  <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" /> Active Creators
                    </h3>
                    <div className="space-y-2">
                      {activeCreators.map((creator, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.01] border border-white/[0.04] px-3 py-2.5 rounded-xl">
                          <span className="text-[10px] font-black text-amber-400">{creator.username}</span>
                          <span className={`text-[8.5px] font-black uppercase tracking-wider ${creator.color}`}>{creator.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming This Week Widget */}
                {upcomingItems.length > 0 && (
                  <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-cyan-400" /> Upcoming This Week
                    </h3>
                    <div className="space-y-2">
                      {upcomingItems.map((item) => (
                        <div
                          key={item.day}
                          onClick={() => setSelectedItem(item)}
                          className={`flex items-center gap-3 border px-3 py-2.5 rounded-xl cursor-pointer hover:border-cyan-500/30 transition-all ${getStatusColor(item.status)}`}
                        >
                          <span className="text-sm">{getTypeIcon(item.type)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase text-white truncate">{item.topic}</p>
                            <p className="text-[8px] font-mono text-neutral-500 uppercase mt-0.5">Day {item.day}</p>
                          </div>
                          <ChevronRight className="h-3 w-3 text-neutral-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approvals Queue Upgraded with icon buttons */}
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <CheckSquare className="h-4.5 w-4.5 text-cyan-400" /> Approvals Queue
                  </h3>

                  <div className="space-y-2.5">
                    {pendingApproval.map((item) => (
                      <div key={item.day} className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase text-white truncate max-w-[190px]">{item.topic}</p>
                            <p className="text-[8.5px] text-neutral-400 mt-1 uppercase font-bold">
                              {item.creator ? `Creator: ${item.creator}` : `Due: ${item.dueDate || 'Soon'}`}
                            </p>
                          </div>
                          <span className="text-[7.5px] font-mono font-black uppercase bg-white/5 px-1.5 py-0.5 rounded text-neutral-500">{item.type}</span>
                        </div>

                        <div className="flex gap-2 border-t border-white/5 pt-3">
                          <button 
                            onClick={() => handleStatusChange(item.day, 'Approved')}
                            className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase text-[9px] rounded-lg tracking-wider transition-all flex items-center justify-center gap-1"
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => handleOpenCommentModal(item)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase text-[9px] rounded-lg tracking-wider transition-all flex items-center justify-center gap-1"
                          >
                            ✏️ Feedback
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingApproval.length === 0 && (
                      <div className="text-center p-6 text-[10px] text-neutral-600 font-bold uppercase tracking-wider">
                        All items approved
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB CONTENT: DASHBOARD (METRICS AND HEALTH OVERVIEWS) */}
          {activeTab === 'dashboard' && (
            <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-6 animate-fadeIn">
              
              {/* KPI Cards Grid */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
{(() => {
                  const completionPct = Math.min(100, Math.round((scheduledCount / 16) * 100));
                  const creatorNames = activeCreators.map(c => c.username).join(', ') || 'No creators yet';
                  return [
                    { title: 'Posts Scheduled', value: scheduledCount, sub: 'Calendar target ready', color: 'text-cyan-400' },
                    { title: 'Pending Approval', value: pendingApproval.length, sub: 'Needs dentist action', color: 'text-yellow-400' },
                    { title: 'Active Creators', value: activeCreators.length, sub: creatorNames, color: 'text-purple-400' },
                    { title: 'Completion %', value: `${completionPct}%`, sub: `${scheduledCount} / 16 Content completed`, color: 'text-emerald-400' }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">{kpi.title}</p>
                      <p className={`text-2xl font-black font-mono mt-2 ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">{kpi.sub}</p>
                    </div>
                  ));
                })()}
              </section>

              {/* Progress bar prominent display */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black uppercase text-white">Current Month Content Progress</p>
                  <span className="text-sm font-mono text-cyan-400 font-black">{Math.min(100, Math.round((scheduledCount / 16) * 100))}% Complete</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((scheduledCount / 16) * 100))}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-white/[0.01] p-5 rounded-xl border border-white/[0.04] space-y-4">
                  <h3 className="text-xs font-black uppercase text-neutral-400">Content Consistency Status</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Ultrasonic Cleaning Reel</span>
                      <span className="text-emerald-400">Published</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Shambhavi Sinha Experience Vlog</span>
                      <span className="text-emerald-400">Published</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.04]">
                      <span>Implant vs Denture Carousel</span>
                      <span className="text-cyan-400">In Review</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.01] p-5 rounded-xl border border-white/[0.04] space-y-4">
                  <h3 className="text-xs font-black uppercase text-neutral-400">Barter Campaign Operations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs items-center">
                      <span>Live Campaigns</span>
                      <span className="font-mono text-cyan-400 font-bold">2 Slots</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span>Outreach Response</span>
                      <span className="font-mono text-white">88% Compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4 animate-fadeIn">
              <h2 className="text-sm font-black uppercase text-white">Pending Approvals Queue</h2>
              <p className="text-xs text-neutral-400">Review scripts, visual hooks, and media assets below. Approving pushes posts to scheduled queue status.</p>

              <div className="space-y-3 pt-2">
                {pendingApproval.map((item) => (
                  <div key={item.day} className="bg-white/[0.01] border border-white/[0.04] p-4.5 rounded-xl flex justify-between items-center gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-black uppercase text-white truncate">{item.topic}</p>
                      <p className="text-[9px] text-neutral-400 uppercase font-bold">Type: {item.type} · Target Day {item.day}</p>
                      {item.hook && <p className="text-[10px] text-cyan-400 leading-normal italic font-medium">"{item.hook}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusChange(item.day, 'Approved')}
                        className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase text-[10px] rounded-lg tracking-wider transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}

                {pendingApproval.length === 0 && (
                  <div className="text-center p-12 text-xs text-neutral-600 font-bold uppercase tracking-wider border border-dashed border-white/5 rounded-xl">
                    All drafts have been successfully reviewed and approved.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CREATORS */}
          {activeTab === 'creators' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-black uppercase text-white">Influencer Collaborations Checklist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {[
                    { username: 'ft.shambhavi_', type: 'Teeth Cleaning Experience', deliverables: ['✓ 1 Reel', '✓ 3 Stories'], status: 'Scheduled', lastContacted: '2 days ago' },
                    { username: 'patnafoodie', type: 'Smile Consultation', deliverables: ['□ 1 Reel', '□ 4 Stories'], status: 'Awaiting Shoot', lastContacted: 'Today' }
                  ].map((creator, idx) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/[0.04] p-4.5 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black uppercase text-white">@{creator.username}</p>
                          <p className="text-[10px] text-cyan-400 mt-0.5">{creator.type}</p>
                        </div>
                        <span className="text-[8px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {creator.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8.5px] font-black uppercase text-neutral-500 tracking-wider">Deliverables:</p>
                        {creator.deliverables.map((del, i) => (
                          <p key={i} className="text-[10px] font-mono text-neutral-300">{del}</p>
                        ))}
                      </div>
                      <div className="border-t border-white/5 pt-2 text-[9.5px] text-neutral-500 font-bold uppercase">
                        Last Contacted: {creator.lastContacted}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: CONTENT VAULT FILTERABLE WITH HOVER CONTROLS */}
          {activeTab === 'vault' && (
            <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-white">Content Vault</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Clinic visual asset collection with status-based filtering.</p>
                </div>
                {/* Vault Filters */}
                <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
                  {(['All', 'Published', 'Scheduled', 'Draft'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setVaultFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all ${
                        vaultFilter === filter 
                          ? 'bg-cyan-500 text-black shadow-md' 
                          : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Vault items filter check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items
                  .filter(d => vaultFilter === 'All' || d.status === vaultFilter)
                  .map((item) => (
                    <div key={item.day} className={`border p-4 rounded-xl space-y-3.5 transition-all relative flex flex-col justify-between overflow-hidden group ${getStatusColor(item.status)}`}>
                      
                      {/* Media preview thumbnail */}
                      <div className="aspect-[16/10] bg-neutral-950 border border-white/5 rounded-lg overflow-hidden relative">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.topic} className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600 font-bold uppercase tracking-wider">No Media</div>
                        )}
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[7px] font-mono text-cyan-400 font-bold border border-white/5">
                          {getTypeIcon(item.type)} {item.type}
                        </span>

                        {/* HOVER OVERLAY WITH CONTROLS */}
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="w-[100px] py-1 bg-cyan-500 text-black text-[9px] font-black uppercase tracking-wider rounded transition-all hover:bg-cyan-600"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => {
                              toast.success("Content asset duplicated!");
                              setItems(prev => [...prev, { ...item, day: prev.length + 1, status: 'Draft' }]);
                            }}
                            className="w-[100px] py-1 bg-white/5 text-white border border-white/10 text-[9px] font-black uppercase tracking-wider rounded transition-all hover:bg-white/10"
                          >
                            Duplicate
                          </button>
                          <button 
                            onClick={() => {
                              handleStatusChange(item.day, 'Scheduled');
                            }}
                            className="w-[100px] py-1 bg-white/5 text-white border border-white/10 text-[9px] font-black uppercase tracking-wider rounded transition-all hover:bg-white/10"
                          >
                            Schedule
                          </button>
                        </div>

                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-mono text-neutral-500 font-bold uppercase">
                          <span>Day {item.day}</span>
                          <span>{item.publishDate || 'Upcoming'}</span>
                        </div>
                        <p className="text-xs font-black uppercase text-white leading-tight truncate max-w-full">{item.topic}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div className="bg-gradient-to-b from-cyan-950/10 to-indigo-950/10 border border-cyan-500/10 rounded-[32px] p-6 space-y-6 animate-fadeIn">
              
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-black uppercase text-white tracking-wider">AI Content Assistant</h2>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Generate scripts, story polls, captions, briefs, or reviews graphics.</p>
                  </div>
                </div>
              </div>

              {/* Chat Viewport */}
              <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-5 h-[360px] overflow-y-auto space-y-4 scrollbar-none">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                        : 'bg-white/5 text-neutral-300 border border-white/[0.04]'
                    }`}>
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? 'mt-1' : ''}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/[0.04] p-4 rounded-2xl text-xs text-neutral-400 animate-pulse flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-spin text-cyan-400" />
                      Generating content template...
                    </div>
                  </div>
                )}
              </div>

              {/* Context-aware prompt chips refined */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { label: '🎬 Generate Reel Script', query: 'Generate Reel Script' },
                  { label: '🎠 Create Implant Carousel', query: 'Create Implant Carousel outline' },
                  { label: '✍️ Write Teeth Cleaning Caption', query: 'Write Teeth Cleaning Caption' },
                  { label: '📋 Create Patna Influencer Brief', query: 'Create Patna Influencer Brief' },
                  { label: '🖼 Generate Patient Testimonial Post', query: 'Generate Patient Testimonial Post template' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setAiInput(preset.query);
                    }}
                    className="px-3.5 py-2 bg-[#090d16] border border-white/[0.06] hover:bg-cyan-500 hover:text-black hover:border-cyan-500 rounded-xl text-xs font-bold text-neutral-400 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="relative pt-2">
                <input 
                  type="text" 
                  placeholder="Type a content query or select a preset prompt..." 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-xl px-4 py-3 pr-12 text-sm outline-none placeholder:text-neutral-600 focus:border-cyan-500/40"
                />
                <button 
                  onClick={handleSendAiMessage}
                  className="absolute right-2 top-4 p-1.5 hover:bg-white/5 rounded-lg text-cyan-400 transition-all"
                >
                  <SendHorizontal className="h-4.5 w-4.5" />
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* REQUEST CONTENT DIALOG */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.form 
              onSubmit={handleRequestContentSubmit}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[420px] bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <ListTodo className="h-4.5 w-4.5 text-cyan-400" /> Request Content
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content Type options */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-black text-neutral-500">Content Type</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Reel', 'Carousel', 'Testimonial', 'Google Review Graphic', 'Influencer Campaign'].map((type) => (
                    <label key={type} className="flex items-center gap-2 bg-black/40 border border-white/[0.06] p-2 rounded-lg cursor-pointer hover:border-cyan-500/20">
                      <input 
                        type="radio" 
                        name="requestType" 
                        checked={requestType === type}
                        onChange={() => setRequestType(type as any)}
                        className="text-cyan-500 focus:ring-0 focus:ring-offset-0" 
                      />
                      <span className="text-neutral-300 font-semibold">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority options */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-black text-neutral-500">Priority</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setRequestPriority(priority)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                        requestPriority === priority 
                          ? 'bg-cyan-500 text-black border-cyan-500 shadow-md' 
                          : 'bg-black/40 text-neutral-400 border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-black text-neutral-500">Notes / Details</label>
                <textarea 
                  placeholder="Describe your request..." 
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full h-20 bg-black/60 border border-white/[0.08] rounded-xl p-3 text-xs outline-none focus:border-cyan-500/20 text-white placeholder:text-neutral-600 resize-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Submit Request
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* COMMENTS FEEDBACK MODAL */}
      <AnimatePresence>
        {isCommentModalOpen && activeCommentItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[400px] bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-xs font-black uppercase text-white tracking-widest">Request Changes Feedback</h3>
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <span className="text-[8px] font-black uppercase text-neutral-500">Day {activeCommentItem.day} topic</span>
                <p className="text-xs font-black uppercase text-white mt-1 leading-tight">{activeCommentItem.topic}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] uppercase font-black text-neutral-500">Feedback / Notes</label>
                <textarea 
                  placeholder='e.g., "Change cover image", "Add clinic address in caption"' 
                  value={changeComment}
                  onChange={(e) => setChangeComment(e.target.value)}
                  className="w-full h-24 bg-black/60 border border-white/[0.08] rounded-xl p-3 text-xs outline-none focus:border-cyan-500/20 text-white placeholder:text-neutral-600 resize-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitChangesFeedback}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL DRAWER — TABBED CONTENT BRIEF */}
      <AnimatePresence>
        {selectedItem && (() => {
          const managed = getManagedStatusLabel(selectedItem.status)!;
          const shootReqs = getShootRequirements(selectedItem);
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[520px] h-full bg-[#07091280] backdrop-blur-xl border-l border-white/[0.07] flex flex-col"
              >
                {/* ── Drawer Header ───────────────────────────────────────────── */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06] space-y-4">

                  {/* Top bar */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest">DAY {selectedItem.day} · WK {selectedItem.week}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-neutral-400">
                          {getTypeIcon(selectedItem.type)} {selectedItem.type}
                        </span>
                      </div>
                      <h2 className="text-sm font-black uppercase text-white leading-tight pr-6">{selectedItem.topic}</h2>
                    </div>
                    <button
                      onClick={() => { setSelectedItem(null); setDrawerChangesOpen(false); setBriefTab('overview'); }}
                      className="flex-shrink-0 p-1.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-all"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Managed status block */}
                  <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3.5 py-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${managed.dot}`} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-white tracking-wide">{managed.label}</p>
                      <p className="text-[8.5px] text-neutral-500 font-bold mt-0.5 truncate">{managed.sub}</p>
                    </div>
                    <select
                      value={selectedItem.status}
                      onChange={(e) => handleStatusChange(selectedItem.day, e.target.value as ContentItem['status'])}
                      className="ml-auto bg-transparent text-[8px] text-neutral-500 outline-none cursor-pointer font-black uppercase hover:text-white transition-colors border-0"
                    >
                      {(['Draft', 'Review', 'Approved', 'Scheduled', 'Published'] as const).map(st => (
                        <option key={st} value={st} className="bg-[#0a0f1d]">{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Meta row: shoot time · deliverable · publish date */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: '⏱', label: 'Shoot Time', value: getShootTime(selectedItem.type) },
                      { icon: '🎬', label: 'Deliverable', value: getDeliverable(selectedItem.type) },
                      { icon: '📅', label: 'Publish Date', value: selectedItem.publishDate || 'TBD' },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
                        <p className="text-base leading-none">{m.icon}</p>
                        <p className="text-[7px] font-black uppercase text-neutral-600 tracking-wider mt-1">{m.label}</p>
                        <p className="text-[9px] font-black text-white mt-0.5 leading-tight">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Creator badge (if influencer) */}
                  {selectedItem.creator && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-amber-500/80 tracking-wider">Collaborating Creator</p>
                        <p className="text-xs font-black text-amber-400 mt-0.5">@{selectedItem.creator}</p>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-400">{selectedItem.followers} followers</span>
                    </div>
                  )}

                  {/* Tab bar */}
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.05]">
                    {(['overview', 'script', 'caption', 'assets'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setBriefTab(tab)}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          briefTab === tab ? 'bg-cyan-500 text-black shadow-md' : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Tab Content ─────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3.5 scrollbar-none">

                  {/* OVERVIEW TAB */}
                  {briefTab === 'overview' && (
                    <>
                      {/* Objective */}
                      <div className="bg-[#070b16] border border-white/5 rounded-xl p-4">
                        <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">🎯 Objective</span>
                        <p className="text-xs text-neutral-300 leading-relaxed mt-2 font-medium">{selectedItem.details}</p>
                      </div>

                      {/* Source Attribution */}
                      {(selectedItem as any).source && (
                        <div className="bg-[#070b16] border border-white/5 rounded-xl p-4">
                          <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">🔗 Source Attribution</span>
                          <p className="text-xs text-purple-300 leading-relaxed mt-2 font-bold flex items-center gap-1.5">
                            ✨ Generated from {(selectedItem as any).source}
                          </p>
                        </div>
                      )}

                      {/* Hook */}
                      {selectedItem.hook && (
                        <div className="bg-[#070b16] border border-white/5 rounded-xl p-4">
                          <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider">⚡ Visual Hook (0–3 sec)</span>
                          <p className="text-xs font-black text-white mt-2 leading-normal italic">"{selectedItem.hook}"</p>
                        </div>
                      )}

                      {/* Shoot Requirements */}
                      <div className="bg-[#070b16] border border-white/5 rounded-xl p-4 space-y-2.5">
                        <span className="text-[8px] font-black uppercase text-orange-400 tracking-wider">📹 Shoot Requirements</span>
                        <ul className="space-y-1.5 mt-1">
                          {shootReqs.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-[10px] text-neutral-300 font-medium leading-tight">
                              <span className="w-1 h-1 rounded-full bg-orange-500/60 flex-shrink-0 mt-1.5" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* SCRIPT TAB */}
                  {briefTab === 'script' && (
                    <>
                      {/* AI Generate Button */}
                      <div className="bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-3.5 space-y-2.5">
                        <span className="text-[8px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> NVIDIA AI Script Generator
                        </span>
                        <p className="text-[9px] text-neutral-400 leading-relaxed">
                          Pick a style — NVIDIA AI writes a fresh script for <span className="text-white font-semibold">{selectedItem.topic}</span> in seconds.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['hinglish', 'shorter', 'viral', 'professional', 'hindi', 'english'] as const).map(variant => (
                            <button
                              key={`ai-${variant}`}
                              disabled={isAiGenerating}
                              onClick={() => handleGenerateWithAI(variant)}
                              className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-purple-200 transition-all flex items-center gap-1"
                            >
                              {isAiGenerating ? <span className="animate-pulse">...</span> : <Sparkles className="w-2.5 h-2.5" />}
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>



                      {selectedItem.script ? (
                        <div className="bg-[#070b16] border border-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">📝 Full Script / Slide Layout</span>
                            {!isEditingScript ? (
                              <button
                                onClick={() => {
                                  setIsEditingScript(true);
                                  setCustomScriptText(selectedItem.script || '');
                                }}
                                className="text-[9px] font-black uppercase text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                Edit Script
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setItems(prev => prev.map(item => {
                                      const match = selectedItem.id ? item.id === selectedItem.id : item.topic === selectedItem.topic;
                                      if (match) {
                                        const updated = { ...item, script: customScriptText };
                                        setSelectedItem(updated);
                                        return updated;
                                      }
                                      return item;
                                    }));
                                    setIsEditingScript(false);
                                    toast.success('Custom script saved successfully!');
                                  }}
                                  className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setIsEditingScript(false)}
                                  className="text-[9px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                          {!isEditingScript ? (
                            <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed font-medium whitespace-pre-line">{selectedItem.script}</p>
                          ) : (
                            <textarea
                              value={customScriptText}
                              onChange={(e) => setCustomScriptText(e.target.value)}
                              rows={10}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-neutral-300 outline-none focus:border-cyan-500/30 font-medium resize-y"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-white/[0.05] rounded-xl">
                          <span className="text-2xl">📝</span>
                          <p className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">Script coming soon</p>
                          <p className="text-[9px] text-neutral-700">Creator Armour team is preparing this</p>
                        </div>
                      )}
                      {selectedItem.hook && (
                        <div className="bg-[#070b16] border border-white/5 rounded-xl p-4">
                          <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider">⚡ Opening Hook</span>
                          <p className="text-xs font-black text-white mt-2 leading-normal italic">"{selectedItem.hook}"</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* CAPTION TAB */}
                  {briefTab === 'caption' && (
                    <>
                      {selectedItem.caption ? (
                        <div className="bg-[#070b16] border border-white/5 rounded-xl p-4 space-y-3">
                          <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">📸 Instagram Caption Draft</span>
                          <p className="text-xs text-neutral-300 leading-relaxed font-medium">{selectedItem.caption}</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(selectedItem.caption || ''); toast.success('Caption copied!'); }}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <Copy className="h-3 w-3" /> Copy Caption
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-white/[0.05] rounded-xl">
                          <span className="text-2xl">✍️</span>
                          <p className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">Caption coming soon</p>
                        </div>
                      )}
                      {/* Hashtag suggestion */}
                      <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3.5">
                        <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">#️⃣ Suggested Hashtags</span>
                        <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">#YourDentistPatna #DrAryanParmar #DentalCarePatna #PatnaDentist #PatliputraColony #SmilePatna #DentalHealthIndia</p>
                      </div>
                    </>
                  )}

                  {/* ASSETS TAB */}
                  {briefTab === 'assets' && (
                    <>
                      <div className="bg-[#070b16] border border-white/5 rounded-xl p-4 space-y-2.5">
                        <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">📦 Required Assets</span>
                        <ul className="space-y-1.5 mt-1">
                          {shootReqs.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-[10px] text-neutral-300 font-medium leading-tight">
                              <span className="w-1 h-1 rounded-full bg-emerald-500/60 flex-shrink-0 mt-1.5" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3.5 space-y-2">
                        <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">🏥 Brand Assets</span>
                        {['YOUR DENTIST logo (white)', 'Brand colors: #0ea5e9 / #ffffff', 'Clinic address: Patliputra Colony, Patna', 'Contact: +91 XXXXX XXXXX', 'Instagram: @your.dentist.patna'].map((asset, i) => (
                          <p key={i} className="text-[10px] text-neutral-400 font-medium">{asset}</p>
                        ))}
                      </div>
                      {selectedItem.creator && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                          <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">🤝 Creator Deliverables</span>
                          <p className="text-[10px] text-neutral-300 font-medium">1× Reel (15–30s, vertical, H.264)</p>
                          <p className="text-[10px] text-neutral-300 font-medium">3× Instagram Stories</p>
                          <p className="text-[10px] text-neutral-300 font-medium">Raw footage submitted within 48h of shoot</p>
                        </div>
                      )}

                      {/* Submit Raw Video Footages */}
                      <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 space-y-3">
                        <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-cyan-400" /> Submit Raw Video Footage
                        </span>
                        <p className="text-[10px] text-neutral-400 font-medium leading-normal">
                          Finished shooting? Upload your raw video files here. We will handle editing, color grading, and rendering.
                        </p>

                        {/* File Upload Drop Zone */}
                        <div className="border border-dashed border-white/10 hover:border-cyan-500/30 rounded-lg p-4 text-center cursor-pointer transition-colors relative bg-black/30">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFile(file);
                                setIsUploading(true);
                                setUploadProgress(0);
                                const interval = setInterval(() => {
                                  setUploadProgress(prev => {
                                    if (prev >= 100) {
                                      clearInterval(interval);
                                      setIsUploading(false);
                                      toast.success(`"${file.name}" uploaded successfully! Ready for submission.`);
                                      return 100;
                                    }
                                    return prev + 20;
                                  });
                                }, 200);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {!uploadedFile ? (
                            <div className="space-y-1">
                              <span className="text-xl block">📤</span>
                              <span className="text-[10px] font-bold text-neutral-400 block">Click or Drag video to upload</span>
                              <span className="text-[8px] text-neutral-600 block">MP4, MOV up to 150MB</span>
                            </div>
                          ) : (
                            <div className="space-y-2 text-left">
                              <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400">
                                <span className="truncate max-w-[80%]">📹 {uploadedFile.name}</span>
                                <span>{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                              </div>
                              {isUploading ? (
                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-cyan-500 h-1.5 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              ) : (
                                <div className="flex justify-between items-center text-[8px] text-emerald-400 font-bold uppercase">
                                  <span>✅ Ready for editor review</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                    className="text-[8px] text-red-400 hover:text-red-300 font-black font-sans uppercase tracking-wider"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          disabled={!uploadedFile || isUploading}
                          onClick={() => {
                            setItems(prev => prev.map(item => {
                              const match = selectedItem.id ? item.id === selectedItem.id : item.topic === selectedItem.topic;
                              if (match) {
                                const updated = { 
                                  ...item, 
                                  status: 'Review' as const,
                                  assets: [...(item.assets || []), `Raw Video: ${uploadedFile?.name || 'footage.mp4'}`]
                                };
                                setSelectedItem(updated);
                                return updated;
                              }
                              return item;
                            }));
                            setUploadedFile(null);
                            toast.success('Raw video footage submitted for editing! Status changed to Review.');
                          }}
                          className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3 h-3" /> Submit Footage for Editing
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Inline Request Changes ─────────────────────────────── */}
                  <div className="border-t border-white/[0.05] pt-4 mt-2">
                    {!drawerChangesOpen ? (
                      <button
                        onClick={() => setDrawerChangesOpen(true)}
                        className="w-full py-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> 💬 Request Changes
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">💬 What would you like changed?</p>
                        <textarea
                          autoFocus
                          placeholder={'e.g., "Add clinic address", "Use Hindi", "Change hook", "Mention implants"'}
                          value={drawerChangeText}
                          onChange={(e) => setDrawerChangeText(e.target.value)}
                          className="w-full h-20 bg-black/60 border border-white/[0.08] rounded-xl p-3 text-xs outline-none focus:border-cyan-500/30 text-white placeholder:text-neutral-600 resize-none font-medium"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDrawerChangesOpen(false); setDrawerChangeText(''); }}
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!drawerChangeText.trim()) { toast.error('Please describe the change.'); return; }
                              toast.success(`Changes requested for "${selectedItem.topic}"`);
                              setDrawerChangesOpen(false);
                              setDrawerChangeText('');
                            }}
                            className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            Submit Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Drawer Footer ────────────────────────────────────────── */}
                <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-white/[0.06] flex gap-2">
                  <button
                    onClick={() => toast.success('Brief downloaded!')}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Brief
                  </button>
                  <button
                    onClick={() => { setSelectedItem(null); setDrawerChangesOpen(false); setBriefTab('overview'); }}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Close Brief
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-[10px] text-neutral-600 uppercase tracking-widest bg-[#090d16] relative z-20">
        © {new Date().getFullYear()} Creator Armour · Content Workspace
      </footer>
    </div>
  );
}
