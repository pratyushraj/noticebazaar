import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
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
  MessageCircle
} from 'lucide-react';

interface ContentItem {
  day: number;
  week: number;
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

  // Relative updated timestamp state
  const [lastUpdated, setLastUpdated] = useState('2 min ago');

  // Content planner database
  const [items, setItems] = useState<ContentItem[]>([
    { 
      day: 1, 
      week: 1,
      type: 'Reel', 
      topic: 'Meet Dr. Aryan Parmar & Clinic Introduction', 
      status: 'Published', 
      publishDate: 'June 1, 2026',
      details: 'Sleek walkthrough introducing Dr. Aryan and team under warm aesthetic lighting.',
      hook: 'POV: You finally found a dental clinic in Patna that feels like a luxury lounge.',
      script: '[Scene: Dr. Aryan welcomes patient with warm smile] Dr. Aryan: "Welcome to YOUR DENTIST. We believe your visit should be completely stress-free."',
      caption: 'Welcome to YOUR DENTIST in Patliputra. Painless, modern dental care designed for comfort. 🩺✨',
      thumbnailUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 2, 
      week: 1,
      type: 'Carousel', 
      topic: '5 Signs You Need a Dental Checkup', 
      status: 'Scheduled', 
      publishDate: 'June 3, 2026',
      details: 'Slide-by-slide checklist covering early warning signs of decay.',
      hook: '5 Silent signs your teeth are crying for help.',
      script: 'Slide 1: Cover. Slide 2: Bleeding gums. Slide 3: Persistent bad breath. Slide 4: Hot/Cold sensitivity. Slide 5: Gum recession.',
      caption: 'Don\'t wait for the toothache. Catch the early signs of decay. 🦷 Swipe to read!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 3, 
      week: 1,
      type: 'Photo Post', 
      topic: 'Clinic Interior & Facilities', 
      status: 'Published', 
      publishDate: 'May 28, 2026',
      details: 'Aesthetic showcase of our state-of-the-art sterilization equipment and modern dental chair.',
      hook: 'Hygiene standards aligned with international protocols.',
      script: 'High-res photos highlighting autoclaves, sterile pouches, and clean setup.',
      caption: 'Your safety is our top priority. We use hospital-grade multi-step sterilization. 🏥',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 4, 
      week: 1,
      type: 'Review', 
      topic: 'Patient Testimonial: Google Highlight', 
      status: 'Published', 
      publishDate: 'May 30, 2026',
      details: 'Featured 5-star Google review showing our completely painless extraction care.',
      hook: '"Absolutely painless scaling and root canal!"',
      script: 'Screenshot layout overlay with gold star graphics.',
      caption: 'Thank you Patna for making us your 5.0-star rated clinic of choice! ⭐',
      thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 5, 
      week: 1,
      type: 'Carousel', 
      topic: 'Dental Myths vs Facts', 
      status: 'Approved', 
      publishDate: 'June 5, 2026',
      details: 'Debunking abrasive charcoal treatments and brushing mistakes.',
      hook: 'Stop brushing harder! It is destroying your enamel.',
      script: 'Slide 1: Myths. Slide 2: Brushing hard vs gentle circles. Slide 3: Charcoal abrasive fact check.',
      caption: 'Are you making these 3 brushing mistakes? Let us know below! 👇',
      thumbnailUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 8, 
      week: 2,
      type: 'Reel', 
      topic: 'Dental Cleaning Process', 
      status: 'Published', 
      publishDate: 'May 25, 2026',
      details: 'Dr. Aryan explaining how ultrasonic scaling works comfortably.',
      hook: 'Does scaling damage your enamel? The truth.',
      script: '[Scene: Dr. Aryan using scaler model] "Ultrasonic scaling uses vibrations, not drills. It is 100% safe."',
      caption: 'Debunking the biggest myth in dentistry. Scaling protects your enamel! 🦷',
      thumbnailUrl: 'https://images.unsplash.com/photo-1447433589675-4adf5662685f?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 9, 
      week: 2,
      type: 'Carousel', 
      topic: 'Dental Implant vs Denture', 
      status: 'Review', 
      dueDate: 'Tomorrow',
      details: 'Procedural comparison of fixed implant durability vs removable options.',
      hook: 'Fixed Implant vs Removable Denture: Which is right for you?',
      script: 'Comparison matrix covering cost, comfort, and bone health.',
      caption: 'Missing teeth can cause bone loss. Implants act like natural roots. 🔩',
      thumbnailUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 15, 
      week: 3,
      type: 'Influencer', 
      topic: 'Painless Cleaning Experience Vlog', 
      status: 'Published', 
      publishDate: 'May 29, 2026',
      creator: 'Shambhavi',
      followers: '14.2K',
      details: 'Shambhavi vlogging her painless clinic session and showing glowing results.',
      hook: 'Vlog: Trying Patna\'s most aesthetic dental clinic.',
      script: '[Creator walks into Patliputra clinic, consults Dr. Aryan, does painless scaling]',
      caption: 'Finally got my teeth scaled at @yourdentist_patna. Painless, aesthetic, and quick! 💖',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 22, 
      week: 4,
      type: 'Reel', 
      topic: 'Teeth Whitening Explained', 
      status: 'Approved', 
      publishDate: 'June 8, 2026',
      details: 'Blue-light curing teeth whitening process demonstration.',
      hook: 'How professional teeth whitening actually works.',
      script: '[Macro curing light close-up, teeth shade mapping]',
      caption: 'Get up to 4 shades lighter in 60 minutes safely with Dr. Aryan Parmar. 🌟',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    { 
      day: 29, 
      week: 4,
      type: 'Influencer', 
      topic: 'Smile Makeover Experience Vlog', 
      status: 'Review', 
      creator: 'patnafoodie',
      followers: '45.1K',
      details: 'Vlogging smile makeover options and consultations with Dr. Aryan.',
      hook: 'POV: Getting a full smile consultation in Patna.',
      script: '[Creator walks in, reviews veneers & whitening options, interviews doctor]',
      caption: 'Explored cosmetic teeth transformation options at @yourdentist_patna! 🦷✨',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    }
  ]);

  // Shoot Checklist with Due Dates
  const [shootTasks, setShootTasks] = useState([
    { id: 1, text: 'Clinic Exterior shot (Aesthetic warm lighting)', dueDate: 'June 8', checked: false },
    { id: 2, text: 'Sterilization Process walkthrough', dueDate: 'June 9', checked: true },
    { id: 3, text: 'Dr. Aryan Parmar introduction clip', dueDate: 'June 8', checked: false },
    { id: 4, text: 'Implant Procedure B-roll footage', dueDate: 'June 10', checked: false },
    { id: 5, text: 'Patient Testimonial recording', dueDate: 'June 10', checked: true }
  ]);

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { 
      sender: 'ai', 
      text: "Content Workspace Assistant. Preloaded with clinic parameters. Click presets below to generate Reel scripts, Story polls, Carousels, or Google Review graphics." 
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleSendAiMessage = () => {
    if (!aiInput.trim()) return;
    const newMsg = { sender: 'user' as const, text: aiInput };
    setAiMessages(prev => [...prev, newMsg]);
    const userQuery = aiInput;
    setAiInput('');
    setIsAiLoading(true);

    setTimeout(() => {
      let aiResponse = "Content Workspace active. Select a preset chip below for clinic-optimized generation.";
      const query = userQuery.toLowerCase();
      if (query.includes('reel') || query.includes('script')) {
        aiResponse = "🎬 **Reel Script (YOUR DENTIST, Patna):**\n\n*Hook:* \"POV: You found a clinic in Patna that feels like a luxury lounge.\"\n*Script:* \"Scaling at YOUR DENTIST doesn't thin teeth. Dr. Aryan Parmar uses ultrasonic scaling vibrations to leave your natural enamel safe and clean. Schedule a scaling consult today in Patliputra Colony!\"";
      } else if (query.includes('carousel') || query.includes('implant')) {
        aiResponse = "Carousel outline loaded for Dr. Aryan:\n\n- Slide 1: Fixed Implant vs Removable Denture at YOUR DENTIST\n- Slide 2: Bone health preservation (Dr. Aryan's recommendation)\n- Slide 3: Durability comparison matrix\n- Slide 4: Painless treatment protocol map\n- Slide 5: Comment 'IMPLANT' for direct WhatsApp consult";
      } else if (query.includes('caption') || query.includes('cleaning')) {
        aiResponse = "Instagram caption draft for Dr. Aryan:\n\n\"Painless scaling matches aesthetic design. ✨ Ultrasound scaling clears plaque without enamel scratch. Consult Dr. Aryan Parmar at YOUR DENTIST, Patliputra Colony, Patna. 🦷\"";
      } else if (query.includes('brief') || query.includes('influencer')) {
        aiResponse = "Influencer Brief template:\n\n- **Clinic:** YOUR DENTIST, Patna\n- **Campaign:** Ultrasonic Clean Experience\n- **Creator deliverables:** 1 Reel + 3 Stories mapping painless session with Dr. Aryan Parmar.";
      } else if (query.includes('testimonial') || query.includes('patient')) {
        aiResponse = "Patient Testimonial graphic text block:\n\n- Main banner: \"Absolutely painless scaling and root canal!\"\n- Subtitle: Dr. Aryan Parmar, YOUR DENTIST Patna.";
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsAiLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: ContentItem['status']) => {
    switch (status) {
      case 'Draft': return 'border-yellow-500/20 bg-yellow-500/[0.02] text-yellow-400';
      case 'Review': return 'border-cyan-500/20 bg-cyan-500/[0.02] text-cyan-400';
      case 'Approved': return 'border-purple-500/20 bg-purple-500/[0.02] text-purple-400';
      case 'Scheduled': return 'border-orange-500/20 bg-orange-500/[0.02] text-orange-400';
      case 'Published': return 'border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-400';
    }
  };

  const getStatusBadgeDot = (status: ContentItem['status']) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-400';
      case 'Review': return 'bg-cyan-400';
      case 'Approved': return 'bg-purple-400';
      case 'Scheduled': return 'bg-orange-400';
      case 'Published': return 'bg-emerald-400';
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'Reel': return '🎥';
      case 'Carousel': return '📚';
      case 'Review': return '⭐';
      default: return '📄';
    }
  };

  const scheduledCount = items.filter(d => d.status === 'Scheduled' || d.status === 'Published').length;
  const pendingApproval = items.filter(d => d.status === 'Review');

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
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans antialiased overflow-x-hidden selection:bg-cyan-500/20">
      <SEOHead
        title="Creator Armour | Content Workspace"
        description="Premium content calendar, creator collaborations, and approval system for local business marketing."
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

            {/* Clinic details */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-xs">
                YD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-white truncate">YOUR DENTIST</p>
                <p className="text-[9.5px] text-neutral-400 truncate">Dr. Aryan Parmar</p>
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

          <div className="pt-6 border-t border-white/[0.06] mt-8 lg:mt-0 flex flex-col gap-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
            <span>Sync Status: Live</span>
            <span className="font-mono">v1.2</span>
          </div>
        </aside>

        {/* Main Panel App Window */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-xl font-black uppercase text-white tracking-wide">Dr. Aryan's Workspace</h1>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-lg">
                  Last updated {lastUpdated}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 font-medium">Content calendar, creator collaborations, and approval workspace for local businesses.</p>
            </div>
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/10 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Request Content
            </button>
          </header>

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
                    <span className="text-[9px] text-neutral-500 uppercase font-mono">30-Day Planner</span>
                  </div>

                  {/* Calendar Grid Week-by-Week */}
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((weekNum) => {
                      const weekItems = items.filter(d => d.week === weekNum);
                      return (
                        <div key={weekNum} className="space-y-2.5">
                          <p className="text-[9.5px] font-black uppercase tracking-widest text-neutral-500">Week {weekNum}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {weekItems.map((item) => (
                              <div 
                                key={item.day}
                                onClick={() => setSelectedItem(item)}
                                className={`border hover:border-cyan-500/40 p-4 rounded-xl cursor-pointer hover:bg-white/[0.02] transition-all flex flex-col justify-between min-h-[96px] group ${getStatusColor(item.status)}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-[8.5px] font-mono font-black text-cyan-400">DAY {item.day}</span>
                                    <span className="text-[10px] font-black uppercase text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <span>{getTypeIcon(item.type)}</span>
                                      <span>{item.type}</span>
                                    </span>
                                  </div>
                                  <p className="text-xs font-black uppercase text-white tracking-wide group-hover:text-cyan-300 transition-colors leading-snug truncate max-w-full">{item.topic}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadgeDot(item.status)}`} />
                                    {item.status}
                                  </span>
                                  {item.creator && (
                                    <span className="text-[8.5px] font-bold text-amber-400">@{item.creator}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Support Modules (35%) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Upcoming This Week Widget */}
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-cyan-400" /> Upcoming This Week
                  </h3>
                  
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[8.5px] font-bold text-neutral-500">TOMORROW</p>
                        <p className="text-xs font-black uppercase text-white mt-0.5">Teeth Cleaning Reel</p>
                      </div>
                      <span className="text-[9px] text-cyan-400">🎥 Reel</span>
                    </div>
                    <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[8.5px] font-bold text-neutral-500">THURSDAY</p>
                        <p className="text-xs font-black uppercase text-white mt-0.5">Implant Carousel</p>
                      </div>
                      <span className="text-[9px] text-purple-400">📚 Slide</span>
                    </div>
                    <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[8.5px] font-bold text-neutral-500">SATURDAY</p>
                        <p className="text-xs font-black uppercase text-white mt-0.5">Influencer Visit</p>
                      </div>
                      <span className="text-[9px] text-indigo-400">🤝 Collab</span>
                    </div>
                  </div>
                </div>

                {/* Shoot Checklist widget with Due Dates */}
                <div className="bg-[#090d16] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Video className="h-4.5 w-4.5 text-cyan-400" /> Shoot Checklist
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
                  </div>
                </div>

                {/* Approvals Queue Upgraded */}
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
                            className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase text-[8.5px] rounded-lg tracking-wider transition-all"
                          >
                            Approve ✅
                          </button>
                          <button 
                            onClick={() => handleOpenCommentModal(item)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase text-[8.5px] rounded-lg tracking-wider transition-all"
                          >
                            Request Changes ✏️
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
                {[
                  { title: 'Posts Scheduled', value: scheduledCount, sub: 'Calendar target ready', color: 'text-cyan-400' },
                  { title: 'Pending Approval', value: pendingApproval.length, sub: 'Needs dentist action', color: 'text-yellow-400' },
                  { title: 'Active Creators', value: '2', sub: '@ft.shambhavi_, @patnafoodie', color: 'text-purple-400' },
                  { title: 'Completion %', value: '75%', sub: '12 / 16 Content completed', color: 'text-emerald-400' }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4.5 relative overflow-hidden">
                    <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">{kpi.title}</p>
                    <p className={`text-2xl font-black font-mono mt-2 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">{kpi.sub}</p>
                  </div>
                ))}
              </section>

              {/* Progress bar prominent display */}
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black uppercase text-white">Current Month Content Progress</p>
                  <span className="text-sm font-mono text-cyan-400 font-black">75% Complete</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" style={{ width: '75%' }} />
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

              {/* Content Type Radio options */}
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

              {/* Priority Select */}
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

      {/* COMMENTS FEEDBACK MODAL (Approvals flow) */}
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

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-[500px] h-full bg-[#0a0f1d] border-l border-l-white/[0.08] p-6 flex flex-col justify-between"
            >
              <div className="space-y-6 overflow-y-auto max-h-[82vh] pr-1 scrollbar-none">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">DAY {selectedItem.day}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
                      WEEK {selectedItem.week}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                      {selectedItem.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Content Topic</span>
                    <h3 className="text-base font-black uppercase text-white leading-tight mt-1">{selectedItem.topic}</h3>
                  </div>

                  {selectedItem.creator && (
                    <div className="bg-[#070b16] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black uppercase text-neutral-500">Collaborator</p>
                        <p className="text-xs font-black uppercase text-amber-400 mt-0.5">@{selectedItem.creator}</p>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-400">{selectedItem.followers} Followers</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Status Stage</span>
                      <div className="relative mt-1">
                        <select 
                          value={selectedItem.status} 
                          onChange={(e) => handleStatusChange(selectedItem.day, e.target.value as any)}
                          className="w-full bg-[#070b16] border border-white/[0.06] rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-cyan-500/20 appearance-none"
                        >
                          {(['Draft', 'Review', 'Approved', 'Scheduled', 'Published'] as const).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Publish Date</span>
                      <p className="text-xs font-black text-white mt-2.5">{selectedItem.publishDate || 'TBD (Scheduling)'}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {selectedItem.hook && (
                      <div className="bg-[#070b16] p-4 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black uppercase text-cyan-400 tracking-wider">Visual Hook (Attention 0-3s)</span>
                        <p className="text-xs font-black text-white mt-1 leading-normal italic">"{selectedItem.hook}"</p>
                      </div>
                    )}

                    {selectedItem.script && (
                      <div className="bg-[#070b16] p-4 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">Video Script / Slide Layout</span>
                        <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-medium">{selectedItem.script}</p>
                      </div>
                    )}

                    {selectedItem.caption && (
                      <div className="bg-[#070b16] p-4 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">Instagram Caption Draft</span>
                        <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-medium">{selectedItem.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button 
                  onClick={() => {
                    toast.success("Brief details downloaded locally!");
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                >
                  Download Brief
                </button>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Close Brief
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/[0.06] py-8 text-center text-[10px] text-neutral-600 uppercase tracking-widest bg-[#090d16] relative z-20">
        © {new Date().getFullYear()} Creator Armour · Content Workspace
      </footer>
    </div>
  );
}
