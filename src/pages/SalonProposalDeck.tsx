import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Play, 
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
  BookmarkCheck,
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
  MessageSquare,
  AlertTriangle,
  Eye,
  Plus,
  X,
  MapPin,
  Video
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

  const slidesCount = 8; // 8 high-impact slides

  const getSlideTheme = (slideId: number) => {
    if ([2, 4, 6].includes(slideId)) return 'luxury-dark'; // Obsidian Gold theme
    if ([1, 3, 5].includes(slideId)) return 'gold-accent'; // Champagne gold glow
    return 'dark'; // Cover & CTA
  };

  const theme = getSlideTheme(currentSlide);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    const originalNicheIndex = activeNicheIndex;
    
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const pdfWidth = 210;
      const pdfHeight = 297;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const addCoverPage = () => {
        pdf.setFillColor(5, 5, 8);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.setDrawColor(245, 158, 11);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(12, 12, pdfWidth - 24, pdfHeight - 24, 6, 6, 'S');

        pdf.setTextColor(245, 158, 11);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text('CREATOR ARMOUR', 20, 28);

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(26);
        pdf.text('SALON CHAIR MONETIZATION', 20, 52);
        pdf.text('ENGINE', 20, 64);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(160, 174, 192);
        pdf.setFontSize(12);
        pdf.text('WhatsApp-friendly sales deck for monetizing empty weekday slots.', 20, 79, { maxWidth: 170 });

        const bullets = [
          'Hyperlocal creator matching within 5km',
          'Satisfying Reels blueprints driving local foot traffic',
          'Barter leverage math and ROI tracking',
          'Exclusive pilot onboarding'
        ];

        let y = 104;
        bullets.forEach((bullet) => {
          pdf.setFillColor(17, 24, 39);
          pdf.roundedRect(20, y - 5, 170, 11, 3, 3, 'F');
          pdf.setTextColor(245, 158, 11);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text('•', 26, y + 1.2);
          pdf.setTextColor(255, 255, 255);
          pdf.text(bullet, 34, y + 1.2);
          y += 18;
        });

        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(9);
        pdf.text('Prepared for WhatsApp sharing', 20, 270);
        pdf.text('Creator Armour', pdfWidth - 20, 270, { align: 'right' });
      };
      
      addCoverPage();

      for (let i = 0; i < slidesCount; i++) {
        setCurrentSlide(i);
        setExportProgress(i + 1);
        await new Promise(r => setTimeout(r, 220));
        
        const nicheIndexes = i === 4 ? salonNiches.map((_, index) => index) : [null];
        for (let j = 0; j < nicheIndexes.length; j++) {
          const nicheIndex = nicheIndexes[j];
          if (typeof nicheIndex === 'number') {
            setActiveNicheIndex(nicheIndex);
            await new Promise(r => setTimeout(r, 180));
          }

          const card = document.getElementById('salon-pitch-deck-slide-card');
          if (!card) continue;
          
          // Save original styles to restore after capture (guarantees mobile-friendly A4 aspect ratio rendering)
          const originalWidth = card.style.width;
          const originalHeight = card.style.height;
          const originalMinHeight = card.style.minHeight;
          const originalMaxWidth = card.style.maxWidth;
          const originalTransform = card.style.transform;
          
          // Enforce uniform standard desktop landscape presentation dimensions
          card.style.width = '1100px';
          card.style.height = '620px';
          card.style.minHeight = '620px';
          card.style.maxWidth = '1100px';
          card.style.transform = 'none';
          
          const slideTheme = getSlideTheme(i);
          const bgColor = slideTheme === 'gold-accent' ? '#0d1220' : slideTheme === 'luxury-dark' ? '#070b14' : '#05070d';
          
          const canvas = await html2canvas(card, {
            scale: 2.5, // Balanced high-resolution scale
            useCORS: true,
            backgroundColor: bgColor,
            width: 1100,
            height: 620,
            windowWidth: 1200, // Forces desktop CSS media queries and responsive styles
            windowHeight: 700,
            scrollX: 0,
            scrollY: 0,
            removeContainer: true,
            logging: false
          });
          
          // Restore original responsive mobile styles instantly
          card.style.width = originalWidth;
          card.style.height = originalHeight;
          card.style.minHeight = originalMinHeight;
          card.style.maxWidth = originalMaxWidth;
          card.style.transform = originalTransform;
          
          const imgData = canvas.toDataURL('image/png');
          if (i > 0 || j > 0) {
            pdf.addPage();
          }
          
          const marginX = 10;
          const marginY = 12;
          const contentWidth = pdfWidth - marginX * 2;
          const contentHeight = pdfHeight - marginY * 2;
          const ratio = Math.min(contentWidth / canvas.width, contentHeight / canvas.height);
          const width = canvas.width * ratio;
          const height = canvas.height * ratio;
          const x = (pdfWidth - width) / 2;
          const y = (pdfHeight - height) / 2;

          pdf.addImage(imgData, 'PNG', x, y, width, height);
        }
      }
      
      pdf.save('Creator_Armour_Salon_Unused_Chair_Monetization.pdf');
      toast.success('Salon proposal successfully downloaded as PDF!');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setCurrentSlide(originalSlide);
      setActiveNicheIndex(originalNicheIndex);
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

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hey! I saw your Salon Chair Monetization Pilot. I'd love to get matched local beauty & lifestyle creators nearby to drive bookings into my salon.");
    const whatsappUrl = `https://wa.me/919999999999?text=${message}`; 
    window.open(whatsappUrl, '_blank');
  };

  // Niche blueprints with real images and local engagement indicators
  const salonNiches = [
    {
      title: 'Hydrafacial / Glass Skin Facials',
      retail: '₹3,500 - ₹5,000',
      barterCost: '₹450',
      hook: 'The Close-Up Glow Transformation',
      script: 'Close-ups of congested skin, satisfying ASMR hydro-vacuum extraction, and a final crystal-clear glass-skin glow in natural sunlight.',
      dopamineDesc: 'Satisfying visual dopamine drives massive saves, especially before weddings and festive seasons.',
      reelPreset: {
        views: '84,200 Views',
        shares: '1,240 Saves',
        directBookings: '14 Bookings'
      }
    },
    {
      title: 'Nail Extensions & Gel Art',
      retail: '₹2,500 - ₹4,000',
      barterCost: '₹300',
      hook: 'Aesthetic Nail Tapping & Custom Art',
      script: 'Macro video of chipped nails, satisfying prep clicks/shaping, and a premium daylight tapping transition showing Gel Extensions.',
      dopamineDesc: 'Highly shareable nail designs acting as direct bookmark referrals for the exact same custom work.',
      reelPreset: {
        views: '92,500 Views',
        shares: '2,890 Saves',
        directBookings: '19 Bookings'
      }
    },
    {
      title: 'Hair Smoothening & Keratin',
      retail: '₹6,000 - ₹12,000',
      barterCost: '₹800',
      hook: 'The Extreme Silk-Shine Swish',
      script: 'Monsoon frizz-to-glass transformation showing protein nourishment, steam styling, and the iconic shiny hair swish.',
      dopamineDesc: 'Removes hair-damage fear by showing a local creator’s smooth, glossy result, driving high-ticket bookings.',
      reelPreset: {
        views: '185,000 Views',
        shares: '4,100 Saves',
        directBookings: '28 Bookings'
      }
    },
    {
      title: 'Therapeutic Scalp Treatments',
      retail: '₹2,500 - ₹4,500',
      barterCost: '₹350',
      hook: 'The ASMR Head Wash Relaxation',
      script: 'Dry scalp check, followed by water-halo basin washing, therapeutic champi massage clips, and a fresh shiny blowout.',
      dopamineDesc: 'Triggering self-care envy. High saves for premium therapeutic experiences.',
      reelPreset: {
        views: '110,000 Views',
        shares: '3,450 Saves',
        directBookings: '16 Bookings'
      }
    },
    {
      title: 'Bridal Makeup Trials',
      retail: '₹4,500 - ₹8,000',
      barterCost: '₹600',
      hook: 'The Royalty Bridal Transition',
      script: 'Bride-to-be discussing wedding aesthetics, transitioning to custom HD bridal makeup and dupatta reveal under warm lights.',
      dopamineDesc: 'High-value bridal package leads driven by authentic, premium trial demonstrations.',
      reelPreset: {
        views: '142,000 Views',
        shares: '3,100 Saves',
        directBookings: '9 Wedding Deals'
      }
    },
    {
      title: 'Laser Hair Reduction',
      retail: '₹4,000 - ₹7,000',
      barterCost: '₹200',
      hook: 'Painless Laser: Expectation vs Reality',
      script: 'Addressing typical pain fears, showing the ice-cool gel glide, and reviewing smooth results on Indian skin tones.',
      dopamineDesc: 'Builds massive trust for clinical beauty treatments by showing the actual comfortable process.',
      reelPreset: {
        views: '73,000 Views',
        shares: '940 Saves',
        directBookings: '12 Consultations'
      }
    }
  ];

  const realBarterCost = Math.round(treatmentValue * (ingredientCostPercent / 100));

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-sans select-none overflow-hidden relative">
      <SEOHead
        title="Creator Armour | Salon Chair Monetization Engine"
        description="We turn your empty salon chairs into paying clients using beauty creators within 5km. Zero-managed barter campaigns."
        keywords={['salon bookings', 'salon barter local creators', 'chair monetization salon', 'hyperlocal salon marketing']}
      />

      {/* Decorative Champagne Gold Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-[160px]" />
      </div>

      {/* Presentation Header */}
      <header className="h-16 border-b border-amber-500/10 px-6 flex items-center justify-between bg-[#050505]/92 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <Sparkle className="h-5 w-5 text-amber-400 animate-spin-slow" />
          <span className="text-sm font-black uppercase tracking-widest italic">Creator <span className="text-amber-400">Armour</span></span>
          <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Unused-Chair Monetization Engine
          </span>
        </div>
        
        {/* Progress Tracker */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Unused-Chair Monetization</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-xs font-bold text-neutral-400">Page {currentSlide + 1} of {slidesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="px-3 py-1.5 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-amber-500/10 disabled:opacity-50"
            title="Download PDF Copy"
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
      <div className="h-1 bg-slate-900 relative z-20">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.7)] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slidesCount) * 100}%` }}
        />
      </div>

      {/* Presentation Workspace Canvas */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left Side Navigation List */}
        <nav className="hidden lg:flex w-72 border-r border-amber-500/10 bg-[#090909]/30 flex-col overflow-y-auto py-6 px-4 gap-2 scrollbar-thin">
          {[
            { id: 0, label: '01. Executive Hook', desc: 'Watch Instagram Reels' },
            { id: 1, label: '02. Sunk Cost Audit', desc: 'Premium salon pain points' },
            { id: 2, label: '03. How It Works', desc: '5km geolocated matching' },
            { id: 3, label: '04. Visual ROI Flow', desc: 'Barter leverage math' },
            { id: 4, label: '05. Reel Blueprints', desc: 'Satisfying visual concepts' },
            { id: 5, label: '06. Expected Outcomes', desc: 'Realistic booking numbers' },
            { id: 6, label: '07. Vetting & Proof', desc: 'Verified booking queries' },
            { id: 7, label: '08. Exclusive Pilot', desc: 'Selective onboarding' }
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
              className={`w-full max-w-[1100px] min-h-[560px] md:min-h-[620px] rounded-[32px] p-6 md:p-9 flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                isExporting ? '' : 'transition-all duration-300'
              } ${
                theme === 'luxury-dark' 
                  ? 'bg-gradient-to-br from-[#090909] via-[#050505] to-[#000000] border border-amber-500/10 text-white shadow-amber-950/5' 
                  : theme === 'gold-accent'
                  ? 'bg-gradient-to-br from-[#0d0903] via-[#050401] to-[#000000] border border-amber-400/20 text-white shadow-slate-950/10'
                  : 'bg-[#090909] border border-amber-500/10 text-white'
              }`}
              id="salon-pitch-deck-slide-card"
            >
              
              {/* PAGE 1: COVER PAGE */}
              {currentSlide === 0 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 my-auto h-full">
                  
                  {/* Faded Background Luxury Interior with Dark Overlay */}
                  <div className="absolute inset-0 z-0 pointer-events-none rounded-[32px] overflow-hidden">
                    <img 
                      src="/images/salon/creator_filming.png" 
                      alt="Luxury salon creator" 
                      className="w-full h-full object-cover filter blur-[3px] opacity-[0.22] scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_20%,rgba(5,5,5,0.85)_80%)]" />
                  </div>
 
                  <div className="lg:col-span-7 space-y-6 relative z-10">
                    <div className="h-8 px-4 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center text-[10px] font-black uppercase tracking-widest w-fit animate-pulse">
                      💆‍♀️ Unused-Chair Monetization Engine
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight text-white">
                      YOUR NEXT 20 CLIENTS ARE ALREADY <br/>
                      WATCHING <span className="text-amber-400">INSTAGRAM REELS.</span>
                    </h1>
                    <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-xl">
                      Turn quiet weekday hours into confirmed bookings with local creator matching.
                      <span className="text-amber-400 block mt-2 font-bold italic">
                        Instagram pushes geotagged Reels directly to women within 5km of your salon.
                      </span>
                    </p>
                    
                    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 pt-2">
                      <p>📍 5km Local Target</p>
                      <p>•</p>
                      <p>📸 Satisfying ASMR Reels</p>
                      <p>•</p>
                      <p>💆‍♀️ Unused Seat Optimization</p>
                    </div>
                  </div>

                  {/* High-Fidelity Creator Filming Viewfinder Mockup */}
                  <div className="lg:col-span-5 hidden lg:block h-full max-h-[340px] relative z-10">
                    <div className="bg-neutral-950 border border-amber-500/25 rounded-3xl p-3 backdrop-blur-md relative overflow-hidden shadow-2xl h-full flex flex-col justify-between aspect-[9/16] max-w-[280px] mx-auto group">
                      {/* Viewfinder borders */}
                      <div className="absolute inset-2.5 border border-white/10 rounded-2xl pointer-events-none z-10" />
                      {/* Corner crop marks */}
                      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500/80 z-20" />
                      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500/80 z-20" />
                      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500/80 z-20" />
                      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500/80 z-20" />
                      
                      <div className="absolute inset-0 bg-neutral-950/20 z-0" />
                      <img 
                        src="/images/salon/creator_filming.png" 
                        alt="Creator filming Reel inside luxurious salon" 
                        className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-80 z-0 select-none scale-105 group-hover:scale-110 transition-transform duration-[10000ms]"
                      />
                      
                      {/* Vetted badge */}
                      <div className="z-10 flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/30 text-[8px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 animate-pulse" /> 5km Radius
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest animate-bounce">
                          +14 Bookings
                        </span>
                      </div>

                      {/* Overlaid WhatsApp verified client message */}
                      <div className="z-10 bg-black/95 border border-white/10 rounded-2xl p-2.5 font-mono text-[8px] space-y-1 shadow-2xl relative mt-auto">
                        <p className="text-amber-400 font-bold uppercase text-[7px] tracking-wider flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 fill-amber-400 text-amber-400" /> Real-time Intake Proof
                        </p>
                        <p className="text-neutral-300">
                          <span className="text-white font-bold">Client:</span> "Saw the local hydrafacial transformation. Do you have a slot open tomorrow?"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2: THE PAIN (SUNK COST AUDIT) */}
              {currentSlide === 1 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-2">
                    <div className="h-5 w-fit px-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Sunk Cost Audit
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      The Cost of an <span className="text-red-400">Empty Salon Chair.</span>
                    </h2>
                    <p className="text-xs text-neutral-400 max-w-2xl font-medium">
                      Every premium salon has hidden leaks draining its monthly profits. Let's look at the operational reality:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 my-auto">
                    {[
                      {
                        title: 'Khali Kursi (Idle Chairs)',
                        label: 'Idle Inventory',
                        desc: 'Weekday chairs (Mon-Thu) sit completely empty. Rent, lights, and AC are still paid 100%.',
                        icon: '💺'
                      },
                      {
                        title: 'Unused Staff Hours',
                        label: 'Sunk Payroll',
                        desc: 'Stylists and therapists are on fixed monthly salaries, sitting idle during slow morning hours.',
                        icon: '⏳'
                      },
                      {
                        title: 'Expensive Meta Ads',
                        label: 'Cash Burn',
                        desc: 'Burning thousands on Instagram ads that attract fake profile clicks and zero local foot traffic.',
                        icon: '💸'
                      },
                      {
                        title: 'Wasted Barters',
                        label: 'Influencer Leak',
                        desc: 'Giving free ₹5,000 treatments to creators whose followers live in other states and who never post.',
                        icon: '❌'
                      },
                      {
                        title: 'Zero Booking Tracking',
                        label: 'Blind Spots',
                        desc: 'No clear way to attribute a free treatment or campaign to actual bookings or paid walk-ins.',
                        icon: '🛡️'
                      }
                    ].map((pain, pIdx) => (
                      <div key={pIdx} className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-4 flex flex-col justify-between min-h-[180px] hover:border-red-500/20 transition-all">
                        <div className="flex justify-between items-start">
                          <span className="text-xl">{pain.icon}</span>
                          <span className="text-[7.5px] font-black uppercase tracking-widest text-red-400/80">{pain.label}</span>
                        </div>
                        <div className="mt-4 text-left">
                          <p className="text-xs font-black uppercase text-white tracking-wide">{pain.title}</p>
                          <p className="text-[9px] text-neutral-400 mt-1 leading-relaxed font-medium">{pain.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3.5 text-center flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
                    <p className="text-xs text-neutral-300 font-bold">
                      <span className="text-amber-400 uppercase font-black">Creator Armour Fixes This:</span> We convert your empty slot capacity into geolocated local distribution.
                    </p>
                  </div>
                </div>
              )}

              {/* PAGE 3: HOW IT WORKS & LOCAL MAP VISUALIZATION */}
              {currentSlide === 2 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-2">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Hyperlocal Distribution
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Targeting Local Women <span className="text-amber-400">Within 5km.</span>
                    </h2>
                    <p className="text-xs text-neutral-400 max-w-2xl font-medium">
                      Instagram’s geotag pushes Reels to local women nearby. We match you with vetted creators who live within 5km.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-2">
                    
                    {/* Concentric 5km Map Mockup */}
                    <div className="lg:col-span-6 flex justify-center">
                      <div className="w-full max-w-[340px] aspect-square bg-[#050505] border border-amber-500/20 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-xl">
                        
                        {/* Map Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                        
                        {/* Concentric rings */}
                        <div className="absolute w-[80%] h-[80%] border border-dashed border-amber-500/10 rounded-full flex items-center justify-center">
                          <span className="absolute top-2 text-[7px] font-mono text-neutral-600 tracking-wider">5KM RADIUS</span>
                        </div>
                        <div className="absolute w-[50%] h-[50%] border border-dashed border-amber-500/20 rounded-full flex items-center justify-center">
                          <span className="absolute top-2 text-[7px] font-mono text-neutral-500 tracking-wider">2KM ZONE</span>
                        </div>

                        {/* Central Salon Pin */}
                        <div className="relative z-10 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center shadow-2xl animate-pulse">
                          <MapPin className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
                        </div>
                        <span className="absolute z-10 translate-y-7 text-[8px] font-black uppercase tracking-widest text-white bg-black/85 px-1.5 py-0.5 rounded border border-amber-500/20">Aesthetic Salon</span>

                        {/* Nearby Matched Creators */}
                        <div className="absolute top-[22%] left-[18%] z-10 bg-black/90 border border-white/10 rounded-xl p-1 flex items-center gap-1 text-[7px] font-mono shadow-2xl">
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold">C</div>
                          <span className="text-amber-400">@lajpat.beauty (1.2km)</span>
                        </div>
                        <div className="absolute bottom-[28%] right-[12%] z-10 bg-black/90 border border-white/10 rounded-xl p-1 flex items-center gap-1 text-[7px] font-mono shadow-2xl">
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold">C</div>
                          <span className="text-amber-400">@south.ex.style (2.8km)</span>
                        </div>
                        <div className="absolute bottom-[65%] right-[22%] z-10 bg-black/90 border border-white/10 rounded-xl p-1 flex items-center gap-1 text-[7px] font-mono shadow-2xl">
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/30 flex items-center justify-center font-bold">C</div>
                          <span className="text-amber-400">@gk2.lifestyle (0.8km)</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational match timeline */}
                    <div className="lg:col-span-6 space-y-3.5 text-left">
                      {[
                        { title: 'Local Creator Match', label: 'Hyperlocal Geotag', text: 'Vetted beauty creators living or working within 5km of your salon coordinates.' },
                        { title: ' directed script guide', label: 'High Dopamine ASMR', text: 'We direct creator close-ups, satisfying treatments, transformation hooks. No front-desk effort.' },
                        { title: 'Mon-Thu slot visits', label: 'Quiet Hour fill', text: 'Creators book slow weekday mornings. Empty chairs become booking machines.' },
                        { title: 'WhatsApp tracking', label: 'ROI attribution', text: 'Booking inquiries land directly on WhatsApp with dynamic referral tags.' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-2xl">
                          <span className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-black text-amber-400 shrink-0 font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase text-white tracking-wide">{item.title}</p>
                            <p className="text-[9px] font-black uppercase text-amber-400/80 font-mono mt-0.5">{item.label}</p>
                            <p className="text-[10px] text-neutral-400 leading-normal mt-1 font-medium">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🎯 Concentric targeting allows organic distribution directly to high-intent women in your exact neighborhood.
                  </div>
                </div>
              )}

              {/* PAGE 4: BARTER ECONOMICS & VISUAL ROI FLOW */}
              {currentSlide === 3 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Barter Math
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Unused Chair Monetization: <span className="text-amber-400">The Visual ROI.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-2">
                    
                    {/* Left: Slider Calculator */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-amber-400/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Percent className="h-4 w-4 animate-spin-slow" /> Interactive Barter Calculator
                        </p>
                        
                        <div className="space-y-3 font-mono">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-400 uppercase tracking-wider text-[8.5px] font-black">Treatment Retail Value</span>
                              <span className="text-white font-black text-xs">₹{treatmentValue.toLocaleString('en-IN')}</span>
                            </div>
                            <input 
                              type="range" 
                              min="1500" 
                              max="10000" 
                              step="500"
                              value={treatmentValue}
                              onChange={(e) => setTreatmentValue(Number(e.target.value))}
                              className="w-full accent-amber-500 bg-neutral-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-400 uppercase tracking-wider text-[8.5px] font-black">Raw Cost Percentage</span>
                              <span className="text-amber-400 font-black text-xs">{ingredientCostPercent}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="30" 
                              step="1"
                              value={ingredientCostPercent}
                              onChange={(e) => setIngredientCostPercent(Number(e.target.value))}
                              className="w-full accent-amber-500 bg-neutral-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2 text-center bg-black/40 p-2.5 rounded-xl">
                          <div>
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Your Raw Cost</p>
                            <p className="text-base font-black text-white mt-0.5">₹{realBarterCost}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Net Booking Margin</p>
                            <p className="text-base font-black text-amber-400 mt-0.5">{(100 - ingredientCostPercent)}% Leverage</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Visual ROI chain flow */}
                    <div className="lg:col-span-6 space-y-4">
                      <p className="text-amber-400 text-xs font-black uppercase tracking-wider text-left font-mono">
                        📈 Visual ROI chain
                      </p>

                      <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-5 space-y-4 text-left">
                        {[
                          { title: '1 Premium Treatment', label: `₹${realBarterCost} Raw Material Cost` },
                          { title: '1 Directed Creator Reel', label: 'Macro satisfying video scripts' },
                          { title: '82,000 geotargeted reach', label: 'Local women within 5km radius' },
                          { title: '14 direct client bookings', label: 'Dynamic WhatsApp intake attribution' },
                          { title: `₹${(treatmentValue * 14).toLocaleString('en-IN')} net bookings value`, label: 'Significant ROI leverage', highlight: true }
                        ].map((step, idx) => (
                          <div key={idx} className="relative flex items-start gap-3">
                            {/* Line connecting steps */}
                            {idx < 4 && (
                              <div className="absolute left-2.5 top-6 bottom-0 w-[1px] bg-amber-500/10 z-0 h-4" />
                            )}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 relative z-10 ${
                              step.highlight 
                                ? 'bg-emerald-500 text-black animate-bounce' 
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono'
                            }`}>
                              {idx === 4 ? '₹' : idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-xs font-black uppercase tracking-wide leading-none ${step.highlight ? 'text-emerald-400 font-black' : 'text-white'}`}>
                                {step.title}
                              </p>
                              <p className="text-[9px] text-neutral-500 font-medium font-mono mt-0.5">{step.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    💡 Spend raw ingredients • Receive geolocated distribution reaching local women within 5km of your door.
                  </div>
                </div>
              )}

              {/* PAGE 5: REEL BLUEPRINTS & WHY REELS WORK */}
              {currentSlide === 4 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      satisfying blue prints
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Reel Concepts & <span className="text-amber-400">Why They Perform.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto py-2">
                    
                    {/* Left: Why Reels Work visual blocks */}
                    <div className="lg:col-span-5 flex flex-col gap-2.5 justify-center text-left">
                      <p className="text-amber-400 text-xs font-black uppercase tracking-wider font-mono mb-1">
                        ⚡ Why Reels outperform ads
                      </p>
                      {[
                        { title: 'Pure ASMR Dopamine', desc: 'Satisfying sounds (hydro-vacuum clicks, basin washing) capture attention instantly.' },
                        { title: 'Transformation-Driven', desc: 'Desi skin concerns (monsoon frizz, tan lines) transforming to perfect glowing skin tone.' },
                        { title: 'High Save Psychology', desc: 'Indian women bookmark beauty transformation Reels to refer back before weddings and festivals.' },
                        { title: 'organic Local push', desc: 'Instagram geotags organically serve locally shot Reels to nearby neighborhood residents.' }
                      ].map((item, keyIdx) => (
                        <div key={keyIdx} className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                          <p className="text-xs font-black uppercase text-white tracking-wide">{item.title}</p>
                          <p className="text-[9.5px] text-neutral-400 mt-0.5 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Right: Niche Blueprints Tabs & Mock Video Preview */}
                    <div className="lg:col-span-7 bg-neutral-900 border border-white/10 rounded-3xl p-5 flex flex-col justify-between">
                      
                      <div className="flex overflow-x-auto gap-1 border-b border-white/5 pb-2 scrollbar-none">
                        {salonNiches.map((niche, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveNicheIndex(idx)}
                            className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                              activeNicheIndex === idx 
                                ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300'
                            }`}
                          >
                            {niche.title.split(' / ')[0]}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 items-center mt-4">
                        <div className="md:col-span-7 space-y-3 text-left">
                          <div>
                            <span className="text-[9px] font-black uppercase text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md border border-white/5 font-mono">
                              Barter Cost: {salonNiches[activeNicheIndex].barterCost} (Retail: {salonNiches[activeNicheIndex].retail})
                            </span>
                            <p className="text-xs font-black text-amber-400 leading-none uppercase mt-2">{salonNiches[activeNicheIndex].hook}</p>
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                            {salonNiches[activeNicheIndex].script}
                          </p>

                          <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 text-[9px] text-neutral-400 font-medium leading-relaxed font-sans">
                            {salonNiches[activeNicheIndex].dopamineDesc}
                          </div>
                        </div>

                        <div className="md:col-span-5 flex flex-col gap-2">
                          <div className="relative rounded-2xl border border-amber-500/15 overflow-hidden aspect-[4/3] max-h-[140px] flex items-center justify-center bg-black/60 shadow-xl">
                            <img 
                              src={
                                activeNicheIndex === 0 
                                  ? "/images/salon/before_after.png"
                                  : activeNicheIndex === 1
                                  ? "/images/salon/nail_extension.png"
                                  : activeNicheIndex === 2
                                  ? "/images/salon/hair_transformation.png"
                                  : activeNicheIndex === 3
                                  ? "/images/salon/scalp_steam.png"
                                  : "/images/salon/before_after.png"
                              } 
                              alt={salonNiches[activeNicheIndex].title} 
                              className="w-full h-full object-cover opacity-90 select-none scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                          </div>

                          <div className="bg-black/50 rounded-xl p-2.5 space-y-1 font-mono text-[7.5px] text-left">
                            <div className="flex justify-between text-neutral-400 border-b border-white/5 pb-0.5">
                              <span>Reel Reach:</span>
                              <span className="text-white font-black">{salonNiches[activeNicheIndex].reelPreset.views}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400 border-b border-white/5 pb-0.5">
                              <span>Saves (Bookmarks):</span>
                              <span className="text-amber-400 font-black">{salonNiches[activeNicheIndex].reelPreset.shares}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                              <span>Direct Bookings:</span>
                              <span className="text-emerald-400 font-black">{salonNiches[activeNicheIndex].reelPreset.directBookings}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">
                    🎯 Click any treatment above to see its custom creative concept & performance stats.
                  </div>
                </div>
              )}

              {/* PAGE 6: EXPECTED OUTCOMES & MATCHING CITIES */}
              {currentSlide === 5 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Target authority
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Hyperlocal Matches & <span className="text-amber-400">Expected Outcomes.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto py-2">
                    
                    {/* Left: Expected outcomes box (CONVERSION DRIVER) */}
                    <div className="lg:col-span-5 bg-neutral-900 border border-amber-500/20 rounded-3xl p-5 flex flex-col justify-between text-left">
                      <div>
                        <p className="text-amber-400 text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 shrink-0 animate-pulse" /> Expected Booking Metrics
                        </p>
                        <p className="text-[9.5px] text-neutral-400 leading-normal mt-2 font-medium">
                          We prioritize transparency and long-term trust. Here are the average realistic outcomes generated from 1 local creator collaboration:
                        </p>
                      </div>

                      <div className="space-y-3 font-mono my-4">
                        {[
                          { title: 'Geotargeted Reach', val: '5k – 80k Views', sub: 'High-intent local women within 5km radius' },
                          { title: 'WhatsApp Inquiries', val: '3 – 15 Chats', sub: 'Direct DMs or catalog clicks' },
                          { title: 'Confirmed Bookings', val: '1 – 8 Bookings', sub: 'Tracked via custom slot promo codes' },
                          { title: 'Peak Seasons', val: 'Weddings & Festivals', sub: 'Highest velocity during shaadi & Diwali months' }
                        ].map((stat, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-wider">{stat.title}</p>
                              <p className="text-[8px] text-neutral-500 leading-none mt-0.5">{stat.sub}</p>
                            </div>
                            <span className="text-xs font-black text-amber-400">{stat.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-black/35 rounded-xl p-3 border border-white/5 text-[9px] text-neutral-400 leading-relaxed font-sans font-medium">
                        Expected outcome conversions are highest when matching Satisfying ASMR sound syncs with slow weekday Mon-Thu mornings.
                      </div>
                    </div>

                    {/* Right: Who this is for & City lists */}
                    <div className="lg:col-span-7 flex flex-col gap-4 justify-between text-left">
                      
                      {/* Who this is for list (filters bad leads) */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">✓ Ideal Best Fit For</p>
                          <div className="space-y-1.5 text-[10px] font-medium text-neutral-300 font-sans">
                            <p className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Premium Salons</p>
                            <p className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Bridal Makeup Studios</p>
                            <p className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Aesthetic Nail Bars</p>
                            <p className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Hydrafacial Skin Clinics</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-red-400 font-mono">✕ Not Suitable For</p>
                          <div className="space-y-1.5 text-[10px] font-medium text-neutral-400 font-sans">
                            <p className="flex items-center gap-1.5"><span className="text-red-500 font-bold">✕</span> Budget Haircut Shops</p>
                            <p className="flex items-center gap-1.5"><span className="text-red-500 font-bold">✕</span> Walk-in Only Salons</p>
                            <p className="flex items-center gap-1.5"><span className="text-red-500 font-bold">✕</span> Mass Volume Shops</p>
                          </div>
                        </div>
                      </div>

                      {/* Hyperlocal city tags */}
                      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
                        <span className="absolute top-0 right-0 p-1.5 bg-amber-400/10 text-amber-400 text-[7px] font-black uppercase tracking-widest border-b border-l border-white/10 font-mono">
                          Active locations
                        </span>
                        <p className="text-xs font-black uppercase text-white tracking-wide mb-2">Supported Hyperlocal Zones</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Kolkata'].map((city, cIdx) => (
                            <span key={cIdx} className="px-2 py-1 bg-black/45 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider text-neutral-400">
                              🏙 {city}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🎯 Slot Protection Exclusivity: We match with only 5 partner salons per micro-area to avoid creator overlap.
                  </div>
                </div>
              )}

              {/* PAGE 7: TRUST & VISUAL PROOF (SCREENSHOTS AND DMS) */}
              {currentSlide === 6 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Vetted Vouch & Escrow
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Verified Visual Proof & <span className="text-amber-400">Foot Traffic.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-2">
                    
                    {/* Simulated High-Fidelity Instagram Reel Mockup screenshot */}
                    <div className="lg:col-span-6 bg-black border border-white/10 rounded-2xl p-4 flex gap-4 items-stretch relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-400 text-[6.5px] font-black uppercase tracking-widest border-b border-l border-white/10 font-mono">
                        Instagram Reel View
                      </div>
                      
                      {/* Video clip representation */}
                      <div className="w-[45%] relative rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-neutral-900 aspect-[9/16] shrink-0">
                        <img 
                          src="/images/salon/before_after.png" 
                          className="absolute inset-0 w-full h-full object-cover opacity-45 filter blur-[0.5px]" 
                        />
                        <Play className="h-6 w-6 text-amber-400 relative z-10 shrink-0" />
                        <div className="absolute bottom-2 inset-x-2 bg-black/85 p-1 rounded font-mono text-[7px] text-center text-emerald-400">
                          82k Views • 1.2k Saves
                        </div>
                      </div>

                      {/* Comments Feed representation */}
                      <div className="flex-1 flex flex-col justify-between text-left">
                        <p className="text-amber-400 text-[8.5px] font-black uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1 font-mono">
                          <MessageCircle className="h-3.5 w-3.5" /> High-Intent Comments
                        </p>
                        
                        <div className="space-y-2.5 my-2 max-h-[160px] overflow-y-auto scrollbar-thin text-[9.5px] font-medium leading-tight text-neutral-300">
                          <p><strong>@priya.k:</strong> "GK-2 branch price for Hydrafacial? DM list! 😍✨"</p>
                          <p><strong>@diksha_sharma:</strong> "Is that ASMR wash basin head halo scalp steam available this Wed?"</p>
                          <p><strong>@nisha.grvr:</strong> "Gel extension Thursday slot open? Nail tapping transition looks gorgeous! 💅"</p>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/15 p-2 rounded-xl text-[8.5px] text-neutral-400">
                          Comments are manually vetted by Creator Armour coordinator before the final post alert.
                        </div>
                      </div>
                    </div>

                    {/* Side-by-Side Simulated WhatsApp booking chats/DMs (DOUBLES TRUST) */}
                    <div className="lg:col-span-6 bg-neutral-900 border border-white/5 rounded-2xl p-4 shadow-xl text-xs font-mono relative flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-1.5 bg-[#25D366]/10 text-[#25D366] text-[7.5px] font-black uppercase tracking-widest border-b border-l border-white/10">
                        WhatsApp Booking Intake
                      </div>
                      
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-[#25D366]" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider font-mono">Simulated Intake chats</span>
                      </div>

                      <div className="space-y-2.5 text-[8.5px] my-auto">
                        <div className="bg-black/45 border-l-4 border-l-[#25D366] rounded-xl p-2.5 space-y-1 text-left relative">
                          <div className="flex justify-between items-center text-[7.5px] text-neutral-500 font-mono">
                            <span>WhatsApp Lead (Delhi GK-2)</span>
                            <span>10:42 AM</span>
                          </div>
                          <p className="text-neutral-300">
                            "Hey! Just saw @local.beauty's hydrafacial Reel. Do you have a slot open this Thursday at 11 AM?"
                          </p>
                        </div>

                        <div className="bg-black/45 border-l-4 border-l-[#25D366] rounded-xl p-2.5 space-y-1 text-left relative">
                          <div className="flex justify-between items-center text-[7.5px] text-neutral-500 font-mono">
                            <span>WhatsApp Lead (Bandra Mumbai)</span>
                            <span>11:15 AM</span>
                          </div>
                          <p className="text-neutral-300">
                            "Price list please? The frizz-to-glass keratin transformation looks unbelievable. Sending slot request today."
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/25 border border-white/5 rounded-xl p-2 text-center text-[8px] text-neutral-500 font-sans mt-3">
                        🛡️ Vetted locally • Slot exclusivity secured • 100% draft approved before going live
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    💡 High-fidelity proof captures show you exactly what happens behind the scenes. Zero ghosting.
                  </div>
                </div>
              )}

              {/* PAGE 8: EXCLUSIVE PILOT ONBOARDING FORM */}
              {currentSlide === 7 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">
                  
                  {/* Selective CTA Text */}
                  <div className="lg:col-span-6 space-y-5 text-left h-full flex flex-col justify-between py-2">
                    
                    <div className="space-y-4">
                      <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                        Selective Onboarding
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                        Apply For <br/>
                        Pilot Collaboration.
                      </h2>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                        We onboarding only 5 salons per micro-area/city to avoid creator overlap and secure slot exclusivity.
                      </p>
                    </div>

                    {/* Exclusivity Warning visual banner */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2 max-w-sm">
                      <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" /> Micro-Area Exclusivity Alert
                      </p>
                      <p className="text-[9.5px] text-neutral-400 leading-relaxed font-sans">
                        To guarantee high conversion rates and maintain neighborhood freshness, matched slots are locked permanently to matched early partner salons.
                      </p>
                    </div>

                    {/* WhatsApp CTA Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleWhatsAppClick}
                        className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-3 border border-emerald-400/20 active:scale-[0.98]"
                      >
                        <MessageSquare className="h-5 w-5 text-black fill-black" />
                        <span>Apply via WhatsApp</span>
                      </button>
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
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 text-center border-b border-white/5 pb-2 font-mono">
                            Or submit your details below
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
                              <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">WhatsApp Number *</label>
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
                                <option value="Laser Hair Removal">Laser Hair Reduction</option>
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
                                <span>Apply For Pilot matched creators</span>
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
                            Thank you for applying. Our lead coordinator is reviewing your details and will reach out on <span className="text-white font-bold">WhatsApp ({formData.whatsappNumber})</span> within 24 hours with your first 3 vetted creator profiles.
                          </p>
                          <p className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
                            ⚡ Exclusivity Lock: Secure your micro-area slot before your competitor does
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
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Unused-chair monetization infrastructure</span>
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
            <span>Apply For Pilot</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SalonProposalDeck;
