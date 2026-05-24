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
  MessageSquare,
  AlertTriangle,
  Eye,
  Plus,
  X,
  MapPin,
  BookmarkCheck,
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

  const slidesCount = 7;

  const getSlideTheme = (slideId: number) => {
    if ([2, 4].includes(slideId)) return 'luxury-dark'; // Obsidian Gold theme
    if ([1, 5].includes(slideId)) return 'gold-accent'; // Champagne gold glow
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
        pdf.text('WhatsApp-friendly pitch deck for turning salon empty slots into bookings.', 20, 79, { maxWidth: 170 });

        const bullets = [
          'Hyperlocal creator matching within 5km',
          'Five reel concepts for salon-specific treatments',
          'Barter economics and ROI framing',
          'Pilot-ready workflow with WhatsApp intake'
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
        
        const nicheIndexes = i === 3 ? salonNiches.map((_, index) => index) : [null];
        for (let j = 0; j < nicheIndexes.length; j++) {
          const nicheIndex = nicheIndexes[j];
          if (typeof nicheIndex === 'number') {
            setActiveNicheIndex(nicheIndex);
            await new Promise(r => setTimeout(r, 180));
          }

          const card = document.getElementById('salon-pitch-deck-slide-card');
          if (!card) continue;
          
          const slideTheme = getSlideTheme(i);
          const bgColor = slideTheme === 'gold-accent' ? '#0d1220' : slideTheme === 'luxury-dark' ? '#070b14' : '#05070d';
          const canvasWidth = Math.max(Math.round(card.getBoundingClientRect().width * 2.5), 2400);
          const canvasHeight = Math.max(Math.round(card.getBoundingClientRect().height * 2.5), 1350);
          
          const canvas = await html2canvas(card, {
            scale: 3.25,
            useCORS: true,
            backgroundColor: bgColor,
            width: canvasWidth,
            height: canvasHeight,
            windowWidth: canvasWidth,
            windowHeight: canvasHeight,
            scrollX: 0,
            scrollY: 0,
            removeContainer: true,
            logging: false
          });
          
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
    const whatsappUrl = `https://wa.me/919999999999?text=${message}`; // Coordinator preserved WhatsApp number
    window.open(whatsappUrl, '_blank');
  };

  // Niche blueprints with real images and local engagement indicators
  const salonNiches = [
    {
      title: 'Hydrafacial / Glass Skin Facials',
      retail: '₹3,500 - ₹5,000',
      barterCost: '₹450',
      hook: 'The Close-Up Glow Transformation',
      script: 'Creator films raw close-ups of congested skin, shows the soothing ASMR hydro-vacuum extraction process, and finishes with a crystal-clear, glass-skin glow in natural sunlight.',
      whyItWorks: 'Women save these Reels to book later before weddings, parties & vacations. Seeing unedited skin glow within a 5km radius drives immediate local trust.',
      hasBeforeAfterImage: true,
      reelPreset: {
        creator: '@capture.by.khushi',
        views: '84,200 Views',
        shares: '1,240 Saves',
        directBookings: '14 Bookings',
        comments: [
          { user: 'ananya_sen', text: 'This looks so relaxing! Is this salon in Delhi GK-2? Booking now!' },
          { user: 'rhea.sharma', text: 'Need this hydrafacial treatment before my vacation next week!' }
        ]
      }
    },
    {
      title: 'Nail Extensions & Gel Art',
      retail: '₹2,500 - ₹4,000',
      barterCost: '₹300',
      hook: 'Aesthetic Nail Tapping & Custom Art',
      script: 'Macro video showing old chipped nails, the satisfying prep clicks/shaping, and a premium sunlight tapping transition showing off high-gloss gel extension nail art.',
      whyItWorks: 'Nails are highly social. Women bookmark nail art styles to show to their technician, making this Reel a direct referral magnet for the exact same custom design.',
      reelPreset: {
        creator: '@lilboxoffashion',
        views: '92,500 Views',
        shares: '2,890 Saves',
        directBookings: '19 Bookings',
        comments: [
          { user: 'kavya.k', text: 'Stunning art! Can your GK salon replicate this next Thursday?' },
          { user: 'ishaaa_9', text: 'Sending direct DM for extensions, these are gorgeous!' }
        ]
      }
    },
    {
      title: 'Hair Smoothening & Keratin',
      retail: '₹6,000 - ₹12,000',
      barterCost: '₹800',
      hook: 'The Extreme Silk-Shine Swish',
      script: 'Before: Dry, frizzy, tangled hair. Process: Deep nourishing protein application, steam, and professional ironing. After: The iconic glossy hair swish in daylight.',
      whyItWorks: 'Hair smoothing is a major decision. Showing a local creator’s transformation removes fear of hair damage, driving immediate high-ticket hair appointments.',
      reelPreset: {
        creator: '@thegleamngown',
        views: '185,000 Views',
        shares: '4,100 Saves',
        directBookings: '28 Bookings',
        comments: [
          { user: 'meera_kapoor', text: 'My hair looks exactly like her before. Sending WhatsApp to book.' },
          { user: 'tanya_j', text: 'The gloss is blinding omg! What is the price for this?' }
        ]
      }
    },
    {
      title: 'Therapeutic Scalp Treatments',
      retail: '₹2,500 - ₹4,500',
      barterCost: '₹350',
      hook: 'The ASMR Head Wash Relaxation',
      script: 'Detailed scalp camera check showing dryness, water-halo basin washing clips, soothing head massage fingers, and a fresh shiny blowout.',
      whyItWorks: 'ASMR head washes trigger absolute envy. Women book these treatments specifically for self-care, stress relief, and vacations, looking for a luxury escape nearby.',
      reelPreset: {
        creator: '@nehas_aura28',
        views: '110,000 Views',
        shares: '3,450 Saves',
        directBookings: '16 Bookings',
        comments: [
          { user: 'pujara.shikh', text: 'That water ring head halo looks heavenly, booking this weekend' },
          { user: 'ria_verma', text: 'Need this scalp massage to destress ASAP' }
        ]
      }
    },
    {
      title: 'Bridal Makeup Trials',
      retail: '₹4,500 - ₹8,000',
      barterCost: '₹600',
      hook: 'The Royalty Bridal Transition',
      script: 'Starts with bride-to-be in casual clothes discussing wedding aesthetics. Transition in warm studio lights to her custom HD bridal makeup and veil reveal.',
      whyItWorks: 'Brides-to-be scour local media. A real, high-resolution bridal trial look directly targets wedding bookings, generating high-value bridal packages.',
      reelPreset: {
        creator: '@storiesbyseema',
        views: '142,000 Views',
        shares: '3,100 Saves',
        directBookings: '9 Wedding Deals',
        comments: [
          { user: 'bride_to_be_2026', text: 'Which artist did this? Need a quote for December wedding!' },
          { user: 'divya_oberoi', text: 'So glowing and clean, not heavy or cakey at all!' }
        ]
      }
    },
    {
      title: 'Laser Hair Reduction',
      retail: '₹4,000 - ₹7,000',
      barterCost: '₹200',
      hook: 'Painless Laser: Expectation vs Reality',
      script: 'Creator answers typical fears, films the ice-cool cooling gel glide on their skin, and reviews the absolute smooth and comfortable results.',
      whyItWorks: 'Local laser deals fail because of pain fear. A trusted creator review proving the process is comfortable removes the block, driving massive clinical consultation visits.',
      reelPreset: {
        creator: '@monika_urs',
        views: '73,000 Views',
        shares: '940 Saves',
        directBookings: '12 Consultations',
        comments: [
          { user: 'shruti.m', text: 'Is it actually painless? I have been so scared to try laser' },
          { user: 'pooja.r', text: 'Exactly the reassurance I needed, calling your clinic!' }
        ]
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
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Aesthetic Bookings Engine</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-xs font-bold text-neutral-400">Page {currentSlide + 1} of {slidesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="px-3 py-1.5 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-amber-500/10 disabled:opacity-50"
            title="Download portrait PDF copy for forwarding"
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
            { id: 0, label: '01. Cover Hook', desc: 'Real Local Bookings' },
            { id: 1, label: '02. How It Works', desc: 'Quiet Chair Booking' },
            { id: 2, label: '03. Barter Economics', desc: 'cheapest marketing hack' },
            { id: 3, label: '04. Reel Concepts', desc: 'visual blueprints' },
            { id: 4, label: '05. Shield & Comparison', desc: 'why agencies fail' },
            { id: 5, label: '06. Free Pilot Offer', desc: 'No monthly retainers' },
            { id: 6, label: '07. WhatsApp to Start', desc: 'Match local creators' }
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
                      💆‍♀️ Chair Monetization Infrastructure
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
                      YOUR NEXT 20 HIGH-VALUE CLIENTS <br/>
                      ARE ALREADY WATCHING <span className="text-amber-400">INSTAGRAM REELS.</span>
                    </h1>
                    <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-xl">
                      We help premium salons turn creator visits into bookings.
                      <span className="text-amber-400 block mt-2 font-bold italic">
                        Instagram pushes geotagged Reels directly to local women within 5km of your salon.
                      </span>
                    </p>
                    
                    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 pt-2">
                      <p>📍 5km Local Target</p>
                      <p>•</p>
                      <p>📸 Geotagged Reels</p>
                      <p>•</p>
                      <p>💆‍♀️ Booking Tracking Engine</p>
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
                          <Sparkles className="h-2.5 w-2.5 animate-pulse" /> GK-2 Delhi Target
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest animate-bounce">
                          +18 Bookings
                        </span>
                      </div>

                      {/* Overlaid WhatsApp verified client message */}
                      <div className="z-10 bg-black/95 border border-white/10 rounded-2xl p-2.5 font-mono text-[8px] space-y-1 shadow-2xl relative mt-auto">
                        <p className="text-amber-400 font-bold uppercase text-[7px] tracking-wider flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 fill-amber-400 text-amber-400 animate-pulse" /> WhatsApp Intake Proof
                        </p>
                        <p className="text-neutral-300">
                          <span className="text-white font-bold">Client:</span> "Hey! Just saw the local creator's hydrafacial Reel. Do you have a slot this Wednesday at 12 PM?"
                        </p>
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
                      We handle all the coordination, script direction, and creator reminders. Zero workload on your front desk.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-4 my-auto">
                    
                    {/* Card 1: Local Matching with Instagram mini profile UI */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4 flex flex-col justify-between min-h-[220px] hover:border-amber-500/20 transition-colors relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-amber-400/20">01</span>
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-400/70 border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5">📍 Geotagged Match</span>
                      </div>
                      
                      {/* Mini Instagram Profile Layout */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-2 space-y-1.5 relative overflow-hidden text-[8px] font-sans">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[8px] font-black font-mono text-amber-400">C</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white leading-none truncate">@local.beauty</p>
                            <p className="text-neutral-500 text-[6.5px]">Local • 25k followers</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="aspect-square bg-neutral-800 rounded border border-white/5 overflow-hidden">
                            <img src="/images/salon/before_after.png" className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div className="aspect-square bg-neutral-800 rounded border border-white/5 overflow-hidden">
                            <img src="/images/salon/creator_filming.png" className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div className="aspect-square bg-neutral-800 rounded border border-white/5 flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-amber-500/10 to-yellow-600/10">
                            <MapPin className="h-2 w-2 text-amber-400" />
                            <span className="text-[5.5px] font-bold text-neutral-400 uppercase tracking-tight">Nearby (5km)</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-xs font-black uppercase text-white tracking-wide">Local Matching</p>
                        <p className="text-[9.5px] text-neutral-400 mt-1 leading-relaxed font-medium">We match you with lifestyle creators nearby (within 5km of your salon).</p>
                      </div>
                    </div>

                    {/* Card 2: We Guide The Filming with mini phone view */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4 flex flex-col justify-between min-h-[220px] hover:border-amber-500/20 transition-colors relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-amber-400/20">02</span>
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-400/70 border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5">📸 Reels Shot Guide</span>
                      </div>

                      {/* Mini Reels recording view */}
                      <div className="bg-black/50 border border-white/5 rounded-xl p-1.5 relative overflow-hidden flex flex-col justify-between aspect-[16/9] w-full my-1.5">
                        <div className="absolute inset-0 bg-neutral-950/20" />
                        <img src="/images/salon/creator_filming.png" className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-[0.5px]" />
                        
                        <div className="relative z-10 flex justify-between items-center text-[6px] font-mono">
                          <span className="text-neutral-400 font-bold uppercase flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /> REC
                          </span>
                          <span className="text-neutral-400">HD 60FPS</span>
                        </div>
                        
                        <div className="relative z-10 bg-white/5 backdrop-blur-md rounded border border-white/10 p-1 flex items-center gap-1.5 text-[6px]">
                          <Sparkles className="h-2 w-2 text-amber-400 shrink-0 animate-spin-slow" />
                          <span className="text-neutral-300 font-sans leading-tight">Concept: Serum Glow Close-Up</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-xs font-black uppercase text-white tracking-wide">We Guide Filming</p>
                        <p className="text-[9.5px] text-neutral-400 mt-1 leading-relaxed font-medium">We direct creators exactly what to film for highly satisfying visual dopamine.</p>
                      </div>
                    </div>

                    {/* Card 3: Quiet Slot Visits with empty vs creator split */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 md:p-4 flex flex-col justify-between min-h-[220px] hover:border-amber-500/20 transition-colors relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-amber-400/20">03</span>
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-400/70 border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5">💺 Mon-Thu chair fill</span>
                      </div>

                      {/* Split Empty vs Creator chair monetized */}
                      <div className="grid grid-cols-2 gap-1.5 text-[7px] font-mono my-1">
                        <div className="bg-red-950/10 border border-red-500/10 rounded-xl p-1 text-center flex flex-col justify-between min-h-[64px]">
                          <p className="text-neutral-500 uppercase tracking-widest text-[5px]">Mon-Thu AM</p>
                          <div className="my-1 flex justify-center text-red-400/30">
                            <Users className="h-3 w-3" />
                          </div>
                          <p className="text-[7px] font-black text-red-400 leading-none">0% Booked</p>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-1 text-center flex flex-col justify-between min-h-[64px] relative overflow-hidden">
                          <img src="/images/salon/hair_transformation.png" className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[0.5px]" />
                          <p className="relative z-10 text-amber-400 uppercase tracking-widest text-[5px]">Chair Filmed</p>
                          <div className="relative z-10 my-0.5 text-emerald-400 font-sans font-black text-[8px] flex items-center justify-center gap-0.5 animate-bounce">
                            +18k Views
                          </div>
                          <p className="relative z-10 text-[7px] font-black text-emerald-400 leading-none">Monetized</p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-xs font-black uppercase text-white tracking-wide">Quiet Slot Visits</p>
                        <p className="text-[9.5px] text-neutral-400 mt-1 leading-relaxed font-medium">Creators visit during slow weekday hours, turning empty slots into distribution.</p>
                      </div>
                    </div>

                    {/* Card 4: Track Bookings with WhatsApp screenshot mockup */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[220px] hover:border-amber-500/20 transition-colors relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-amber-400/20">04</span>
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-400/70 border border-amber-500/10 px-2 py-0.5 rounded bg-amber-500/5">💬 direct inquiries</span>
                      </div>

                      {/* Mini WhatsApp screenshot and Booking status */}
                      <div className="space-y-1 my-1">
                        <div className="bg-[#128C7E]/10 border border-[#25D366]/20 rounded-xl p-1.5 flex items-center gap-1.5 text-neutral-300 font-sans leading-tight text-[6px]">
                          <MessageSquare className="h-2.5 w-2.5 text-[#25D366] shrink-0 fill-[#25D366]/10" />
                          <div>
                            <p className="text-[#25D366] font-bold text-[5.5px] leading-none uppercase">WhatsApp Lead</p>
                            <p className="italic mt-0.5">“Saw your Reel! Do you have slot tomorrow?”</p>
                          </div>
                        </div>
                        <div className="bg-neutral-900 border border-white/5 rounded-xl p-1 flex items-center justify-between text-neutral-400 text-[6px] font-mono">
                          <span className="font-bold">📅 WED 11 AM</span>
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[5px] border border-emerald-500/25">BOOKED</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-xs font-black uppercase text-white tracking-wide">Track Bookings</p>
                        <p className="text-[9.5px] text-neutral-400 mt-1 leading-relaxed font-medium">We track dynamic booking inquiries directly, showing your exact barter ROI.</p>
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🎯 No monthly agency retainers • 100% managed execution • Zero front desk friction
                  </div>
                </div>
              )}

              {/* PAGE 3: ECONOMICS formula */}
              {currentSlide === 2 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Chair Monetization Math
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      Why Barter Is Your <span className="text-amber-400">Cheapest Bookings Engine.</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto py-2">
                    
                    {/* Left side: Interactive Margin Calculator & Comparative Chart */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-amber-400/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                        <p className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Percent className="h-4 w-4" /> Live Barter Cost Breakdown
                        </p>
                        
                        <div className="space-y-3">
                          {/* Retail Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-400 uppercase tracking-wider text-[8.5px] font-bold">Treatment Retail Value</span>
                              <span className="text-white font-black">₹{treatmentValue}</span>
                            </div>
                            <input 
                              type="range" 
                              min="1500" 
                              max="10000" 
                              step="500"
                              value={treatmentValue}
                              onChange={(e) => setTreatmentValue(Number(e.target.value))}
                              className="w-full accent-amber-500 bg-neutral-900 h-1 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Ingredient Percent Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-400 uppercase tracking-wider text-[8.5px] font-bold">Raw Material/Ingredient Cost</span>
                              <span className="text-amber-400 font-black">{ingredientCostPercent}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="30" 
                              step="1"
                              value={ingredientCostPercent}
                              onChange={(e) => setIngredientCostPercent(Number(e.target.value))}
                              className="w-full accent-amber-500 bg-neutral-900 h-1 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Comparative Visual Bars */}
                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <p className="text-[8.5px] font-black uppercase text-neutral-500 tracking-wider">Visual Leverage comparison</p>
                          
                          {/* Raw material cost bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                              <span>Raw Ingredient Cost (₹{realBarterCost})</span>
                              <span>{ingredientCostPercent}%</span>
                            </div>
                            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500/80 rounded-full" style={{ width: `${ingredientCostPercent}%` }} />
                            </div>
                          </div>

                          {/* Retail value bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-neutral-400">
                              <span>Retail Booking price (₹{treatmentValue})</span>
                              <span>100% Value</span>
                            </div>
                            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full" style={{ width: '60%' }} />
                            </div>
                          </div>

                          {/* expected bookings return bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-emerald-400">
                              <span>Est. Bookings Revenue (₹{Math.round(treatmentValue * 4.2)})</span>
                              <span>420% ROI leverage</span>
                            </div>
                            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-2 grid grid-cols-2 gap-2 text-center bg-black/40 p-2.5 rounded-xl">
                          <div>
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Your Raw cost</p>
                            <p className="text-base font-black text-white mt-0.5">₹{realBarterCost}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Net Booking Margin</p>
                            <p className="text-base font-black text-amber-400 mt-0.5">{(100 - ingredientCostPercent)}% Leverage</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Reels analytics and verified comments proof */}
                    <div className="lg:col-span-6 space-y-3">
                      
                      {/* Simulated Instagram Reels Analytics Panel */}
                      <div className="bg-[#120d03] border border-amber-500/25 rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-amber-500/10 text-amber-400 text-[6.5px] font-black uppercase tracking-widest border-b border-l border-amber-500/25 rounded-bl-lg font-mono">
                          Reel performance stats
                        </div>
                        <p className="text-[8.5px] font-black uppercase text-neutral-400 mb-2 font-mono flex items-center gap-1 text-amber-400">
                          <Instagram className="h-3 w-3" /> Live Instagram metrics
                        </p>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                            <p className="text-[7.5px] font-black uppercase text-neutral-500">Reach Views</p>
                            <p className="text-sm font-black text-white mt-0.5">82k</p>
                          </div>
                          <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                            <p className="text-[7.5px] font-black uppercase text-neutral-500 flex items-center justify-center gap-0.5">
                              <Heart className="h-2 w-2 text-red-500 fill-red-500 shrink-0" /> Likes
                            </p>
                            <p className="text-sm font-black text-amber-400 mt-0.5">4.1k</p>
                          </div>
                          <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                            <p className="text-[7.5px] font-black uppercase text-neutral-500 flex items-center justify-center gap-0.5">
                              <BookmarkCheck className="h-2 w-2 text-amber-400 shrink-0" /> Saves
                            </p>
                            <p className="text-sm font-black text-amber-400 mt-0.5">137</p>
                          </div>
                          <div className="bg-black/50 p-2 rounded-xl border border-white/5">
                            <p className="text-[7.5px] font-black uppercase text-neutral-500">Bookings</p>
                            <p className="text-sm font-black text-emerald-400 mt-0.5">14</p>
                          </div>
                        </div>
                      </div>

                      {/* Local comments visual panel - SELLS HARDER than anything */}
                      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-3 font-sans relative">
                        <p className="text-amber-400 text-[8px] font-black uppercase tracking-widest border-b border-white/5 pb-1">
                          💬 High-Intent Local Comments (within 5km)
                        </p>
                        <div className="space-y-2 text-[9px] max-h-[110px] overflow-y-auto scrollbar-thin">
                          <p className="text-neutral-300 font-medium leading-tight">
                            <span className="text-white font-bold">@priya_kapoor:</span> "Where is this salon located? GK-2? Need to book this hydrafacial before my wedding next week! 😭👰‍♀️"
                          </p>
                          <p className="text-neutral-300 font-medium leading-tight">
                            <span className="text-white font-bold">@diksha.sharma:</span> "Price list please? That ASMR head wash scalp steam halo looks so heavenly! 😍"
                          </p>
                          <p className="text-neutral-300 font-medium leading-tight">
                            <span className="text-white font-bold">@ria.oberoi:</span> "Do you have slots open for nail gel art this Thursday at your South Ext branch?"
                          </p>
                          <p className="text-neutral-300 font-medium leading-tight text-neutral-400">
                            <span className="text-neutral-300 font-bold">@nisha_grover:</span> "Love this custom art, sending you a DM to book nail extensions today!"
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 space-y-1 text-center">
                        <p className="text-[9.5px] text-neutral-300 font-bold italic">
                          "Meta ads burn money after 24 hours. Reels keep bringing bookings for weeks."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    💡 Spend raw ingredients • Receive geolocated distribution reaching local women within 5km of your door
                  </div>
                </div>
              )}

              {/* PAGE 4: REEL BLUEPRINTS (VISUAL HEAVEN) */}
              {currentSlide === 3 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Reel Blueprints (Visual Heaven)
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
                              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.01]'
                          }`}
                        >
                          {niche.title.split(' / ')[0]}
                        </button>
                      ))}
                    </div>

                    {/* Detailed Concept Detail Card with AI image asset embedding */}
                    <div className="lg:col-span-8 bg-neutral-900/40 border border-white/5 rounded-3xl p-5 flex flex-col justify-between min-h-[300px]">
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-amber-400">{salonNiches[activeNicheIndex].title}</span>
                          <span className="text-[9px] font-black uppercase text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-md">
                            Barter Cost: {salonNiches[activeNicheIndex].barterCost} (Retail: {salonNiches[activeNicheIndex].retail})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 items-center">
                          <div className="md:col-span-6 space-y-2.5">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 font-mono">Creative Hook Concept</p>
                              <p className="text-xs font-bold text-white leading-tight italic">"{salonNiches[activeNicheIndex].hook}"</p>
                            </div>
                            
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500 font-mono">The Video Concept</p>
                              <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                                {salonNiches[activeNicheIndex].script}
                              </p>
                            </div>

                            <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 text-[8.5px] text-neutral-300 font-medium font-sans">
                              {salonNiches[activeNicheIndex].dopamineDesc}
                            </div>
                          </div>

                          <div className="md:col-span-6 flex flex-col gap-2 h-full justify-between">
                            {/* satisfying high-fidelity images integration based on Niche index */}
                            <div className="relative rounded-2xl border border-amber-500/15 overflow-hidden aspect-[4/3] max-h-[150px] flex items-center justify-center bg-black/60 shadow-xl group">
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
                                    : "/images/salon/before_after.png" // fallback
                                } 
                                alt={salonNiches[activeNicheIndex].title} 
                                className="w-full h-full object-cover opacity-90 select-none group-hover:scale-105 transition-transform duration-[6000ms]"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="h-8 w-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                  <Play className="h-4.5 w-4.5 fill-black text-black ml-0.5" />
                                </span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-black/85 px-2 py-1 text-[7.5px] font-mono text-center text-amber-400 font-bold border-t border-white/5">
                                Satisfying visual dopamine = High saves/bookmarks
                              </div>
                            </div>

                            {/* Direct Booking & Saves proof highlights */}
                            <div className="bg-black/50 rounded-xl p-2.5 space-y-1 font-mono text-[8px]">
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

                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest pt-2 border-t border-white/5 mt-1 font-sans">
                        💡 Save/Share Psychology: Women save these Reels to book later before weddings, parties & vacations.
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🎯 Click any treatment above to see its custom creative concept & why it brings bookings
                  </div>
                </div>
              )}

              {/* PAGE 5: TRUST PAGE (Vetting Dashboard Infrastructure) */}
              {currentSlide === 4 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-1">
                    <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                      Infrastructure Trust
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
                      We make sure <span className="text-amber-400">creators actually post.</span>
                    </h2>
                  </div>

                  {/* Side-by-Side Vetting and comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-2">
                    
                    {/* Failure items */}
                    <div className="lg:col-span-5 bg-red-950/10 border border-red-500/20 rounded-2xl p-4 space-y-3 text-left">
                      <p className="text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <X className="h-4 w-4 shrink-0 animate-pulse" /> Why campaigns fail
                      </p>
                      <div className="space-y-2.5 text-[9px] text-neutral-400">
                        <p className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">❌</span> <span><strong className="text-neutral-200">Random college influencers:</strong> Zero local target authority or booking conversion.</span></p>
                        <p className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">❌</span> <span><strong className="text-neutral-200">No hyperlocal geotargeting:</strong> Reel views come from random states instead of women within 5km radius.</span></p>
                        <p className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">❌</span> <span><strong className="text-neutral-200">No ROI tracking:</strong> Free treatments are wasted with zero measured bookings.</span></p>
                        <p className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">❌</span> <span><strong className="text-neutral-200">Creators ghost:</strong> Creators receive a free ₹5,000 service and simply never post.</span></p>
                      </div>
                    </div>

                    {/* Vetting Dashboard Infrastructure panel */}
                    <div className="lg:col-span-7 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-xl text-xs font-mono relative">
                      <div className="absolute top-0 right-0 p-1.5 bg-amber-400/10 text-amber-400 text-[8px] font-black uppercase tracking-widest border-b border-l border-white/10">
                        Escrow & Vetting Infrastructure
                      </div>
                      
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2.5">
                        <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Vetting Approval Dashboard</span>
                      </div>

                      <div className="space-y-2 text-[9px]">
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[9px] font-black font-mono text-amber-400">C</div>
                            <div className="text-left">
                              <p className="text-neutral-500 font-bold uppercase text-[7px] tracking-widest">Matched Creator</p>
                              <p className="text-white font-bold mt-0.5">Verified Creator (@local.beauty)</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black rounded-full animate-pulse">
                            CREATOR VERIFIED
                          </span>
                        </div>

                        <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/20 text-left">
                          <div className="flex justify-between items-center text-neutral-300">
                            <span className="font-bold text-amber-400 font-sans">Draft Status: DRAFT SUBMITTED</span>
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[7px] font-black uppercase tracking-widest rounded border border-amber-500/20">DRAFT APPROVED</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2 font-sans text-[8px]">
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-neutral-400 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-black">✓</span> Geotagged GK-2 Delhi
                            </div>
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-neutral-400 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-black">✓</span> ASMR wash sound sync
                            </div>
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-neutral-400 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-black">✓</span> 5km local radius target
                            </div>
                            <div className="bg-neutral-800 rounded-md p-1.5 border border-white/5 text-neutral-400 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-black">✓</span> Booking promo code
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="text-[10px] font-bold text-neutral-500 text-center uppercase tracking-widest">
                    🛡️ Vetted locally • Exclusivity secured • 100% draft approved before going live
                  </div>
                </div>
              )}

              {/* PAGE 6: FREE PILOT CAMPAIGN */}
              {currentSlide === 5 && (
                <div className="flex-1 flex flex-col justify-between z-10 relative">
                  <div className="space-y-2 text-center max-w-3xl mx-auto my-auto">
                    <div className="h-6 w-fit mx-auto px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black uppercase tracking-widest animate-pulse">
                      ✨ Risk-Free Activation
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">
                      Free Pilot Campaign for <br/>
                      Early Partner Salons
                    </h2>
                    <p className="text-xs text-neutral-300 font-medium leading-relaxed max-w-xl mx-auto">
                      We want to prove we can bring local women into your chairs before you run any paid campaigns. We will manage your very first creator collaboration completely for free.
                    </p>
                  </div>

                  {/* 3 campaign pillars replacing specific creators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left py-2 my-auto">
                    {[
                      {
                        title: '1 Vetted Creator Reel',
                        metric: '85%+ Local Women Focus',
                        reach: 'Hyperlocal targeting within 5km',
                        description: 'We match your salon with a vetted local creator whose followers are verified high-intent local women living or working nearby.',
                        tags: ['Hyperlocal', 'Targeted', 'Local Women'],
                        icon: MapPin,
                        image: "/images/salon/before_after.png"
                      },
                      {
                        title: 'Directed Script & Guide',
                        metric: 'Done-For-You Production',
                        reach: 'High-dopamine beauty close-ups',
                        description: 'We write the creative brief and direct the creator on precise hooks, satisfying ASMR, and visual transformations.',
                        tags: ['Creative Brief', 'Shot Guide', 'ASMR'],
                        icon: Video,
                        image: "/images/salon/nail_extension.png"
                      },
                      {
                        title: 'Zero Risk Escrow Lock',
                        metric: '100% Posting Guarantee',
                        reach: 'Protected booking agreement',
                        description: 'Creators only visit during quiet slots. We secure draft approval before anything goes live, so you never get ghosted.',
                        tags: ['Zero Risk', 'Exclusivity', 'Protected'],
                        icon: Lock,
                        image: "/images/salon/hair_transformation.png"
                      }
                    ].map((item, i) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={i} className="bg-amber-400/[0.02] border border-amber-500/15 rounded-2xl p-4 hover:border-amber-500/20 transition-all flex flex-col justify-between min-h-[200px] relative overflow-hidden group">
                          
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full border border-amber-500/20 overflow-hidden bg-black/40 flex items-center justify-center relative">
                                <img 
                                  src={item.image}
                                  className="w-full h-full object-cover opacity-20 absolute inset-0 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/80 to-transparent z-0" />
                                <IconComponent className="h-4 w-4 text-amber-400 relative z-10 shrink-0" />
                              </div>
                              <div className="text-left relative z-10">
                                <p className="text-xs font-black text-white leading-none uppercase tracking-wide">{item.title}</p>
                                <p className="text-[8.5px] text-amber-400 font-mono mt-1 font-bold">{item.metric}</p>
                              </div>
                            </div>
                          </div>

                          <div className="my-3 text-[9.5px] text-neutral-400 leading-relaxed font-medium relative z-10">
                            {item.description}
                          </div>

                          <div className="bg-black/50 border border-white/5 rounded-xl p-2 mb-3 text-[8px] font-mono text-center relative z-10">
                            <p className="text-[7.5px] text-neutral-400 leading-none">{item.reach}</p>
                          </div>

                          <div className="flex flex-wrap gap-1 relative z-10">
                            {item.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 text-center animate-pulse">
                    ⚠️ Exclusivity Lock: We only onboard 5 salons per city to avoid creator overlap and secure slot exclusivity.
                  </div>
                </div>
              )}

              {/* PAGE 7: ONBOARDING / CONTACT FORM */}
              {currentSlide === 6 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 relative">
                  
                  {/* WhatsApp style floating notifications popup - CLOSES THE SALE */}
                  <div className="lg:col-span-6 space-y-5 text-left h-full flex flex-col justify-between py-2">
                    
                    <div className="space-y-4">
                      <div className="h-5 w-fit px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-black uppercase tracking-wider">
                        Chair Monetization Engine
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                        Let's set up <br/>
                        your first <span className="text-amber-400">barter pilot.</span>
                      </h2>
                      <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                        Get matched with 3 nearby beauty & lifestyle creators today.
                      </p>
                    </div>

                    {/* WhatsApp style iOS floating notifications mockup */}
                    <div className="space-y-2.5 my-auto max-w-sm">
                      {[
                        { time: '10:42 AM', text: '“Hi saw your Reel, hydrafacial price?”', delay: '0s' },
                        { time: '11:15 AM', text: '“Do you have appointments tomorrow?”', delay: '0.2s' },
                        { time: '12:04 PM', text: '“Can I book nail extensions?”', delay: '0.4s' }
                      ].map((inq, iIdx) => (
                        <div 
                          key={iIdx} 
                          className="bg-black/90 border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 relative shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:border-amber-500/30 transition-all border-l-4 border-l-[#25D366] animate-pulse"
                          style={{ animationDelay: inq.delay }}
                        >
                          <div className="h-6 w-6 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-3.5 w-3.5 text-[#25D366] fill-[#25D366]/20" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9.5px] text-neutral-200 font-bold font-sans">Booking inquiry</p>
                            <p className="text-[8.5px] text-neutral-400 font-sans leading-none mt-0.5 truncate">{inq.text}</p>
                          </div>
                          <span className="text-[7px] font-mono text-neutral-500 shrink-0">{inq.time}</span>
                        </div>
                      ))}
                    </div>

                    {/* WhatsApp CTA Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleWhatsAppClick}
                        className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,211,102,0.25)] hover:shadow-[0_4px_25px_rgba(37,211,102,0.4)] flex items-center justify-center gap-3 border border-emerald-400/20 active:scale-[0.98]"
                      >
                        <MessageSquare className="h-5 w-5 text-black fill-black" />
                        <span>WhatsApp Us To Start Free Pilot</span>
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
                          <p className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
                            ⚡ Exclusivity Lock: Secure your city slot before your competitor does
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
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Unused-Chair Monetization Infrastructure</span>
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
