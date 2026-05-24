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
  Sparkles,
  Smartphone,
  CheckCircle,
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  FileText,
  Instagram,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Users,
  Percent,
  Calendar,
  Sparkle,
  Compass,
  ArrowUpRight,
  Flame,
  Check,
  CheckSquare,
  Lock,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';

const SalonProposalDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeNicheIndex, setActiveNicheIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Barter Cost Calculator States
  const [treatmentValue, setTreatmentValue] = useState(3500);
  const [ingredientCostPercent, setIngredientCostPercent] = useState(15);
  
  // Onboarding Form States
  const [formData, setFormData] = useState({
    salonName: '',
    managerName: '',
    workEmail: '',
    whatsappNumber: '',
    targetNiche: 'Hydrafacial',
    notes: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slidesCount = 7;

  const getSlideTheme = (slideId: number) => {
    if ([2, 4].includes(slideId)) return 'luxury-dark'; // Obsidian Gold theme
    if ([1, 5].includes(slideId)) return 'gold-accent'; // Intense champagne gold glow
    return 'dark'; // Cover & CTA
  };

  const theme = getSlideTheme(currentSlide);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' || 
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      
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
        await new Promise(r => setTimeout(r, 500));
        
        const card = document.getElementById('salon-pitch-deck-slide-card');
        if (!card) continue;
        
        const slideTheme = getSlideTheme(i);
        const bgColor = slideTheme === 'gold-accent' ? '#120d03' : slideTheme === 'luxury-dark' ? '#090909' : '#050505';
        
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
      
      pdf.save('Creator_Armour_Salon_Bookings_Deck.pdf');
      toast.success('Salon presentation successfully downloaded as PDF!');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setCurrentSlide(originalSlide);
      setIsExporting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.salonName || !formData.workEmail || !formData.whatsappNumber) {
      toast.error('Please enter all required fields!');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/brand-inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: formData.salonName,
          workEmail: formData.workEmail,
          website: `WhatsApp: ${formData.whatsappNumber}`,
          category: formData.targetNiche,
          budget: 'Barter Pilot (Free Campaign)',
          timeline: 'Immediate',
          notes: `Manager Name: ${formData.managerName}\nAdditional Message: ${formData.notes || 'None'}`,
          source: 'salon_proposal'
        }),
      });

      const resData = await response.json();
      if (response.ok || resData.success) {
        setFormSubmitted(true);
        toast.success('Pilot Application Received! We will contact you on WhatsApp with creator matches.');
      } else {
        toast.error(resData.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Connection issue. Please verify and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp click handler for P's high priority WhatsApp CTA
  const handleWhatsAppClick = () => {
    // Standard professional pre-filled message
    const message = encodeURIComponent("Hey! I saw your Salon Pilot Campaign page. I'd love to get matched local creators to drive bookings into my salon.");
    const whatsappUrl = `https://wa.me/919999999999?text=${message}`; // Placeholder contact number preserved
    window.open(whatsappUrl, '_blank');
  };

  // Reel Concepts that Actually Work for Salons (Niches)
  const salonNiches = [
    {
      title: 'Hydrafacial / Glass Skin Facials',
      retail: '₹3,500 - ₹5,000',
      barterCost: '₹450',
      hook: 'The Close-Up Glow Transformation',
      script: 'Creator films a raw close-up of their skin showing dry patches, then films satisfying ASMR hydro-suction treatment clips, and ends with a stunning "glass skin" glow in natural sunlight.',
      whyItWorks: 'Satisfying facial processes have extreme viral reach. Local women bookmark these reels to save them as reference treatments they want for their next salon day.',
      reelPreset: {
        creator: '@capture.by.khushi',
        views: '84K Views',
        shares: '1.2k saves',
        comments: [
          { user: 'ananya_sen', text: 'This facial looks so relaxing, where is this salon located?' },
          { user: 'rhea.sharma', text: 'Literally booking my next skin treatment here 😍' }
        ]
      }
    },
    {
      title: 'Nail Extensions & Gel Art',
      retail: '₹2,500 - ₹4,000',
      barterCost: '₹300',
      hook: 'Aesthetic Nail Tapping & Custom Art',
      script: 'Macro video showing old chipped nails, the professional shaping/shining ASMR clicking sounds, and a gorgeous daylight transition showing off detailed custom nail art.',
      whyItWorks: 'Nail designs are highly visual. Women actively save nail art reels to show to their technician, driving instant visits from women seeking the exact same look.',
      reelPreset: {
        creator: '@lilboxoffashion',
        views: '92K Views',
        shares: '2.8k saves',
        comments: [
          { user: 'kavya.k', text: 'This custom extension design is absolutely stunning!' },
          { user: 'ishaaa_9', text: 'DMing you for an appointment, need these exact nails!' }
        ]
      }
    },
    {
      title: 'Hair Smoothening & Gloss',
      retail: '₹6,000 - ₹12,000',
      barterCost: '₹800',
      hook: 'The Extreme Silk-Shine Swish',
      script: 'Before: Dry, frizzy, split-end hair. Process: Deep nourishing treatment steam and professional ironing. After: The iconic glossy hair swish in bright daylight.',
      whyItWorks: 'Hair smoothening is a high-ticket service. A dramatic, shiny transformation builds instant trust and convinces local women to spend on premium hair packages.',
      reelPreset: {
        creator: '@thegleamngown',
        views: '185K Views',
        shares: '4.1k saves',
        comments: [
          { user: 'meera_kapoor', text: 'My hair is so dry right now, which treatment was this?' },
          { user: 'tanya_j', text: 'The shine is incredible! Sending a DM for pricing.' }
        ]
      }
    },
    {
      title: 'Therapeutic Scalp Treatments',
      retail: '₹2,500 - ₹4,500',
      barterCost: '₹350',
      hook: 'The ASMR Head Wash Relaxation',
      script: 'Scalp diagnostic camera scan showing buildup, moving into soothing head-wash basin shampooing, relaxing scalp massage fingers, and fresh smooth blowdry blow-out.',
      whyItWorks: 'Head wash ASMR videos have massive, satisfying engagement. It sells relaxation and luxury, making local women book appointments to destress.',
      reelPreset: {
        creator: '@nehas_aura28',
        views: '110K Views',
        shares: '3.4k saves',
        comments: [
          { user: 'pujara.shikh', text: 'That water ring halo looks heavenly' },
          { user: 'ria_verma', text: 'Booking this scalp treatment for this weekend!' }
        ]
      }
    },
    {
      title: 'Bridal Makeup Trials',
      retail: '₹4,500 - ₹8,000',
      barterCost: '₹600',
      hook: 'The Royalty Bridal Transformation',
      script: 'Bride-to-be shows up in casual clothes sharing her wedding theme. Cut to the reveal in warm golden studio lights showcasing custom flawless bridal makeup.',
      whyItWorks: 'Brides are looking for highly rated local artists. Showing real, non-cakey bridal trial makeup converts extremely high-value wedding bookings.',
      reelPreset: {
        creator: '@storiesbyseema',
        views: '142K Views',
        shares: '3.1k saves',
        comments: [
          { user: 'bride_to_be_22', text: 'This makeup looks so clean and radiant! Is the trial free?' },
          { user: 'divya_oberoi', text: 'Exactly the kind of bridal glow I want!' }
        ]
      }
    },
    {
      title: 'Laser Hair Removal',
      retail: '₹4,000 - ₹7,000',
      barterCost: '₹200',
      hook: 'Painless Laser: Expectation vs Reality',
      script: 'Creator answers typical fears, films the ice-cool cooling gel glide on their skin, and reviews the absolute smooth and comfortable results.',
      whyItWorks: 'Laser hair removal has high customer hesitation. An honest creator review explaining that it is painless removes the barrier, turning viewers into clients.',
      reelPreset: {
        creator: '@monika_urs',
        views: '73K Views',
        shares: '940 saves',
        comments: [
          { user: 'shruti.m', text: 'I have been so scared to try laser. Is it actually painless?' },
          { user: 'pooja.r', text: 'Thanks for this, scheduling an initial consultation now!' }
        ]
      }
    }
  ];

  const realBarterCost = Math.round(treatmentValue * (ingredientCostPercent / 100));

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <SEOHead
        title="Creator Armour | Salon Collaboration Deck & Proposal"
        description="We bring local women into your salon using Instagram creators. Zero-managed barter campaigns with direct booking tracking."
        keywords={['salon client acquisition', 'salon barter marketing', 'salon bookings instagram', 'local creators salon']}
      />

      {/* Decorative Champagne Gold Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-yellow-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Presentation Header */}
      <header className="h-16 border-b border-white/[0.04] px-6 flex items-center justify-between bg-[#070707]/90 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <Sparkle className="h-5 w-5 text-amber-400 animate-spin-slow" />
          <span className="text-sm font-black uppercase tracking-widest italic">Creator <span className="text-amber-400">Armour</span></span>
          <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Salon Bookings Brief
          </span>
        </div>
        
        {/* Progress Tracker */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-black uppercase text-neutral-500 tracking-wider">Aesthetic Bookings Engine</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-xs font-bold text-neutral-400">Page {currentSlide + 1} of {slidesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="px-3 py-1.5 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-white/5 disabled:opacity-50"
            title="Download landscape PDF copy for forwarding"
          >
            <FileText className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Download Deck PDF</span>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors border border-white/5"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Progress Bar indicator */}
      <div className="h-1 bg-neutral-900 relative z-20">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-600 shadow-[0_0_8px_#f59e0b] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slidesCount) * 100}%` }}
        />
      </div>

      {/* Presentation Workspace Canvas */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left Side Navigation List */}
        <nav className="hidden lg:flex w-72 border-r border-white/[0.04] bg-[#070707]/30 flex-col overflow-y-auto py-6 px-4 gap-2 scrollbar-thin">
          {[
            { id: 0, label: '01. Cover Hook', desc: 'Your Next 20 Clients' },
            { id: 1, label: '02. How It Works', desc: 'Quiet Chair Booking' },
            { id: 2, label: '03. Why Barter Works', desc: 'Cheapest Marketing Hack' },
            { id: 3, label: '04. Reel Concepts', desc: 'Visual blueprints' },
            { id: 4, label: '05. Safety Guarantee', desc: 'Creators Must Post' },
            { id: 5, label: '06. Free Pilot Offer', desc: 'Zero Cost Setup' },
            { id: 6, label: '07. WhatsApp to Start', desc: 'Request matched creators' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentSlide(item.id)}
              className={`w-full p-3 rounded-2xl text-left border transition-all ${
                currentSlide === item.id 
                  ? 'bg-amber-500/5 border-amber-500/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.02)]' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/20'
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wider">{item.label}</p>
              <p className="text-[11px] font-medium text-neutral-500 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </nav>

        {/* Dynamic Landscape A4 Card Holder */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden bg-black/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={isExporting ? "exporting" : currentSlide}
              initial={isExporting ? false : { opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={isExporting ? false : { opacity: 0, scale: 0.98, y: -10 }}
              transition={isExporting ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
              className={`w-full max-w-5xl min-h-[500px] md:min-h-[540px] rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                isExporting ? '' : 'transition-all duration-300'
              } ${
                theme === 'luxury-dark' 
                  ? 'bg-gradient-to-br from-[#0c0c0c] to-[#050505] border border-amber-500/10 text-white shadow-amber-950/5' 
                  : theme === 'gold-accent'
                  ? 'bg-gradient-to-br from-[#120d03] to-[#050505] border border-amber-500/25 text-white shadow-yellow-950/10'
                  : 'bg-[#080808] border border-white/5 text-white'
              }`}
              id="salon-pitch-deck-slide-card"
            >
              
              {/* PAGE 1: COVER PAGE */}
              {currentSlide === 0 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 my-auto">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="h-8 px-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] font-black uppercase tracking-widest w-fit animate-pulse">
                      💆‍♀️ Salon Partnership
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                      YOUR NEXT 20 HIGH-VALUE CLIENTS <br/>
                      ARE ALREADY WATCHING <span className="text-amber-400">REELS.</span>
                    </h1>
                    <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed max-w-xl">
                      We help salons turn barter creator visits into real bookings.
                      <span className="text-amber-400 block mt-2 font-bold italic">No large retainers. We bring local women walking directly into your chairs.</span>
                    </p>
                    
                    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 pt-2">
                      <p>✨ 100% Barter Collabs</p>
                      <p>•</p>
                      <p>📸 High-Aesthetic Reels</p>
                      <p>•</p>
                      <p>💆‍♀️ Direct Booking Tracking</p>
                    </div>
                  </div>

                  {/* Simulated High-Converting Instagram Reel Feed */}
                  <div className="lg:col-span-5 hidden lg:block">
                    <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-4 backdrop-blur-md relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-2 bg-amber-400/10 text-amber-400 text-[8px] font-black tracking-widest uppercase rounded-bl-xl border-l border-b border-amber-500/20">
                        Aesthetic Capture
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[10px] font-black text-amber-400">
                          CK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">@capture.by.khushi</p>
                          <p className="text-[9px] text-neutral-500">Lucknow • Beauty & Lifestyle</p>
                        </div>
                      </div>
                      <div className="aspect-[4/3] rounded-2xl bg-neutral-950 border border-white/5 flex flex-col justify-between p-3 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0" />
                        
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-800 font-black opacity-30 select-none text-4xl italic">
                          HYDRAFACIAL
                        </div>
                        
                        <div className="z-10 flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[8px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <Sparkles className="h-2 w-2" /> Live Glow Process
                          </span>
                        </div>

                        <div className="z-10 text-left space-y-1">
                          <p className="text-[10px] font-bold text-white leading-tight">My skin is literally glass now! 😭 Visited @TheLuxuryLounge for their premium Hydrafacial treatment...</p>
                          <div className="flex gap-2 text-[9px] text-neutral-400 font-medium">
                            <span>#hydrafacial</span>
                            <span>#selfcare</span>
                            <span>#hairskincare</span>
                          </div>
                        </div>
                      </div>

                      {/* Mock Instagram Engagement Row */}
                      <div className="flex justify-between items-center mt-3 px-1 text-neutral-500">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-300"><Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> 8,420</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-300"><MessageCircle className="h-3.5 w-3.5" /> 230</span>
                        </div>
                        <Bookmark className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2: HOW IT WORKS */}
              {currentSlide === 1 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-2">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Quiet Chair Bookings
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Turning Quiet Hours into <span className="text-amber-400">Paying Clients.</span>
                    </h2>
                    <p className="text-xs text-neutral-400 max-w-2xl">
                      We handle all the coordination, briefing, and creator follow-ups. Zero effort required from your staff.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 my-auto">
                    {[
                      { step: '01', title: 'Local Creator Matching', desc: 'We match you with aesthetic local creators in your neighborhood who have a highly active female following.' },
                      { step: '02', title: 'We Guide the Filming', desc: 'We guide creators on exactly what to film so the treatment looks luxurious and satisfying.' },
                      { step: '03', title: 'Quiet Hour Visits', desc: 'Creators visit during your slow days (Mon-Thu mornings), filling empty chairs without interrupting paying clients.' },
                      { step: '04', title: 'We Track Bookings', desc: 'We track how many bookings each Reel generates, so you see the exact return on your barter treatment.' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[160px] hover:border-amber-500/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-amber-400/20">{item.step}</span>
                          <CheckCircle className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-black uppercase text-white tracking-wide">{item.title}</p>
                          <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest border-t border-white/[0.04] pt-3">
                    🚀 Fully managed setup • Zero workload on your front desk
                  </div>
                </div>
              )}

              {/* PAGE 3: WHY BARTER WORKS (THE MARGINS MATH) */}
              {currentSlide === 2 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      The Cheapest Marketing
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Why Barter Is Your <span className="text-amber-400">Cheapest Marketing Hack.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-2">
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-amber-400/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Percent className="h-4 w-4" /> Barter Cost Estimator
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-neutral-300 mb-1">
                              <span>Treatment Retail Value</span>
                              <span className="text-amber-400">₹{treatmentValue}</span>
                            </div>
                            <input 
                              type="range" 
                              min="2000" 
                              max="12000" 
                              step="500"
                              value={treatmentValue} 
                              onChange={(e) => setTreatmentValue(Number(e.target.value))}
                              className="w-full accent-amber-400 bg-neutral-800 h-1 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-neutral-300 mb-1">
                              <span>Service Material/Ingredient Cost</span>
                              <span className="text-amber-400">{ingredientCostPercent}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="25" 
                              step="1"
                              value={ingredientCostPercent} 
                              onChange={(e) => setIngredientCostPercent(Number(e.target.value))}
                              className="w-full accent-amber-400 bg-neutral-800 h-1 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2 text-center">
                          <div className="bg-black/40 rounded-xl p-2">
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Your Raw Product Cost</p>
                            <p className="text-base font-black text-white mt-0.5">₹{realBarterCost}</p>
                          </div>
                          <div className="bg-black/40 rounded-xl p-2">
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Estimated Local Views</p>
                            <p className="text-base font-black text-amber-400 mt-0.5">20k - 100k</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-3">
                      <div className="bg-[#120d03] border border-amber-500/25 rounded-2xl p-4 text-center space-y-1">
                        <p className="text-amber-400 text-xs font-black uppercase tracking-wider">The Power Formula</p>
                        <h3 className="text-2xl font-black text-white leading-tight">
                          ₹500 treatment cost can generate a Reel seen by 20k–100k local women.
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-medium">It builds massive organic trust without spending tens of thousands on fake ads.</p>
                      </div>

                      {[
                        { title: 'High Service Margins', desc: 'Your cost is just the raw product ingredients (like keratin shampoo or facial gel) + empty chair time. The staff and electric costs are already running.' },
                        { title: 'The Reels Algorithm Advantage', desc: 'Instagram serves local geolocated content to local users. Tagging your location puts your salon directly on the feeds of women within 5-10km of your door.' }
                      ].map((item, i) => (
                        <div key={i} className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex gap-3 hover:bg-white/[0.03] transition-colors">
                          <div className="h-5 w-5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</p>
                            <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    💡 Empty seats on weekdays have 0 value. Barter turns them into local bookings.
                  </div>
                </div>
              )}

              {/* PAGE 4: REEL CONCEPTS (NICHE BLUEPRINTS) */}
              {currentSlide === 3 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Reel blueprints
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Reel concepts that <span className="text-amber-400">actually work for salons.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto py-2">
                    
                    {/* Navigation Tabs of Niches */}
                    <div className="lg:col-span-4 flex flex-col gap-1.5 justify-center">
                      {salonNiches.map((niche, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveNicheIndex(idx)}
                          className={`w-full p-2.5 rounded-xl text-left border transition-all text-xs font-bold uppercase tracking-wider ${
                            activeNicheIndex === idx 
                              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {niche.title.split(' / ')[0]}
                        </button>
                      ))}
                    </div>

                    {/* Detailed Concept Detail Card */}
                    <div className="lg:col-span-8 bg-neutral-900/40 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[250px]">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-amber-400">{salonNiches[activeNicheIndex].title}</span>
                          <span className="text-[9px] font-black uppercase text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md">
                            Barter Cost: {salonNiches[activeNicheIndex].barterCost} (Retail: {salonNiches[activeNicheIndex].retail})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">What should creators post?</p>
                            <p className="text-xs font-bold text-white mt-0.5 italic">"{salonNiches[activeNicheIndex].hook}"</p>
                            
                            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 mt-3">The Video Concept</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed font-medium">
                              {salonNiches[activeNicheIndex].script}
                            </p>
                          </div>

                          <div className="bg-black/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">Why it gets bookings</span>
                              <span className="text-[9px] text-neutral-500 font-mono">{salonNiches[activeNicheIndex].reelPreset.creator}</span>
                            </div>
                            
                            <p className="text-[10px] text-neutral-300 my-2 leading-relaxed">
                              {salonNiches[activeNicheIndex].whyItWorks}
                            </p>

                            <div className="bg-black/50 rounded-xl p-2 space-y-1 text-[8px] font-medium leading-tight">
                              <p className="text-amber-400 font-bold uppercase tracking-widest text-[7px] mb-0.5">Top Audience Inquiry</p>
                              {salonNiches[activeNicheIndex].reelPreset.comments.map((comm, cidx) => (
                                <p key={cidx} className="text-neutral-300">
                                  <span className="font-bold text-white">@{comm.user}:</span> {comm.text}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest pt-2 border-t border-white/5 mt-2">
                        📈 Reels Performance: {salonNiches[activeNicheIndex].reelPreset.views} | {salonNiches[activeNicheIndex].reelPreset.shares}
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🎯 Click any treatment above to see its custom creative concept & why it brings bookings
                  </div>
                </div>
              )}

              {/* PAGE 5: SAFETY SHIELD */}
              {currentSlide === 4 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Safety Guarantee
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      We make sure <span className="text-amber-400">creators actually post.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-2">
                    
                    {/* Visual mockup of the vetting interface */}
                    <div className="lg:col-span-6 hidden lg:block bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl text-xs font-mono relative">
                      <div className="absolute top-0 right-0 p-1.5 bg-amber-400/10 text-amber-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-white/10">
                        Vetting Shield
                      </div>
                      
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                        <Smartphone className="h-4 w-4 text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Video Verification</span>
                      </div>

                      <div className="space-y-2 text-[10px]">
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <p className="text-neutral-500 font-bold uppercase text-[8px] tracking-widest">Matched Creator</p>
                          <p className="text-white font-bold mt-0.5">Khushi (@capture.by.khushi)</p>
                          <div className="flex gap-3 text-neutral-400 text-[8.5px] mt-1 font-sans">
                            <span>Followers: 94.2k</span>
                            <span>Aesthetic Food & Skincare</span>
                          </div>
                        </div>

                        <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                          <div className="flex justify-between items-center text-neutral-300">
                            <span className="font-bold text-amber-400">Video Status: UPLOADED FOR REVIEW</span>
                            <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[7px] font-black uppercase tracking-widest rounded">Pending</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-2 font-sans text-[8px]">
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-center text-neutral-400">
                              <span className="block font-black text-amber-400">✓</span>
                              Visual Glow OK
                            </div>
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-center text-neutral-400">
                              <span className="block font-black text-amber-400">✓</span>
                              Audio Selection OK
                            </div>
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-center text-neutral-400">
                              <span className="block font-black text-amber-400">✓</span>
                              Location Tag OK
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 text-[8px] font-sans justify-end pt-1">
                          <button className="px-3 py-1 bg-neutral-800 border border-white/5 rounded-md text-neutral-400 font-bold">Reject Draft</button>
                          <button className="px-3 py-1 bg-amber-500 text-black font-black uppercase tracking-wider rounded-md">Approve & Post</button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-4">
                      {[
                        { title: 'Vetted Creators Only', desc: 'We only match you with creators who have verified, active local audiences in your city.' },
                        { title: 'Draft Approval', desc: 'You approve the video draft before it goes live, ensuring your salon and services look absolutely premium.' },
                        { title: 'Posting Reminders', desc: 'We handle all follow-ups and nudges so your staff never has to chase anyone down.' },
                        { title: 'Missed-Post Protection', desc: 'If a creator receives a treatment and fails to post within 7 days, they are immediately flagged, restricted, and replaced.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <CheckCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black uppercase text-white tracking-wide">{item.title}</p>
                            <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🛡️ No ghosts • No low-quality posts • Complete protection for your salon treatments
                  </div>
                </div>
              )}

              {/* PAGE 6: FREE PILOT CAMPAIGN */}
              {currentSlide === 5 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative text-center max-w-3xl mx-auto my-auto space-y-6">
                  <div className="space-y-2">
                    <div className="h-6 w-fit mx-auto px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black uppercase tracking-widest">
                      ✨ Limited Partnership Spot
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Free Pilot Campaign for <br/>
                      Early Partner Salons
                    </h2>
                  </div>

                  <p className="text-sm md:text-base text-neutral-300 font-medium leading-relaxed">
                    We want to prove we can bring local women into your chairs before you run any paid campaigns. We will manage your very first creator collaboration completely for free.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left py-2">
                    {[
                      { title: 'Free Creator Matching', desc: 'We source, screen, and match 3 aesthetic local creators specifically suited for your salon treatments.' },
                      { title: 'Fully Guided Briefs', desc: 'We handle script direction, satisfying video guidance, and draft vetting before posting.' },
                      { title: 'No Setup Fee', desc: 'Zero platform charges, service fees, or tracking setup costs. Your only investment is the ingredients.' }
                    ].map((item, i) => (
                      <div key={i} className="bg-amber-400/[0.02] border border-amber-500/10 rounded-2xl p-4 hover:border-amber-500/20 transition-all">
                        <Check className="h-5 w-5 text-amber-400 mb-2" />
                        <p className="text-xs font-black uppercase text-white tracking-wide leading-snug">{item.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
                    ⚠️ Limited to the first 5 salons in each city this month to guarantee high attention
                  </div>
                </div>
              )}

              {/* PAGE 7: ONBOARDING / CONTACT FORM */}
              {currentSlide === 6 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">
                  <div className="lg:col-span-6 space-y-5 text-left">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Aesthetic Growth Engine
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Let's set up <br/>
                      your first <span className="text-amber-400">barter pilot.</span>
                    </h2>
                    <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                      Skip the traditional paperwork. Get your first 3 matched local creators sent directly to your phone.
                    </p>

                    {/* Pratyush's requested high-converting WhatsApp Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleWhatsAppClick}
                        className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,211,102,0.25)] hover:shadow-[0_4px_25px_rgba(37,211,102,0.4)] flex items-center justify-center gap-3 border border-emerald-400/20 active:scale-[0.98]"
                      >
                        <MessageSquare className="h-5 w-5 text-black fill-black" />
                        <span>WhatsApp Us To Start Free Pilot</span>
                      </button>
                      <p className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider mt-2.5 px-1">
                        ⚡ Quickest Option: Match creators directly on WhatsApp within 10 minutes
                      </p>
                    </div>
                  </div>

                  {/* Form as backup */}
                  <div className="lg:col-span-6 bg-neutral-900 border border-white/10 rounded-3xl p-5 shadow-2xl relative">
                    <AnimatePresence mode="wait">
                      {!formSubmitted ? (
                        <motion.form 
                          key="form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onSubmit={handleFormSubmit} 
                          className="space-y-3.5 text-left"
                        >
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 text-center border-b border-white/5 pb-2">
                            Or drop your details below
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Salon Name *</label>
                              <input 
                                type="text"
                                required
                                value={formData.salonName}
                                onChange={(e) => setFormData({...formData, salonName: e.target.value})}
                                placeholder="e.g. Blossom Luxury Salon"
                                className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Work Email *</label>
                              <input 
                                type="email"
                                required
                                value={formData.workEmail}
                                onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
                                placeholder="e.g. contact@luxuryblossom.com"
                                className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">WhatsApp / Phone *</label>
                              <input 
                                type="tel"
                                required
                                value={formData.whatsappNumber}
                                onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                                placeholder="e.g. +91 98765 43210"
                                className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Target Treatment Niche</label>
                              <select
                                value={formData.targetNiche}
                                onChange={(e) => setFormData({...formData, targetNiche: e.target.value})}
                                className="w-full px-3 py-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                              >
                                <option value="Hydrafacial">Hydrafacial</option>
                                <option value="Nail Extensions">Nails Art</option>
                                <option value="Hair Smoothening">Hair smoothing</option>
                                <option value="Scalp Treatment">Scalp head ASMR</option>
                                <option value="Bridal Makeup">Bridal Makeup Trial</option>
                                <option value="Laser Hair Removal">Laser Hair Removal</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black uppercase tracking-wider rounded-xl text-xs hover:from-amber-400 hover:to-yellow-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <span>Sending Details...</span>
                            ) : (
                              <>
                                <span>Request Matched Creators</span>
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </motion.form>
                      ) : (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="py-10 text-center space-y-4"
                        >
                          <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8" />
                          </div>
                          <h3 className="text-xl font-black uppercase tracking-wide text-white">Application Received! ✨</h3>
                          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                            Thank you for joining the Creator Armour early partner circle. Our lead coordinator is reviewing your salon details and will reach out to you on <span className="text-white font-bold">WhatsApp ({formData.whatsappNumber})</span> within 24 hours with your first 3 vetted creator profiles.
                          </p>
                          <button
                            onClick={() => setFormSubmitted(false)}
                            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-black uppercase tracking-wider rounded-xl text-[10px] transition-colors"
                          >
                            Submit Another Request
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Landscape PDF Deck Footer info */}
              <footer className="flex justify-between items-center border-t border-white/[0.04] pt-4 mt-6 text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Vetted Creator Operations Infrastructure</span>
                <span>Page {currentSlide + 1} of {slidesCount}</span>
                <span>© {new Date().getFullYear()} Creator Armour</span>
              </footer>

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <footer className="h-16 border-t border-white/[0.04] px-6 flex items-center justify-between bg-[#070707]/90 backdrop-blur-md relative z-20">
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-2 hover:bg-neutral-900 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slidesCount - 1}
            className="p-2 hover:bg-neutral-900 border border-white/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Slide progress buttons */}
        <div className="hidden md:flex gap-1.5">
          {Array.from({ length: slidesCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx 
                  ? 'w-8 bg-amber-400 shadow-[0_0_6px_#f59e0b]' 
                  : 'w-2.5 bg-neutral-800 hover:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider hidden sm:inline">Use Arrow keys or Spacebar to navigate</span>
          <button
            onClick={handleWhatsAppClick}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-wider hover:bg-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
            <span>WhatsApp Us Now</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SalonProposalDeck;
