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
  Zap,
  Clock,
  TrendingUp, 
  Tv, 
  Workflow, 
  Users, 
  Target, 
  DollarSign, 
  Compass, 
  FileText, 
  ArrowRight,
  Send,
  Sparkles,
  Smartphone,
  CheckCircle,
  Database,
  BarChart,
  MessageSquare
} from 'lucide-react';

const DECK_THEME = {
  bg: 'bg-[#020D0A]',
  accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  emeraldGlow: 'from-emerald-500/10 via-emerald-600/5 to-transparent',
};

const InvestorPitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState('dashboard');

  const slidesCount = 12;

  const getSlideTheme = (slideId: number) => {
    if ([3, 4].includes(slideId)) return 'light'; // Slide 4 (Product Tour), Slide 5 (Workflow Demo)
    if ([1, 7, 8, 9].includes(slideId)) return 'accent'; // Slide 2 (Problem), Slide 8 (Traction), Slide 9 (GTM), Slide 10 (Founder Story)
    return 'dark'; // Cover, Why Fail, Market, Business Model, Vision, Ask
  };
  const theme = getSlideTheme(currentSlide);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setCurrentSlide((slide) => Math.min(slide + 1, slidesCount - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        setCurrentSlide((slide) => Math.max(slide - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slidesCount]);

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

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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
        // Wait for rendering to settle (key is constant, no transitions)
        await new Promise(r => setTimeout(r, 300));
        
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
      
      pdf.save('Creator_Armour_Pitch_Deck.pdf');
      toast.success('Pitch Deck successfully converted and downloaded as PDF!');
    } catch (err: unknown) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setCurrentSlide(originalSlide);
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#020D0A] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <SEOHead
        title="Interactive Pitch Deck | Creator Armour"
        description="View the interactive seed-stage investor presentation of Creator Armour, a live MVP for creator and brand campaign operations."
        keywords={['creator armour pitch deck', 'creator ops deck', 'seed startup deck India', 'SaaS pitch deck']}
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
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Investor Presentation</span>
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
            <span className="hidden sm:inline">Export PDF</span>
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
      <main className="flex-1 min-h-0 flex flex-col md:flex-row relative z-10 overflow-hidden">
        
        {/* Sidebar Mini-Thumbnails (Stripe/Linear style) */}
        <nav className="hidden lg:flex w-72 border-r border-slate-900/40 bg-black/10 flex-col overflow-hidden py-4 px-3 gap-1">
          {[
            { id: 0, label: '01. Cover Slide', desc: 'Category Vision' },
            { id: 1, label: '02. The Problem', desc: 'Manual Chaos' },
            { id: 2, label: '03. Why Fail', desc: 'Traditional vs Tech' },
            { id: 3, label: '04. Product Tour', desc: 'Creator + Brand Dashboards' },
            { id: 4, label: '05. Workflow Demo', desc: 'Live Campaign Operations' },
            { id: 5, label: '06. Market Potential', desc: '$3.5B Indian TAM' },
            { id: 6, label: '07. Business Model', desc: 'Unit Economics' },
            { id: 7, label: '08. Traction Metrics', desc: 'Execution Speed' },
            { id: 8, label: '09. Go-To-Market', desc: 'Consumable Wedge' },
            { id: 9, label: '10. Founder Story', desc: 'Operator Competence' },
            { id: 10, label: '11. Category Vision', desc: 'Creator-Led Future' },
            { id: 11, label: '12. Pre-Seed Ask', desc: '₹75L Allocation' }
          ].map((thumb) => (
            <button
              key={thumb.id}
              onClick={() => setCurrentSlide(thumb.id)}
                  className={`w-full p-2.5 rounded-2xl text-left border transition-all ${
                currentSlide === thumb.id 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-wider">{thumb.label}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{thumb.desc}</p>
            </button>
          ))}
        </nav>

        {/* Dynamic Slide Content Window */}
        <div className="flex-1 min-h-0 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden bg-black/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={isExporting ? "exporting-slide" : currentSlide}
              initial={isExporting ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={isExporting ? false : { opacity: 0, x: -20 }}
              transition={isExporting ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
              className={`w-full max-w-5xl h-full max-h-[620px] rounded-[32px] p-5 md:p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                isExporting ? '' : 'transition-all duration-500'
              } ${
                theme === 'light' 
                  ? 'bg-white border border-slate-200/80 text-slate-800 shadow-slate-100/80' 
                  : theme === 'accent'
                  ? 'bg-gradient-to-br from-[#0B251B] to-[#040D09] border border-emerald-500/20 text-white shadow-emerald-950/20'
                  : 'bg-[#050F0C] border border-white/5 text-white'
              }`}
              id="pitch-deck-slide-card"
            >
              {/* Dynamic Slides Content */}
              {currentSlide === 0 && (
                <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
                  <div className="h-10 px-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-black uppercase tracking-widest mb-6 animate-pulse">
                    Seed Stage Presentation • MVP Live
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">
                    Creator-led commerce <br/>
                    needs a <span className="text-emerald-500">workflow layer.</span>
                  </h1>
                  <p className="text-base md:text-lg text-slate-400 font-medium max-w-2xl leading-relaxed mb-6">
                    Creator Armour is the trust and workflow layer for creator-brand collaborations, with live creator and brand dashboards already handling protected offers, deals, payments, contracts, and campaign operations.
                    <span className="text-white block mt-2 font-bold uppercase text-xs tracking-widest text-emerald-400">MVP live. Two-sided dashboard working. Built for India's D2C creator economy.</span>
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">
                    <p>Pratyush Raj • Founder</p>
                    <p>•</p>
                    <p>pratyushraj@outlook.com</p>
                    <p>•</p>
                    <p>creatorarmour.com</p>
                  </div>
                </div>
              )}

              {currentSlide === 1 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-5">
                    <div className="h-5 w-24 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      The Problem
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Creator campaigns break <br />
                      after discovery.
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Brands can find creators, but the messy middle is still manual: briefs, negotiations, contracts, product shipping, approvals, payments, and proof of delivery all leak across WhatsApp and spreadsheets.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'No System of Record', desc: 'Briefs, counter-offers, creator addresses, deliverables, and due dates live in different chats.' },
                        { title: 'Creator Trust Gap', desc: 'Creators worry about payment delays, usage-right abuse, vague terms, and brands ghosting after delivery.' },
                        { title: 'Brand Execution Drag', desc: 'Brands lose weeks coordinating shipping, draft approvals, legal terms, and final campaign proof manually.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual mockup of the chaos */}
                  <div className="lg:col-span-7 grid grid-rows-2 gap-4 h-full max-h-[360px]">
                    {/* Simulated Messy Spreadsheet */}
                    <div className="rounded-2xl border border-red-500/10 bg-black/40 overflow-hidden text-[10px] font-mono shadow-xl relative">
                      <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-red-500/10 z-10">
                        Spreadsheet Chaos
                      </div>
                      <div className="bg-red-950/20 px-3 py-2 border-b border-red-500/10 flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                        <span>campaign_barter_v4_final.xlsx</span>
                        <span className="text-red-400/60 font-black">Error: 8 Stale Rows</span>
                      </div>
                      <div className="divide-y divide-white/5 max-h-[110px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.02] text-slate-400 border-b border-white/5">
                              <th className="p-2 font-bold uppercase text-[8px]">Creator</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Product Status</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Draft Status</th>
                              <th className="p-2 font-bold uppercase text-[8px]">Live Link</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300">
                            <tr>
                              <td className="p-2 font-bold">@blogsbysnehaaa</td>
                              <td className="p-2 text-emerald-400 font-bold">Dispatched (No tracking)</td>
                              <td className="p-2 text-amber-500 font-bold">Pending Approval</td>
                              <td className="p-2 text-red-400">MISSING</td>
                            </tr>
                            <tr className="bg-white/[0.01]">
                              <td className="p-2 font-bold">@rohit_bhandari</td>
                              <td className="p-2 text-red-400 font-bold">Returned - Wrong address!</td>
                              <td className="p-2 text-slate-600">Not received</td>
                              <td className="p-2 text-red-400">MISSING</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold">@storiesbyseema</td>
                              <td className="p-2 text-emerald-400">Delivered</td>
                              <td className="p-2 text-red-400 font-bold">Refused edits (WhatsApp)</td>
                              <td className="p-2 text-red-400">MISSING</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Simulated WhatsApp Chaos */}
                    <div className="rounded-2xl border border-red-500/10 bg-black/40 p-4 space-y-3 relative overflow-hidden flex flex-col justify-center shadow-xl">
                      <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-red-500/10 z-10">
                        WhatsApp Flood
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Team Thread</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] border border-white/5">
                          <p className="font-black text-red-400 text-[9px] uppercase tracking-wider">Brand Ops Manager</p>
                          <p className="text-slate-300 mt-0.5 leading-relaxed text-[10px]">
                            Wait, did we ship the product sample to Rohit or Swapnil? I can't find the Excel row. Also, Sneha's draft video is 9:16 but we requested 16:9!
                          </p>
                        </div>
                        <div className="bg-emerald-500/5 p-2.5 rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-right border border-emerald-500/10">
                          <p className="font-black text-emerald-400 text-[9px] uppercase tracking-wider">Creator Team</p>
                          <p className="text-slate-300 mt-0.5 leading-relaxed text-[10px]">
                            Sir, where is the payment? The reel is ready but we won't upload without advance. Our address changed, did you ship to the new one?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 2 && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-5 w-48 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Why Existing Solutions Fail
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      Discovery tools stop too early. <br/>
                      <span className="text-emerald-500">Agencies stay too manual.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl">
                      Creator Armour sits between marketplace discovery and full-service agencies: a product-led workflow system where each collaboration becomes trackable, protected, and repeatable.
                    </p>
                  </div>

                  {/* High Fidelity Comparison Grid */}
                  <div className="mt-4 p-5 rounded-[24px] bg-slate-950/40 border border-emerald-500/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Layers className="h-32 w-32 text-emerald-500" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-[11px]">
                      {/* Left: Traditional Agencies */}
                      <div className="p-4 rounded-2xl bg-red-500/[0.02] border border-red-500/10 space-y-3">
                        <p className="font-black text-red-400 uppercase tracking-widest text-xs italic flex items-center gap-1.5">
                          <span>❌</span> Traditional Agency Model
                        </p>
                        <div className="space-y-2 text-slate-400 font-medium">
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="font-bold">Coordination</span>
                            <span>Manual chats, calls & spreadsheets</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="font-bold">Pricing structure</span>
                            <span>Opaque retainers and manual service fees</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="font-bold">Campaign speed</span>
                            <span>Slow turnaround and low visibility</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="font-bold">Data visibility</span>
                            <span>Stale creator lists and status updates</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Creator Armour */}
                      <div className="p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/20 space-y-3">
                        <p className="font-black text-emerald-400 uppercase tracking-widest text-xs italic flex items-center gap-1.5">
                          <span>✅</span> Creator Armour OS
                        </p>
                        <div className="space-y-2 text-slate-300 font-medium">
                          <div className="flex justify-between py-1 border-b border-emerald-500/5">
                            <span className="font-bold text-white">Workflows</span>
                            <span className="font-semibold text-emerald-400">Two-sided campaign workflow</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-emerald-500/5">
                            <span className="font-bold text-white">Pricing structure</span>
                            <span className="font-semibold text-emerald-400">Transaction-led monetization</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-emerald-500/5">
                            <span className="font-bold text-white">Campaign scaling</span>
                            <span className="font-semibold text-emerald-400">Repeatable brand playbooks</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="font-bold text-white">Data access</span>
                            <span className="font-semibold text-emerald-400">Creator, deal, payment and proof graph</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 3 && (
                <div className="flex-1 flex flex-col justify-between text-slate-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="h-5 w-24 rounded-full bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center text-[9px] font-black uppercase tracking-wider mb-2">
                        Product Tour
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                        Live Two-Sided Campaign OS
                      </h2>
                    </div>
                    {/* Interactive Switcher Tabs (Light Mode UI) */}
                    <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                      {[
                        { id: 'dashboard', label: 'Collab Link' },
                        { id: 'crm', label: 'Creator Dashboard' },
                        { id: 'approvals', label: 'Brand Dashboard' },
                        { id: 'analytics', label: 'Trust Layer' }
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

                  {/* Dynamic interactive demo visualization (Light Mode SaaS Dashboard style) */}
                  <div className="mt-4 flex-1 rounded-[24px] border border-slate-200/80 bg-slate-50 p-4 relative overflow-hidden flex flex-col justify-center min-h-[260px] shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    
                    {activeDemoTab === 'dashboard' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Public CollabLink: Brand Brief Intake</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Functional MVP</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                          <div className="md:col-span-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">CA</div>
                              <div>
                                <p className="text-lg font-black text-slate-900 leading-none">Aditi Sharma</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">@aditi.collabs • Beauty + wellness</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              {[
                                ['84K', 'Followers'],
                                ['5.8%', 'Engagement'],
                                ['12K', 'Avg views']
                              ].map(([value, label]) => (
                                <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-2 text-center">
                                  <p className="text-base font-black text-slate-900">{value}</p>
                                  <p className="text-[8px] font-black uppercase text-slate-400">{label}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Live CollabLink</p>
                              <p className="text-xs font-bold text-slate-700 mt-1">creatorarmour.com/aditi</p>
                            </div>
                          </div>

                          <div className="md:col-span-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand brief form</p>
                              <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-1 text-[8px] font-black uppercase text-blue-700">Structured lead</span>
                            </div>
                            <div className="space-y-2">
                              {[
                                ['Brand', 'GlowUp Skincare'],
                                ['Offer', '1 Reel + 3 Stories'],
                                ['Budget', '₹18,000 + product kit'],
                                ['Timeline', 'Shoot in 7 days']
                              ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                  <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
                                  <span className="text-xs font-black text-slate-800">{value}</span>
                                </div>
                              ))}
                              <button className="w-full h-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <Send className="h-3.5 w-3.5" />
                                Send protected offer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDemoTab === 'crm' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Creator Dashboard: Offers, Deals & Protection</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Creator Side Live</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-7 p-4 rounded-3xl border bg-white border-slate-200 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-100">
                                <Zap className="w-3 h-3 fill-current" />
                                Standard Deal
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-rose-50 text-rose-600 border-rose-100">
                                <Clock className="w-3 h-3" />
                                Exp. in 2 days
                              </span>
                            </div>
                            <div className="flex gap-4 mb-4">
                              <div className="w-[88px] h-[88px] rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50 p-1 shadow-md shrink-0">
                                <img
                                  src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=180&h=180&q=80"
                                  alt="Beauty campaign"
                                  className="w-full h-full object-cover rounded-[18px]"
                                />
                              </div>
                              <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
                                <div>
                                  <h4 className="text-lg font-black tracking-tight leading-tight text-slate-900">Nykaa Beauty</h4>
                                  <p className="text-xs font-bold mt-1 text-slate-500">1 Reel + 3 Stories</p>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <p className="text-2xl font-black tracking-tight tabular-nums leading-none text-slate-900">₹18,000</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earnings</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <CheckCircle className="w-4 h-4" />
                                Accept
                              </div>
                              <div className="h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600">
                                Counter
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-5 space-y-3">
                            <div className="p-4 rounded-3xl border bg-white border-slate-200 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protected Revenue</p>
                                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹50,159</h3>
                                </div>
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-50">
                                  <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-2xl border bg-orange-50/40 border-orange-100 text-left">
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Processing</p>
                                  <p className="text-base font-black text-slate-900">₹41,160</p>
                                </div>
                                <div className="p-3 rounded-2xl border bg-green-50/40 border-green-100 text-left">
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Paid Out</p>
                                  <p className="text-base font-black text-slate-900">₹8,999</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl border bg-white border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-black uppercase text-slate-400">UPI Transfer</p>
                                <p className="text-xs font-bold text-slate-800">ama*****@oksbi</p>
                              </div>
                              <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase bg-green-50 text-green-600 border border-green-100">Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDemoTab === 'approvals' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Brand Dashboard: Discovery, Requests & Deal Ops</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Brand Side Live</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign brief</p>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase text-slate-500">Food</span>
                            </div>
                            <h4 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Healthy snack launch</h4>
                            <p className="text-[10px] font-semibold text-slate-500 mt-1 leading-relaxed">Find wellness creators for barter + affiliate campaign. Need 10 reels in 14 days.</p>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                                <p className="text-[8px] font-black uppercase text-slate-400">Budget</p>
                                <p className="text-sm font-black text-slate-900">₹2L</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2">
                                <p className="text-[8px] font-black uppercase text-slate-400">Creators</p>
                                <p className="text-sm font-black text-slate-900">25</p>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-8 space-y-2">
                            {[
                              { name: 'Sneha Tiwari', fit: 'Wellness', stage: 'Offer sent', tone: 'blue', value: '₹18K' },
                              { name: 'Rohit Bhandari', fit: 'Lifestyle', stage: 'Address needed', tone: 'amber', value: 'Barter' },
                              { name: 'Seema Baishya', fit: 'Cooking', stage: 'Draft review', tone: 'emerald', value: '₹12K' }
                            ].map((creator) => (
                              <div key={creator.name} className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                    {creator.name.split(' ').map((part) => part[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-900">{creator.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{creator.fit} creator • {creator.value}</p>
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase border ${
                                  creator.tone === 'emerald'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : creator.tone === 'amber'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : 'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                  {creator.stage}
                                </span>
                              </div>
                            ))}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {[
                                ['12', 'Offers sent'],
                                ['7', 'Accepted'],
                                ['3', 'In review']
                              ].map(([value, label]) => (
                                <div key={label} className="rounded-2xl bg-slate-900 text-white p-2 text-center">
                                  <p className="text-lg font-black">{value}</p>
                                  <p className="text-[8px] font-black uppercase text-slate-400">{label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDemoTab === 'analytics' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-800">Trust Layer: Legal, Payment & Campaign Proof</p>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Protection Layer</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5 p-4 rounded-3xl border bg-white border-slate-200 shadow-sm">
                            <div className="flex gap-4 mb-4">
                              <div className="w-[78px] h-[78px] rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50 p-1 shadow-md shrink-0">
                                <img
                                  src="/assets/images/lawyer-pratik.png"
                                  alt="Legal counsel"
                                  className="w-full h-full object-cover rounded-[18px]"
                                />
                              </div>
                              <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <h4 className="text-lg font-black tracking-tight leading-tight text-slate-900">Pratik Singh</h4>
                                <p className="text-xs font-bold mt-1 text-slate-500">Senior Legal Counsel</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dispute detected</p>
                                <p className="text-sm font-black text-slate-900">Payment overdue: 14 days</p>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                              <p className="text-xs font-medium text-slate-600 leading-relaxed italic">Brand has not released payment after approval. Legal notice workflow ready.</p>
                            </div>
                          </div>

                          <div className="md:col-span-7 grid grid-cols-2 gap-3">
                            {[
                              { label: 'Contract status', value: 'Signed', change: 'Usage rights locked' },
                              { label: 'Payment safety', value: 'Secured', change: 'UPI verified' },
                              { label: 'Deliverable proof', value: 'Uploaded', change: 'Draft reviewed' },
                              { label: 'Campaign outcome', value: 'Tracked', change: 'Links + proof stored' }
                            ].map((stat) => (
                              <div key={stat.label} className="p-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-lg font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                                <p className="text-[8px] font-black text-emerald-600 uppercase mt-2 tracking-widest">{stat.change}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentSlide === 4 && (
                <div className="flex-1 flex flex-col justify-between text-slate-800">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-28 rounded-full bg-slate-900/10 border border-slate-900/20 text-slate-800 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                        Workflow Demo
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Lean AI-Assisted Build
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
                          Creator Armour: <br />
                          The <span className="text-emerald-600">workflow is already live.</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                          The product now covers the core loop: brands discover and send structured offers; creators accept, counter, or manage deals; both sides track contracts, payments, shipping, deliverables, and campaign status in one place.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <p className="text-xs font-black uppercase text-slate-800 italic tracking-wider">The Infrastructure Moat</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Lean engineering-first execution with AI-assisted product development. The current MVP proves the workflow; funding accelerates distribution, automation, and integrations around a live product.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6-step campaign setup workflow (Light Mode style) */}
                  <div className="mt-8 relative">
                    {/* Background connector line */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0 hidden md:block" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
                      {[
                        { step: '01', title: 'Discover', desc: 'Verified creator supply', emoji: '🔍' },
                        { step: '02', title: 'Offer', desc: 'Structured briefs and terms', emoji: '🤖' },
                        { step: '03', title: 'Protect', desc: 'Contracts and payment safety', emoji: '🤝' },
                        { step: '04', title: 'Ship', desc: 'Product and address tracking', emoji: '📦' },
                        { step: '05', title: 'Approve', desc: 'Deliverable review loop', emoji: '🎬' },
                        { step: '06', title: 'Measure', desc: 'Campaign proof and analytics', emoji: '📊' }
                      ].map((item, i) => (
                        <div 
                          key={i} 
                          className="bg-white border border-slate-200/80 hover:border-emerald-500/30 p-3 rounded-2xl flex flex-col items-center text-center transition-all duration-300 group hover:-translate-y-1 shadow-xs"
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xs font-black mb-2 transition-all">
                            {item.emoji}
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">{item.step} • {item.title}</span>
                          <span className="text-[9px] text-slate-400 mt-1 leading-normal font-medium">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 5 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
                  <div className="space-y-4">
                    <div className="h-5 w-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Market Opportunity
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      A $3.5B shift in ad budgets <br />
                      demands an <span className="text-emerald-500">infrastructure layer.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      D2C brands are re-allocating up to 60% of traditional advertising spend to creator-led content. However, the backend coordination layer is still run like a manual agency.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'The D2C Ad-Spend Shift', desc: 'Rising acquisition costs on traditional Meta/Google channels are forcing brands to scale creator cohorts.' },
                        { title: 'Massive India TAM', desc: 'India\'s creator economy is growing at a 32% CAGR, projected to reach $3.5B by 2030.' }
                      ].map((item, i) => (
                        <div key={i} className="p-2 border-l-2 border-emerald-500/20 bg-slate-900/10">
                          <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* TAM/SAM/SOM Concentric Rings */}
                  <div className="flex flex-col justify-center items-center h-full max-h-[300px]">
                    <div className="relative w-52 h-52 flex items-center justify-center">
                      {/* TAM Ring */}
                      <div className="absolute w-52 h-52 rounded-full bg-emerald-500/[0.01] border border-dashed border-emerald-500/10 animate-spin" style={{ animationDuration: '65s' }} />
                      <div className="w-48 h-48 rounded-full bg-emerald-500/[0.02] border border-emerald-500/10 flex items-center justify-center relative shadow-inner">
                        <span className="absolute top-2.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">TAM: $3.5B Indian Creator Econ</span>
                        
                        {/* SAM Ring */}
                        <div className="w-36 h-36 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center relative shadow-md">
                          <span className="absolute top-2 text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">SAM: $450M Campaign Ops</span>
                          
                          {/* SOM Ring */}
                          <div className="w-20 h-20 rounded-full bg-emerald-500/25 border border-emerald-500/40 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/10 text-center p-2 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent pointer-events-none" />
                            <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">SOM</span>
                            <span className="text-xs font-black text-white italic uppercase tracking-tighter mt-0.5">$50M</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">Concentric Segment Breakdown</span>
                  </div>
                </div>
              )}

              {currentSlide === 6 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="h-5 w-28 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Business Model
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      Low-friction revenue. <br/>
                      <span className="text-emerald-500">Transaction-led scale.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      We monetize when creator commerce happens. Brands already understand commissions, creators join faster, and revenue can start before heavy SaaS usage.
                    </p>
                    <div className="space-y-3">
                      {[
                        { tier: 'Brand Collaboration Commission (5-15%)', desc: 'Primary revenue on paid/barter collaborations, UGC deals, campaign management, and creator sourcing.' },
                        { tier: 'Managed Campaign Operations', desc: 'Optional execution support for outreach, coordination, creator handling, tracking, and campaign delivery.' },
                        { tier: 'Future SaaS Expansion', desc: 'Internal workflow tools evolve into creator CRM, campaign automation, shipment tracking, and AI matching.' }
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-black text-emerald-400 uppercase italic">{item.tier}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Visually stunning economics chart */}
                  <div className="p-4 rounded-[32px] bg-slate-900/30 border border-white/5 flex flex-col justify-between h-full max-h-[260px]">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monetization Engine</p>
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Embedded Revenue</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Collaboration Commission', margin: 'Transactional' },
                        { label: 'Managed Campaign Ops', margin: 'Service' },
                        { label: 'Workflow Automation', margin: 'Future SaaS' },
                        { label: 'Escrow & Payments', margin: 'Fintech layer' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                          <span className="text-xs font-bold text-slate-300">{item.label}</span>
                          <span className="text-xs font-black text-emerald-400 italic uppercase">{item.margin}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 7 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="h-5 w-24 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Traction
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      Proof of momentum. <br/>
                      <span className="text-emerald-500">Speed is our edge.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      The hardest part at this stage is no longer whether the product can exist. It exists. The next question is distribution, repeat usage, and converting brand pain into retained workflow.
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'Functional MVP', value: 'Creator + Brand Dashboards Live' },
                        { label: 'Creator Supply', value: '100+ Onboarded & Profiled' },
                        { label: 'Distribution Motion', value: 'D2C Outreach Active' }
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                          <p className="text-xs font-bold text-slate-400">{stat.label}</p>
                          <p className="text-xs font-black text-emerald-400 italic uppercase">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Beautiful structured chart showing traction */}
                  <div className="grid grid-cols-2 gap-4 h-full max-h-[220px]">
                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center flex flex-col justify-center">
                      <p className="text-3xl font-black text-emerald-400 italic">Live</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Working Product</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center flex flex-col justify-center">
                      <p className="text-3xl font-black text-white italic">MVP</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Dashboards Live</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center flex flex-col justify-center">
                      <p className="text-3xl font-black text-white italic">100+</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Creator Profiles</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center flex flex-col justify-center">
                      <p className="text-3xl font-black text-emerald-400 italic">D2C</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Wedge Active</p>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 8 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="h-5 w-28 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Go-To-Market
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      The High-Frequency <br/>
                      Consumable <span className="text-emerald-500">Wedge.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Our wedge is shipment-heavy D2C brands where creator campaigns are frequent, operationally painful, and easy to demonstrate through a live dashboard.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'Live Demo-Led Outbound', desc: 'Show D2C founders a working brand dashboard, not a promise deck.' },
                        { title: 'Creator Supply Wedge', desc: 'Onboard niche creator clusters and package them into campaign-ready shortlists.' },
                        { title: 'CollabLink Flywheel', desc: 'Every creator profile and protected offer becomes a distribution surface for new brand leads.' }
                      ].map((item, i) => (
                        <div key={i} className="p-2 border-l-2 border-emerald-500/20 bg-slate-900/10 hover:bg-slate-900/20 transition-colors">
                          <h3 className="font-black uppercase italic text-[11px] text-white tracking-tight">{item.title}</h3>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Visually stunning wedge grid */}
                  <div className="grid grid-cols-2 gap-4 h-full max-h-[220px]">
                    <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                      <p className="text-xl font-black text-emerald-400 italic">Food</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Active Wedge</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                      <p className="text-xl font-black text-emerald-400 italic">Wellness</p>
                      <p className="text-[9px] font-black uppercase text-slate-500 mt-1 tracking-widest">Active Wedge</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center flex flex-col justify-center opacity-40">
                      <p className="text-xl font-black text-slate-400 italic">Beauty</p>
                      <p className="text-[9px] font-black uppercase text-slate-600 mt-1 tracking-widest">Upcoming</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 text-center flex flex-col justify-center opacity-40">
                      <p className="text-xl font-black text-slate-400 italic">Apparel</p>
                      <p className="text-[9px] font-black uppercase text-slate-600 mt-1 tracking-widest">Upcoming</p>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 9 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
                  <div className="space-y-4">
                    <div className="h-5 w-28 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Founder Story
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      Founder-market fit: <br/>
                      <span className="text-emerald-500">operator plus product.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      I scaled e-commerce brand <strong className="text-white">Mellowprints</strong> using ₹70L+ in Facebook ad spend and influencer collaborations. The repeated pain was not finding creators; it was coordinating work, protecting terms, tracking shipments, and proving outcomes. I built and shipped the MVP independently while simultaneously onboarding creators and D2C brands manually.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'Lived Brand Pain', desc: '₹70L+ ad spend managed firsthand, with creator gifting, shipping delays, payment followups, and media approvals.' },
                        { title: 'Technical Operator Velocity', desc: 'Lean AI-assisted build, real workflow testing, and manual GTM running in parallel.' }
                      ].map((item, i) => (
                        <div key={i} className="p-2 border-l-2 border-emerald-500/20 bg-slate-900/10">
                          <h3 className="font-black uppercase italic text-[11px] text-white tracking-tight">{item.title}</h3>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Visually stunning timeline of milestones */}
                  <div className="p-4 rounded-[32px] bg-slate-900/30 border border-white/5 flex flex-col justify-between h-full max-h-[220px]">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Milestone Timeline</p>
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Operator</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { year: 'Mellowprints', desc: 'Scaled e-commerce ops, ₹70L FB ad spend' },
                        { year: 'Creator Armour', desc: 'Independently shipped creator and brand dashboard MVP' },
                        { year: 'Next Phase', desc: 'Convert D2C wedge into repeatable workflow revenue' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <span className="text-xs font-black text-emerald-400 italic uppercase whitespace-nowrap">{item.year}</span>
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-slate-400 leading-tight">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 10 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
                  <div className="space-y-4">
                    <div className="h-5 w-28 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Category Vision
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Creator-led commerce <br/>
                      needs a <span className="text-emerald-500">trust layer.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Creator campaigns are moving from one-off posts to repeatable operating systems. The company that owns the deal workflow can own creator reliability, brand spend, campaign proof, and payout trust.
                    </p>
                    <div className="space-y-3">
                      {[
                        { title: 'Workflow Data Moat', desc: 'Every accepted offer, contract, shipment, approval, delay, payout, and campaign result improves creator reliability scoring.' },
                        { title: 'Trust Network Flywheel', desc: 'Creators join for protected deals. Brands join for reliable execution. Each side makes the other more valuable.' }
                      ].map((item, i) => (
                        <div key={i} className="p-2.5 border-l-2 border-emerald-500/20 bg-slate-900/10 hover:bg-slate-900/20 transition-colors">
                          <h3 className="font-black uppercase italic text-[11px] text-white tracking-tight">{item.title}</h3>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Premium Brand Statement Visual Box */}
                  <div className="p-6 rounded-[36px] bg-emerald-500/5 border border-emerald-500/25 flex flex-col justify-center items-center text-center relative overflow-hidden h-full max-h-[260px] shadow-lg shadow-emerald-500/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
                    <ShieldCheck className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="text-xl md:text-2xl font-black uppercase italic text-emerald-400 tracking-tighter">"Protected creator deals. <br/> Operationally clean campaigns."</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-4">The Trust + Workflow Layer</p>
                    <div className="h-0.5 w-12 bg-emerald-500/40 rounded-full mt-2" />
                  </div>
                </div>
              )}

              {currentSlide === 11 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="h-5 w-24 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      The Ask
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                      Raising ₹75L <span className="text-emerald-500">Pre-Seed.</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      We are raising pre-seed capital to accelerate distribution and workflow automation around a functional MVP, not to build from scratch.
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'Distribution Target', value: 'Repeat D2C Brand Campaigns' },
                        { label: 'Automation Target', value: 'Workflow + WhatsApp + Shipping' },
                        { label: 'Trust Target', value: 'Payments, Contracts, Verification' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                          <p className="text-xs font-bold text-slate-400">{item.label}</p>
                          <p className="text-xs font-black text-emerald-400 italic uppercase">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Visually stunning Pie Chart fund allocation */}
                  <div className="p-4 rounded-[32px] bg-slate-900/30 border border-white/5 flex flex-col justify-between h-full max-h-[260px]">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Use of Funds Allocation</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: '35% GTM & Brand Acquisition', value: 'D2C brands, creators, partnerships' },
                        { label: '30% Automation & Infrastructure', value: 'AI, WhatsApp, shipping, workflows' },
                        { label: '20% Operations & Trust Layer', value: 'Verification, payments, contracts' },
                        { label: '15% Team & Legal', value: 'Ops hires, compliance, runway buffer' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>{item.label}</span>
                            <span>{item.value}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: i === 0 ? '35%' : i === 1 ? '30%' : i === 2 ? '20%' : '15%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Toolbar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6 relative z-20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Slide {currentSlide + 1} • {currentSlide === 0 ? 'Start' : currentSlide === 11 ? 'End' : 'Active'}
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

export default InvestorPitchDeck;
