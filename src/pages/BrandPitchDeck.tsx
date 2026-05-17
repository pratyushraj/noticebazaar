import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Play, 
  Layers, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Workflow, 
  Users, 
  Target, 
  DollarSign, 
  FileText, 
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle,
  Database,
  BarChart,
  MessageSquare,
  Truck,
  CheckSquare,
  Lock,
  Zap,
  Mail,
  Instagram,
  UserCheck
} from 'lucide-react';

const DECK_THEME = {
  bg: 'bg-[#020D0A]',
  accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  emeraldGlow: 'from-emerald-500/10 via-emerald-600/5 to-transparent',
};

const BrandPitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState('shipping');
  const [activeCreatorIndex, setActiveCreatorIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Vetting draft states
  const [vettingStatus, setVettingStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [playingVideo, setPlayingVideo] = useState(false);

  // Form states for Slide 7
  const [formData, setFormData] = useState({
    brandName: '',
    contactEmail: '',
    category: 'Food',
    monthlyBudget: '₹25,000 - ₹50,000',
    collabType: 'Barter (Product Exchange)'
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const slidesCount = 7;

  const getSlideTheme = (slideId: number) => {
    if ([2, 4].includes(slideId)) return 'light'; // Light Mode for product dashboards
    if ([1, 5, 6].includes(slideId)) return 'accent'; // Emerald Deep theme for highlighting value props
    return 'dark'; // Cover & CTA
  };
  const theme = getSlideTheme(currentSlide);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slidesCount - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportProgress(1);
    const originalSlide = currentSlide;
    
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      for (let i = 0; i < slidesCount; i++) {
        setCurrentSlide(i);
        setExportProgress(i + 1);
        await new Promise(r => setTimeout(r, 400));
        
        const card = document.getElementById('pitch-deck-slide-card');
        if (!card) continue;
        
        const slideTheme = getSlideTheme(i);
        const bgColor = slideTheme === 'light' ? '#FFFFFF' : slideTheme === 'accent' ? '#071611' : '#050F0C';
        const canvas = await html2canvas(card, {
          scale: 2,
          useCORS: true,
          backgroundColor: bgColor,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
        
        const width = canvasWidth * ratio;
        const height = canvasHeight * ratio;
        const x = (pdfWidth - width) / 2;
        const y = (pdfHeight - height) / 2;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', x, y, width, height);
      }
      
      pdf.save('Creator_Armour_Brand_Deck.pdf');
      toast.success('Brand presentation successfully downloaded as PDF!');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setCurrentSlide(originalSlide);
      setIsExporting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.contactEmail) {
      toast.error('Please enter your brand name and email address!');
      return;
    }
    setFormSubmitted(true);
    toast.success('Matches requested! Our coordinator will contact you with 10 verified matches within 24 hours.');
  };

  const creatorsList = [
    {
      name: 'Durga Sanghavi',
      handle: '@homechef_duggu',
      role: 'Chartered Accountant & Food Content Creator',
      followers: '10.4K',
      engagement: '6.5%',
      monthlyReach: '1.7M+',
      location: 'Mumbai, Maharashtra',
      audience: '81.3% Female / 18.7% Male',
      niche: 'Comfort & Gujarati Recipes',
      deal: '₹6,000 Starter / ₹12,000 Growth / Barter Select'
    },
    {
      name: 'Sneha Tiwari',
      handle: '@blogsbysnehaaa',
      role: 'Food & Lifestyle Creator',
      followers: '84.5K',
      engagement: '5.8%',
      monthlyReach: '4.5M+',
      location: 'Mumbai, Maharashtra',
      audience: '74.2% Female / 25.8% Male',
      niche: 'Traditional & Fusion Food Recipes',
      deal: '₹12,000 Premium Reel / Barter for ₹5k+'
    },
    {
      name: 'Monika Urs',
      handle: '@monika_urs',
      role: 'Healthy Cooking & Clean Eating Creator',
      followers: '120K',
      engagement: '7.2%',
      monthlyReach: '6.0M+',
      location: 'Bangalore, Karnataka',
      audience: '85.4% Female / 14.6% Male',
      niche: 'Clean Diet Recipes & Meal Preps',
      deal: '₹15,000 Production Package / Barter Select'
    },
    {
      name: 'Seema Baishya',
      handle: '@storiesbyseema',
      role: 'Culinary Heritage Creator',
      followers: '102K',
      engagement: '6.1%',
      monthlyReach: '5.0M+',
      location: 'Guwahati, Assam',
      audience: '78.5% Female / 21.5% Male',
      niche: 'Authentic Regional Comfort Food Recipes',
      deal: '₹10,000 Standard package / Barter Select'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020D0A] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <SEOHead
        title="Interactive Brand Operations Deck | Creator Armour"
        description="View the interactive brand deck for Creator Armour—building the complete campaign operations and logistics infrastructure layer for D2C brands."
        keywords={['creator operations SaaS', 'influencer marketing logistics', 'brand escrow influencer', 'd2c influencer campaign manager']}
      />

      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#10b981]/5 rounded-full blur-[160px]" />
      </div>

      {/* Deck Header */}
      <header className="h-16 border-b border-slate-900/60 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-black uppercase tracking-widest italic">Creator <span className="text-emerald-500">Armour</span></span>
        </div>
        
        {/* Navigation Indicator */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Brand Operations Overview</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-400">Slide {currentSlide + 1} of {slidesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-white/5 disabled:opacity-50"
            title="Export to PDF"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">Download Deck PDF</span>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/5"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Interactive Horizontal Progress Bar */}
      <div className="h-1 bg-slate-900 relative z-20">
        <div 
          className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slidesCount) * 100}%` }}
        />
      </div>

      {/* Main Slide Viewer Canvas */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Sidebar Slide Navigator */}
        <nav className="hidden lg:flex w-72 border-r border-slate-900/40 bg-black/10 flex-col overflow-y-auto py-6 px-4 gap-2 scrollbar-thin [&::-webkit-scrollbar]:w-1">
          {[
            { id: 0, label: '01. Cover Slide', desc: 'Campaign Operations OS' },
            { id: 1, label: '02. WhatsApp Chaos', desc: 'The Gifting Bottleneck' },
            { id: 2, label: '03. Safe Payments', desc: 'Verified Escrow Escrow' },
            { id: 3, label: '04. Shipping Tracker', desc: 'Integrated Sample Logistics' },
            { id: 4, label: '05. Automated Vetting', desc: 'Media Compliance Engine' },
            { id: 5, label: '06. Verified Network', desc: 'Meta-Certified CRM profiles' },
            { id: 6, label: '07. Campaign Launcher', desc: 'Get 10 Matches in 24 Hrs' }
          ].map((thumb) => (
            <button
              key={thumb.id}
              onClick={() => setCurrentSlide(thumb.id)}
              className={`w-full p-3 rounded-2xl text-left border transition-all ${
                currentSlide === thumb.id 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wider">{thumb.label}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">{thumb.desc}</p>
            </button>
          ))}
        </nav>

        {/* Dynamic Slide Content Window */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-10 relative overflow-hidden bg-black/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={isExporting ? "exporting-slide" : currentSlide}
              initial={isExporting ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={isExporting ? false : { opacity: 0, x: -20 }}
              transition={isExporting ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
              className={`w-full max-w-5xl min-h-[500px] md:min-h-[540px] rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                isExporting ? '' : 'transition-all duration-500'
              } ${
                theme === 'light' 
                  ? 'bg-white border border-slate-200/85 text-slate-800 shadow-slate-100/80' 
                  : theme === 'accent'
                  ? 'bg-gradient-to-br from-[#051B13] to-[#020B07] border border-emerald-500/20 text-white shadow-emerald-950/20'
                  : 'bg-[#030C09] border border-white/5 text-white'
              }`}
              id="pitch-deck-slide-card"
            >
              
              {/* SLIDE 1: Cover (Brand Moat) */}
              {currentSlide === 0 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
                  <div className="h-10 px-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-black uppercase tracking-widest mb-6 animate-pulse">
                    The Campaign Operations OS
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">
                    Scale influencer campaigns <br/>
                    without the <span className="text-emerald-500">manual operations chaos.</span>
                  </h1>
                  <p className="text-base md:text-lg text-slate-400 font-medium max-w-3xl leading-relaxed mb-6">
                    Creator Armour is the infrastructure software operating system automating creator logistics, safe payments, and deliverable vetting for India's high-growth consumer economy.
                    <span className="text-emerald-400 block mt-3 font-black uppercase text-sm tracking-widest">Brands chill. We handle operations.</span>
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">
                    <p>🔥 19 active D2C pilots</p>
                    <p>•</p>
                    <p>📦 100% logistics automated</p>
                    <p>•</p>
                    <p>🛡️ Zero delivery risks</p>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Problem (WhatsApp Chaos) */}
              {currentSlide === 1 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-5">
                    <div className="h-5 w-24 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      The Challenge
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Influencer operations <br />
                      are eating your <span className="text-red-500">margins.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      E-commerce brands are scaling creator cohorts. Yet, internal teams spend 80% of their time chasing tracking codes, checking media draft compliance, and managing payout rows manually across fragmented channels.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'The WhatsApp Flood', desc: 'No tracking dashboard. Shipments, address checks, and media updates are buried under hundreds of chats.' },
                        { title: 'Unreliable Deliveries', desc: 'Lost tracking codes, wrong addresses, and creators taking product samples without posting.' },
                        { title: 'Payment Friction', desc: 'Chasing manual receipts, processing endless payouts, and paying creators before verifying the content draft.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-rows-2 gap-4 h-full max-h-[360px]">
                    {/* Simulated spreadsheet chaos */}
                    <div className="rounded-2xl border border-red-500/10 bg-black/40 overflow-hidden text-[10px] font-mono shadow-xl relative">
                      <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-red-500/10 z-10">
                        Spreadsheet overhead
                      </div>
                      <div className="bg-red-950/20 px-3 py-2 border-b border-red-500/10 flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                        <span>gifting_tracker_v3.xlsx</span>
                        <span className="text-red-400/60 font-black">7 Missing Posts</span>
                      </div>
                      <div className="divide-y divide-white/5 max-h-[110px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.02] text-slate-400 border-b border-white/5">
                              <th className="p-2 font-bold uppercase text-[8px]">Creator</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Sample Shipping</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Draft Status</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Live Link</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300">
                            <tr>
                              <td className="p-2 font-bold">@blogsbysnehaaa</td>
                              <td className="p-2 text-emerald-400 font-bold">Shipped (No tracking)</td>
                              <td className="p-2 text-amber-500 font-bold">In Review (WhatsApp)</td>
                              <td className="p-2 text-red-400 font-bold">No link uploaded</td>
                            </tr>
                            <tr className="bg-white/[0.01]">
                              <td className="p-2 font-bold">@homechef_duggu</td>
                              <td className="p-2 text-red-400 font-bold">Wrong address return</td>
                              <td className="p-2 text-slate-600">Pending arrival</td>
                              <td className="p-2 text-red-400 font-bold">No link uploaded</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold">@storiesbyseema</td>
                              <td className="p-2 text-emerald-400">Delivered</td>
                              <td className="p-2 text-red-400 font-bold">Rejected revisions</td>
                              <td className="p-2 text-red-400 font-bold">No link uploaded</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Simulated WhatsApp chaos */}
                    <div className="rounded-2xl border border-red-500/10 bg-black/40 p-4 space-y-3 relative overflow-hidden flex flex-col justify-center shadow-xl">
                      <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-red-500/10 z-10">
                        Manual follow-ups
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Brands WhatsApp Group</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] border border-white/5">
                          <p className="font-black text-red-400 text-[9px] uppercase tracking-wider">Brand Manager</p>
                          <p className="text-slate-300 mt-0.5 leading-relaxed text-[10px]">
                            Hi Sneha! We sent the sample packet 10 days ago but still haven't received the draft. Please share the tracking receipt and post date!
                          </p>
                        </div>
                        <div className="bg-emerald-500/5 p-2.5 rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-right border border-emerald-500/10">
                          <p className="font-black text-emerald-400 text-[9px] uppercase tracking-wider">Creator Team</p>
                          <p className="text-slate-300 mt-0.5 leading-relaxed text-[10px]">
                            Hi, our courier address has changed, did you ship to our old or new office? Also, we need 50% advance before shooting the video!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Safe Payments (Escrow System) */}
              {currentSlide === 2 && (
                <div className="flex-1 flex flex-col justify-between text-slate-800">
                  <div className="space-y-4">
                    <div className="h-5 w-44 rounded-full bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Verified Escrow
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-7">
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                          Zero payment risks. <br />
                          <span className="text-emerald-600">Locked creator terms.</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          Protect your marketing budget. Place campaign funds into the secure escrow container. Creator Armour crawler verifies the live post and checks compliance rules before releasing the payout.
                        </p>
                      </div>
                      <div className="md:col-span-5 p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-center shadow-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200 text-[10px] font-bold text-slate-500">
                          <span>Deposit Funds</span>
                          <span className="text-slate-800">Escrow Container Secure</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-[10px] font-bold text-slate-500 mt-1">
                          <span>Compliance Check</span>
                          <span className="text-emerald-600">Logo, Link & Tag Verify</span>
                        </div>
                        <div className="flex justify-between py-1 text-[10px] font-bold text-slate-500 mt-1">
                          <span>Instant Release</span>
                          <span className="text-emerald-600 font-black">Automated Settlement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escrow visual diagram */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { step: '01', title: 'Fund Escrow', desc: 'Secure campaign funds in escrow. Creator gets notified immediately that cash is verified and locked.', icon: Lock },
                      { step: '02', title: 'Track Upload', desc: 'Creator uploads normalized video draft. Auto compliance check verifies product logos, links, and hashtags.', icon: CheckSquare },
                      { step: '03', title: 'Auto Release', desc: 'The crawler verifies live publishing status. Payout is settled instantly and securely to the creator.', icon: Zap }
                    ].map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:-translate-y-1 transition-all duration-300">
                          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-xs border border-emerald-100 mb-3">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{card.step} • {card.title}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium mt-1">{card.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SLIDE 4: Shipping Tracker (Integrated Logistics) */}
              {currentSlide === 3 && (
                <div className="flex-1 flex flex-col justify-between text-slate-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="h-5 w-32 rounded-full bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center text-[9px] font-black uppercase tracking-wider mb-2">
                        Integrated Logistics
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                        End-to-End Sample Tracking
                      </h2>
                    </div>
                    {/* Live delivery logs control switcher */}
                    <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                      {[
                        { id: 'shipping', label: 'Active Shipments' },
                        { id: 'deliveries', label: 'Delivered (Awaiting Post)' },
                        { id: 'returns', label: 'Exceptions & Returns' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveDemoTab(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeDemoTab === tab.id 
                              ? 'bg-slate-900 text-white shadow-md' 
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logistics Tracker Hub View */}
                  <div className="mt-4 flex-1 rounded-[24px] border border-slate-200/80 bg-slate-50 p-4 relative overflow-hidden flex flex-col justify-center min-h-[250px] shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    
                    {activeDemoTab === 'shipping' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Live Campaign Logistics Tracker</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Automated Courier Sync</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-8 space-y-2">
                            {[
                              { order: 'ORD-5591', creator: 'Durga Sanghavi (@homechef_duggu)', status: '📦 Shipped', carrier: 'BlueDart Air (Track: BD12098)', info: 'Undhiyu & Jowar Rotla Spices packet' },
                              { order: 'ORD-5592', creator: 'Sneha Tiwari (@blogsbysnehaaa)', status: '🚚 In Transit', carrier: 'Delhivery Prime', info: 'D2C Brand Cookware set' },
                              { order: 'ORD-5593', creator: 'Seema Baishya (@storiesbyseema)', status: '⚙️ Dispatching', carrier: 'Wedge Logistics Hub', info: 'Assamese Regional Recipe Ingredients' }
                            ].map((ship, i) => (
                              <div key={i} className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex justify-between items-center text-[10px]">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-slate-400">{ship.order}</span>
                                  <div>
                                    <p className="font-black text-slate-800 leading-none">{ship.creator}</p>
                                    <p className="text-[9px] font-medium text-slate-400 mt-1">{ship.info}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] border ${
                                    ship.status.includes('Transit') 
                                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                                      : ship.status.includes('Shipped')
                                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                                      : 'bg-slate-50 border-slate-200 text-slate-500'
                                  }`}>{ship.status}</span>
                                  <p className="text-[8px] text-slate-400 font-bold mt-1">{ship.carrier}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="md:col-span-4 space-y-2">
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Barter Shipments</p>
                              <p className="text-xl font-black text-slate-900 mt-1">19 Brands Live</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Manual Hours Saved</p>
                              <p className="text-xl font-black text-emerald-600 mt-1">~42 Hours/Wk</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDemoTab === 'deliveries' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Delivered Samples & Post Tracker</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live Post Listening</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: 'Monika Urs (@monika_urs)', date: 'Delivered Today 14:32', days: '2 days left to upload', status: '✓ Locked in schedule' },
                            { name: 'Durga Sanghavi (@homechef_duggu)', date: 'Delivered Yesterday', days: '3 days left to upload', status: '✓ Escrow Fund Active' }
                          ].map((item, i) => (
                            <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center text-[10px]">
                              <div>
                                <p className="font-black text-slate-800">{item.name}</p>
                                <p className="text-[9px] text-slate-400 mt-1">Status: {item.date}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{item.status}</span>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{item.days}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeDemoTab === 'returns' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Exceptions & Delivery Alerts</p>
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Action Required</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl border border-red-100 bg-red-50/20 flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-black text-red-800">Delivery Failed: Wrong Pin Code</p>
                              <p className="text-[9px] text-red-500 mt-1">Creator: @rohit_bhandari • Ref: BD-0021</p>
                            </div>
                            <button 
                              onClick={() => toast.success('Address correction sequence sent to creator via automatic WhatsApp/Email.')}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-[9px] font-black uppercase tracking-wider shadow-sm transition-all"
                            >
                              Request Update
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SLIDE 5: Automated Vetting (Compliance Engine) */}
              {currentSlide === 4 && (
                <div className="flex-1 flex flex-col justify-between text-slate-800">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-32 rounded-full bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                        Vetting Engine
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        1-Click Compliance
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                          Automate media draft <br />
                          <span className="text-emerald-600">quality compliance.</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          Let our software run draft video analysis. The compliance dashboard highlights missing brand tags, audio overlay, and verifies portrait aspect ratios before posting.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <p className="text-xs font-black uppercase text-slate-800 italic tracking-wider">Automation compliance</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          No more downloading massive raw files to your phone. Review, request revisions, or click approve in 1-click inside the dashboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive draft checker mockup */}
                  <div className="mt-4 p-4 rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      
                      {/* Left: Video Player Mockup */}
                      <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-slate-200/50 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden h-[140px]">
                        <button 
                          onClick={() => {
                            setPlayingVideo(!playingVideo);
                            toast.info(playingVideo ? 'Video paused' : 'Simulating creator unboxing reel playback...');
                          }}
                          className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md animate-pulse hover:scale-105 transition-all"
                        >
                          <Play className={`h-4.5 w-4.5 text-emerald-400 ${playingVideo ? 'fill-emerald-400' : ''}`} />
                        </button>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">recipe_unboxing_v2.mp4</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Length: 0:45 • Format: Portrait (9:16)</span>
                      </div>

                      {/* Right: Compliance checks & actions */}
                      <div className="md:col-span-7 space-y-3">
                        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Vetting Status</p>
                          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-slate-600 mt-1">
                            <p className="text-emerald-600">✓ Brand Logo visible</p>
                            <p className="text-emerald-600">✓ Audio overlay matched</p>
                            <p className="text-emerald-600">✓ First 3s hook high</p>
                            <p className="text-amber-500">⚠️ Link bio tagged tag missing</p>
                          </div>
                        </div>

                        {vettingStatus === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setVettingStatus('approved');
                                toast.success('Draft approved! The creator has been notified to post.');
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-all text-center shadow-sm"
                            >
                              Approve Draft
                            </button>
                            <button 
                              onClick={() => {
                                setVettingStatus('rejected');
                                toast.error('Revision requested. Creator notified.');
                              }}
                              className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest transition-all text-center"
                            >
                              Request Revision
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider text-center">
                            {vettingStatus === 'approved' ? '✓ DRAFT APPROVED' : '❌ REVISION REQUESTED'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 6: Elite Verified Creator Network (CRM Profiles) */}
              {currentSlide === 5 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-white">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="h-5 w-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Verified Network
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Meta-Certified <br />
                      <span className="text-emerald-500">Creator CRM Profiles.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Creator Armour provides live access to verified creator cards featuring meta-certified reach, actual average views, engagement metrics, and predefined package templates.
                    </p>
                    
                    {/* Creator switcher buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {creatorsList.map((creator, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setActiveCreatorIndex(i);
                            toast.info(`Spotlighting ${creator.name}'s verified creator metrics`);
                          }}
                          className={`p-2 rounded-xl text-left border text-[10px] font-bold uppercase transition-all ${
                            activeCreatorIndex === i 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
                              : 'border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <p className="leading-none">{creator.name}</p>
                          <p className="text-[8px] text-slate-600 mt-1">{creator.handle}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Beautiful Creator Card Profile Display */}
                  <div className="lg:col-span-7 bg-[#05140F] border border-emerald-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Instagram className="h-32 w-32 text-emerald-500" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">✓ ELITE VERIFIED</span>
                          <h3 className="text-lg font-black mt-2 leading-none uppercase italic">{creatorsList[activeCreatorIndex].name}</h3>
                          <p className="text-[10px] text-emerald-400/80 font-bold mt-1">{creatorsList[activeCreatorIndex].handle} • {creatorsList[activeCreatorIndex].role}</p>
                        </div>
                        <span className="text-[8px] bg-slate-900 border border-white/5 text-slate-400 px-2 py-1 rounded font-black uppercase">{creatorsList[activeCreatorIndex].niche}</span>
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center mt-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Verified Reach</p>
                          <p className="text-sm font-black text-white italic uppercase mt-0.5">{creatorsList[activeCreatorIndex].followers}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Engagement Rate</p>
                          <p className="text-sm font-black text-emerald-400 italic uppercase mt-0.5">{creatorsList[activeCreatorIndex].engagement}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Monthly Reach</p>
                          <p className="text-sm font-black text-white italic uppercase mt-0.5">{creatorsList[activeCreatorIndex].monthlyReach}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-[10px] font-medium text-slate-300">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="font-bold text-slate-500">📍 Creator Location</span>
                          <span>{creatorsList[activeCreatorIndex].location}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="font-bold text-slate-500">📊 Audience Gender Split</span>
                          <span>{creatorsList[activeCreatorIndex].audience}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-bold text-slate-500">💰 Predefined Deals</span>
                          <span className="font-black text-emerald-400">{creatorsList[activeCreatorIndex].deal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 7: CTA Campaign Launcher (Matches Form) */}
              {currentSlide === 6 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
                  <div className="space-y-4">
                    <div className="h-5 w-32 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Launch Campaign
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Ready to scale <br />
                      your campaigns <span className="text-emerald-500">effortlessly?</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Scale your barter or paid campaigns with zero manual overhead. Complete the form to get <strong>10 curated creator matches</strong> matching your exact brand niches within 24 hours.
                    </p>
                    <div className="space-y-3 text-[11px] font-bold text-slate-300">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span>100% automated physical shipment tracking</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span>Protected escrow payment safeguards</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span>Instant 1-click media compliance checks</span>
                      </p>
                    </div>
                  </div>

                  {/* Form Mockup */}
                  <div className="bg-[#05140F] border border-emerald-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent pointer-events-none" />
                    
                    {!formSubmitted ? (
                      <form onSubmit={handleFormSubmit} className="space-y-3 relative z-10">
                        <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">Get 10 Creator Matches in 24 Hrs</p>
                        
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Brand / Company Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Kiro Foods"
                            value={formData.brandName}
                            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-700" 
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Work Email Address</label>
                          <input 
                            type="email" 
                            placeholder="you@company.com"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-700" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Brand Niche</label>
                            <select 
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full p-2 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              <option value="Food">Food & Drinks</option>
                              <option value="Wellness">Wellness & Health</option>
                              <option value="Fashion">Fashion & Apparel</option>
                              <option value="Beauty">Beauty & Cosmetics</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Deal Campaign Type</label>
                            <select 
                              value={formData.collabType}
                              onChange={(e) => setFormData({ ...formData, collabType: e.target.value })}
                              className="w-full p-2 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none transition-all"
                            >
                              <option value="Barter">Barter (Exchange)</option>
                              <option value="Paid">Paid Campaigns</option>
                              <option value="Hybrid">Hybrid Models</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Request Curated Matches</span>
                        </button>
                      </form>
                    ) : (
                      <div className="py-6 text-center space-y-4 relative z-10 flex flex-col justify-center items-center h-full min-h-[220px]">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase italic">Matches Requested successfully!</p>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            We are processing your brand profile. We will email <strong>10 curated creator matches</strong> matching your {formData.category} requirements within 24 hours.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Navigation Toolbar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6 relative z-20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Slide {currentSlide + 1} • {currentSlide === 0 ? 'Start' : currentSlide === 6 ? 'End' : 'Active'}
                </span>
                
                {/* Navigation controls */}
                <div className="flex gap-3">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                      currentSlide === 0 
                        ? 'border-slate-900 text-slate-700 cursor-not-allowed' 
                        : 'border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === slidesCount - 1}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                      currentSlide === slidesCount - 1 
                        ? 'border-slate-900 text-slate-700 cursor-not-allowed' 
                        : 'border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Nav Bar */}
      <footer className="py-6 px-6 border-t border-slate-900/60 bg-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
        <div className="flex items-center gap-6">
          <p className="text-xs text-slate-500 font-medium">Use Left/Right arrows or click side tabs to navigate the deck</p>
        </div>
        <div className="flex gap-6 text-[10px] font-black uppercase text-slate-500 tracking-wider">
          <span className="cursor-pointer hover:text-white transition-colors">Campaign Deck</span>
          <span className="cursor-pointer hover:text-white transition-colors">SaaS Services</span>
          <span className="cursor-pointer hover:text-white transition-colors">Privacy & Guidelines</span>
        </div>
      </footer>

      {isExporting && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="bg-[#050F0C] border border-emerald-500/20 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900">
              <div 
                className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-300"
                style={{ width: `${(exportProgress / slidesCount) * 100}%` }}
              />
            </div>
            
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <Sparkles className="h-8 w-8 text-emerald-500 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase italic">Compiling PDF</h3>
              <p className="text-xs text-slate-400">
                Capturing slide <span className="text-white font-bold">{exportProgress}</span> of <span className="text-white font-bold">{slidesCount}</span>...
              </p>
            </div>
            
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">
              Please do not close or resize your browser
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandPitchDeck;
