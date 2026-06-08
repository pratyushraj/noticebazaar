import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { FAQSchema } from '@/components/seo/SchemaMarkup';
import { toast } from 'sonner';
import {
  Sparkles,
  Star,
  Shield,
  Calendar,
  Clock,
  Phone,
  MapPin,
  Check,
  ChevronDown,
  Award,
  Users,
  Heart,
  ArrowRight,
  UserCheck,
  X,
  Stethoscope,
  Smile,
  Activity,
  Baby,
  Target,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Play,
  HelpCircle,
  Video,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface Service {
  name: string;
  duration: string;
  price: string;
  description: string;
  icon: string;
}

const SERVICES: Service[] = [
  {
    name: "Premium Dental Implants",
    duration: "90 mins",
    price: "Starting from ₹35,000",
    description: "Permanent, natural-looking tooth replacements utilizing top-tier titanium implants.",
    icon: "implants"
  },
  {
    name: "Porcelain Veneers & Smile Makeovers",
    duration: "120 mins",
    price: "Starting from ₹12,000/tooth",
    description: "Porcelain and composite veneers for full arch cosmetic smile transformations.",
    icon: "whitening"
  },
  {
    name: "Clear Aligners Consultation",
    duration: "30 mins",
    price: "FREE (Worth ₹1,500)",
    description: "Consultation and digital scan planning for invisible teeth straightening braces.",
    icon: "aligners"
  },
  {
    name: "Painless Root Canal",
    duration: "90 mins",
    price: "Starting from ₹6,000",
    description: "Save damaged teeth with computerized micro-dentistry under local anesthesia.",
    icon: "rootcanal"
  },
  {
    name: "Laser Teeth Whitening",
    duration: "60 mins",
    price: "Starting from ₹3,500",
    description: "Brighten your smile up to 8 shades in a single session with our painless laser technology.",
    icon: "cleaning"
  },
  {
    name: "Teeth Cleaning & Polish",
    duration: "45 mins",
    price: "Starting from ₹800",
    description: "Deep scaling to remove plaque and calculus, finished with professional stains polishing.",
    icon: "pediatric"
  }
];

const renderServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'implants':
      return <Shield className="h-5 w-5 text-[#5b72ff]" />;
    case 'whitening':
      return <Smile className="h-5 w-5 text-[#5b72ff]" />;
    case 'aligners':
      return <Target className="h-5 w-5 text-[#5b72ff]" />;
    case 'rootcanal':
      return <Stethoscope className="h-5 w-5 text-[#5b72ff]" />;
    case 'cleaning':
      return <Sparkles className="h-5 w-5 text-[#5b72ff]" />;
    case 'pediatric':
      return <Activity className="h-5 w-5 text-[#5b72ff]" />;
    default:
      return <Sparkles className="h-5 w-5 text-[#5b72ff]" />;
  }
};

const BEFORE_AFTER_IMAGES = [
  {
    title: "Teeth Gap Closure",
    before: "/assets/yourdentist/gap_before.png",
    after: "/assets/yourdentist/gap_after.png",
    desc: "Composite veneers to close the diastema in a single session."
  },
  {
    title: "Premium Smile Makeover",
    before: "/assets/yourdentist/gap_before.png",
    after: "/assets/yourdentist/veneer_case_1.png",
    desc: "Porcelain veneers for full arch cosmetic smile designing."
  },
  {
    title: "Smile Reconstruction",
    before: "/assets/yourdentist/gap_before.png",
    after: "/assets/yourdentist/makeover_case.png",
    desc: "Full cosmetic rehabilitation combining implants and veneers."
  }
];

const DENTISTS = [
  { name: "Dr. Clara Collins", role: "Prosthodontist", img: "/assets/yourdentist/clara_collins.png" },
  { name: "Dr. Mason Carter", role: "Implant Specialist", img: "/assets/yourdentist/mason_carter.png" }
];

const REVIEWS = [
  {
    name: "Dr. Smita Prasad",
    treatment: "Painless Dental Implant",
    rating: 5,
    text: "As a doctor myself, I was highly critical of safety and precision. The computerized implant surgery was painless, and the new tooth looks and feels totally natural.",
    date: "2 weeks ago"
  },
  {
    name: "Rahul Sharma",
    treatment: "Laser Teeth Whitening",
    rating: 5,
    text: "The whitening treatment was absolutely amazing! I got 6 shades lighter in less than an hour. Painless and very professional staff.",
    date: "1 month ago"
  },
  {
    name: "Arjun Kapoor",
    treatment: "Painless Root Canal",
    rating: 5,
    text: "I went in with severe toothache and got a root canal. Micro-dentistry anesthesia was so effective I didn't feel a single needle or drilling sound.",
    date: "3 months ago"
  }
];

const FAQS = [
  {
    question: "Is dental implant treatment painful?",
    answer: "No. Implants are performed under local computerized anesthesia, meaning you won't feel anything during the process. Post-treatment discomfort is minimal and easily managed with prescribed pain relievers."
  },
  {
    question: "Do you offer EMI payments for expensive treatments?",
    answer: "Yes! We offer 0% EMI financing options through Bajaj Finance and other banking partners for dental treatments above ₹5,000, making implants and straightening affordable."
  },
  {
    question: "How long does teeth whitening last?",
    answer: "Typically, professional laser whitening results last between 1 to 2 years, depending on your lifestyle and diet (coffee, tea, smoking etc). We also provide touch-up packages to preserve brightness."
  },
  {
    question: "Do you accept health insurance policies?",
    answer: "Yes, we accept major health insurance plans covering dental procedures, including Star Health, Niva Bupa, and ICICI Lombard. Please consult our front desk before booking."
  }
];

const PATIENT_CASES = [
  {
    title: "Diastema Gap Closure",
    treatment: "Porcelain Veneers",
    timeline: "2 Visits · 3 Weeks",
    patientName: "Anjali S. (Patna)",
    testimonial: "I couldn't smile confidently for years. Dr. Aryan completed my veneers in just 2 sessions. Completely painless and life-changing.",
    video: "/assets/yourdentist/posto_reel_insta_optimized.mp4",
    thumbnail: "/assets/yourdentist/gap_after.png",
    keyword: "SMILE DESIGN"
  },
  {
    title: "Full Arch Rehabilitation",
    treatment: "Premium Titanium Implants",
    timeline: "3 Visits · 6 Weeks",
    patientName: "Dr. Smita Prasad (Patna)",
    testimonial: "As a doctor myself, I was highly critical of safety. The computerized implant surgery was painless, and the new teeth feel completely natural.",
    video: "/assets/yourdentist/posto_reel_insta_optimized.mp4",
    thumbnail: "/assets/yourdentist/patient_happy_2.png",
    keyword: "DENTAL IMPLANTS"
  },
  {
    title: "Invisible Alignment Journey",
    treatment: "Clear Aligners",
    timeline: "Bi-weekly shifts · 6 Months",
    patientName: "Rishav Raj (Patna)",
    testimonial: "Invisible aligners were super comfortable. The 3D digital planning showed me my future smile before starting.",
    video: "/assets/yourdentist/simba_reel_optimized.mp4",
    thumbnail: "/assets/yourdentist/patient_happy_4.jpg",
    keyword: "ALIGNERS"
  }
];

export default function DentistWebsite() {
  const [selectedService, setSelectedService] = useState<string>(SERVICES[0].name);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeDentistIndex, setActiveDentistIndex] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>('');
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Before/after compare slider position (0-100)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Video modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // AI Assistant Widget States
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user', text: string }>>([
    { sender: 'ai', text: "👋 Hi\nI'm Your Dentist Assistant.\nHow can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat([], options);
      setTimeString(formatter.format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !patientName || !patientPhone) {
      toast.error("Please fill in all details.");
      return;
    }
    setBookingConfirmed(true);
    toast.success("Free Smile Assessment Slot Reserved!");
  };

  const handleResetBooking = () => {
    setBookingConfirmed(false);
    setSelectedDate("");
    setSelectedTime("");
    setPatientName("");
    setPatientPhone("");
  };

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const triggerChatOption = (option: string, responseText: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: option }]);
    setIsTyping(true);

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: responseText }]);
      setIsTyping(false);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sora antialiased overflow-x-hidden selection:bg-neutral-900 selection:text-white">
      <SEOHead
        title="YOUR DENTIST | Dr. Aryan Parmar Patna — Painless Dentistry"
        description="Premium dental clinic in Patna. Painless implants, laser whitening, root canals, and invisible aligners under Dr. Aryan Parmar."
        image="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200"
        imageAlt="YOUR DENTIST Patna Clinic"
        canonicalUrl="https://creatorarmour.com/dentist-website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Dentist",
          "name": "YOUR DENTIST - Dr. Aryan Parmar",
          "image": "https://creatorarmour.com/assets/yourdentist/exterior_day.jpg",
          "@id": "https://creatorarmour.com/dentist-website#clinic",
          "url": "https://creatorarmour.com/dentist-website",
          "telephone": "+919876543210",
          "priceRange": "INR",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "H/No 12, Pataliputra Colony",
            "addressLocality": "Patna",
            "addressRegion": "Bihar",
            "postalCode": "800013",
            "addressCountry": "IN"
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "opens": "10:00",
            "closes": "20:00"
          }
        }}
      />

      <FAQSchema faqs={FAQS} />

      {/* Ticker Banner */}
      <div className="bg-neutral-950 text-white text-center py-2.5 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 relative z-50 border-b border-white/5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span>LIMITED OFFERS: ✓ Free Smile assessment · ✓ 0% EMI financing · ✓ laser whitening discounts</span>
        <a href="#booking" className="underline hover:text-neutral-300 ml-2 font-black transition-colors">Secure Free Slot &rarr;</a>
      </div>

      {/* Floating Glassmorphic Navbar capsule */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-full max-w-5xl px-6 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-neutral-950/90 backdrop-blur-xl border border-white/10 px-6 sm:px-8 py-3.5 rounded-full flex items-center justify-between text-white shadow-2xl">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/yourdentist/logo_cropped.png"
              alt="YOUR DENTIST Logo"
              className="w-6 h-6 object-contain"
            />
            <div>
              <span className="text-[10px] font-black tracking-widest text-white uppercase block leading-none">YOUR DENTIST</span>
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest block mt-0.5">DR. ARYAN PARMAR</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[9px] font-black uppercase tracking-widest text-white/70">
            <a href="#transformations" className="hover:text-white transition-colors">Smile Transformations</a>
            <a href="#cases" className="hover:text-white transition-colors">Patient Cases</a>
            <a href="#services" className="hover:text-white transition-colors">Treatments</a>
            <a href="#dr-aryan" className="hover:text-white transition-colors">Dr. Aryan</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </div>

          <a
            href="#booking"
            className="px-5 py-2.5 bg-white text-black hover:bg-neutral-100 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
          >
            Book Slot
          </a>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="bg-neutral-950 pt-8 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Glowy ambient backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#5b72ff]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Giant Outlined Watermark behind Hero */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[16vw] font-black text-white/[0.015] border-text select-none pointer-events-none tracking-widest uppercase text-center font-sans z-0">
          SMILE MAKEOVER
        </div>

        <div className="max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-neutral-900/40 border border-white/5 text-white p-6 sm:p-10 relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col justify-between min-h-[640px] z-10">
          {/* Card Navbar */}
          <div className="flex justify-between items-center w-full mb-12 relative z-20">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/yourdentist/logo_cropped.png"
                alt="YOUR DENTIST Logo"
                className="w-7 h-7 object-contain"
              />
              <div>
                <span className="text-sm font-black tracking-widest text-white uppercase block leading-none">YOUR DENTIST</span>
                <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest block mt-0.5">DR. ARYAN PARMAR</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-white/70">
              <a href="#transformations" className="hover:text-white transition-colors flex items-center gap-1.5"><span className="text-white/20 font-black leading-none">•</span> Transformations</a>
              <a href="#cases" className="hover:text-white transition-colors flex items-center gap-1.5"><span className="text-white/20 font-black leading-none">•</span> Cases</a>
              <a href="#services" className="hover:text-white transition-colors flex items-center gap-1.5"><span className="text-white/20 font-black leading-none">•</span> Treatments</a>
              <a href="#dr-aryan" className="hover:text-white transition-colors flex items-center gap-1.5"><span className="text-white/20 font-black leading-none">•</span> Doctor</a>
            </div>

            <a
              href="#booking"
              className="px-5 py-2.5 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Book Free Slot
            </a>
          </div>

          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow py-4 relative z-10">
            {/* Left Column: Heading and Tagline */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left flex flex-col justify-center h-full">
              <div className="inline-flex items-center justify-center lg:justify-start gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full w-fit mx-auto lg:mx-0">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider">Premium Patna Dental Clinic</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.95] text-white">
                Modern Care <br />
                <span className="text-neutral-500 font-editorial italic normal-case block font-light mt-1">for a perfect smile</span>
              </h1>
              
              <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-sm mx-auto lg:mx-0">
                Painless digital workflows, top-tier titanium implants, and custom porcelain design from Patna's premier restorative studio.
              </p>

              {/* Star rating for trust */}
              <div className="flex items-center justify-center lg:justify-start gap-2.5 pt-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-transparent" />
                  ))}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">5.0 / 5.0 Google Rating</span>
              </div>
            </div>

            {/* Center Column: 3D Dental Implant Image */}
            <div className="lg:col-span-4 flex justify-center relative min-h-[300px] lg:min-h-[400px] items-center">
              <div className="absolute w-[220px] h-[220px] bg-[#5b72ff]/10 rounded-full blur-[70px] opacity-40 mix-blend-screen pointer-events-none animate-pulse" />
              <img
                src="/assets/yourdentist/dental_implant_hero.png"
                alt="3D Dental Implant render"
                className="w-[240px] sm:w-[280px] h-auto object-contain relative z-10 drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Right Column: Specialist Partner Carousel */}
            <div className="lg:col-span-3 flex flex-col justify-center items-center lg:items-end gap-6 h-full text-center lg:text-right">
              {/* Specialist mini carousel */}
              <div className="w-full max-w-xs space-y-3 relative z-20">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Restorative Specialists</span>
                  <button 
                    onClick={() => setActiveDentistIndex((prev) => (prev + 1) % DENTISTS.length)}
                    className="text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1 text-[#5b72ff] transition-all"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="relative overflow-hidden h-[150px] w-full rounded-2xl border border-white/5 bg-neutral-900/50 backdrop-blur-md p-3.5 flex gap-4 items-center shadow-lg hover:border-white/10 transition-all text-left">
                  <div className="w-[85px] h-[115px] rounded-xl overflow-hidden shrink-0 bg-neutral-950 border border-white/5">
                    <img 
                      src={DENTISTS[activeDentistIndex].img} 
                      alt={DENTISTS[activeDentistIndex].name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#5b72ff]">{DENTISTS[activeDentistIndex].role}</span>
                    <h4 className="text-sm font-black uppercase text-white mt-1 leading-tight">{DENTISTS[activeDentistIndex].name}</h4>
                    <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Patna Clinical Team</p>
                    <a 
                      href="#booking" 
                      className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-black bg-white hover:bg-neutral-100 px-3 py-1.5 rounded-lg mt-3.5 transition-all w-fit shadow-md"
                    >
                      Book Free Slot &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer row */}
          <div className="border-t border-white/5 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center w-full gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 relative z-20">
            <span>PAINLESS TECHNOLOGY LEADER</span>
            <span className="font-mono text-[#5b72ff] tracking-widest">{`Patna, India — ${timeString || '22:00:00'} IST`}</span>
            <span>HYGIENE STANDARD CERTIFIED</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: SOCIAL PROOF BAR */}
      <section className="bg-white border-y border-neutral-100 py-8 px-6 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">★★★★★</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">163 Verified Google Reviews</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">5,000+</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">Patient Transformations</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">4.9 / 5.0</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">Patient Satisfaction Rating</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-lg font-black text-neutral-900 uppercase tracking-tight leading-none mt-1">PATLIPUTRA COLONY</span>
            <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Patna, Bihar 800013</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: SMILE TRANSFORMATIONS (Before/After Slider) */}
      <section id="transformations" className="py-28 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          SMILE DESIGN
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Transformations</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Before & After <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Interactive Smile Gallery</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Drag the interactive comparison slider horizontally to reveal the details of actual transformations performed by Dr. Aryan's restorative team.
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Interactive Split Compare Slider */}
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden border border-neutral-100 shadow-2xl select-none bg-neutral-900">
              {/* BEFORE Image (Underlay) */}
              <img
                src={BEFORE_AFTER_IMAGES[activeGalleryIndex].before}
                alt="Before Treatment"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 z-20 bg-neutral-950 text-white px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest">
                Before Smile
              </div>

              {/* AFTER Image (Overlay with clipping) */}
              <div
                className="absolute inset-y-0 left-0 right-0 z-10 pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img
                  src={BEFORE_AFTER_IMAGES[activeGalleryIndex].after}
                  alt="After Treatment"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 z-20 bg-white border border-neutral-200 text-neutral-950 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
                  After Transformation
                </div>
              </div>

              {/* Separator Line */}
              <div
                className="absolute inset-y-0 w-0.5 bg-white z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-white text-neutral-900 shadow-2xl flex items-center justify-center border border-neutral-200 pointer-events-auto">
                  <span className="text-[10px] font-black">↔</span>
                </div>
              </div>

              {/* Drag Controller Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>

            <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-4">
              ← Drag slider to inspect procedure micro-details →
            </p>

            {/* Case Info and inline Navigation controls */}
            <div className="w-full mt-8 flex justify-between items-center bg-neutral-50 border border-neutral-100 p-5 rounded-2xl shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-black uppercase text-[#5b72ff] tracking-widest">
                  Transformation case {activeGalleryIndex + 1} of {BEFORE_AFTER_IMAGES.length}
                </span>
                <h4 className="text-sm font-black uppercase text-neutral-900">
                  {BEFORE_AFTER_IMAGES[activeGalleryIndex].title}
                </h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  {BEFORE_AFTER_IMAGES[activeGalleryIndex].desc}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveGalleryIndex((prev) => (prev - 1 + BEFORE_AFTER_IMAGES.length) % BEFORE_AFTER_IMAGES.length);
                    setSliderPosition(50);
                  }}
                  className="w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 flex items-center justify-center border border-neutral-200 transition-colors shadow-sm active:scale-90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveGalleryIndex((prev) => (prev + 1) % BEFORE_AFTER_IMAGES.length);
                    setSliderPosition(50);
                  }}
                  className="w-9 h-9 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 flex items-center justify-center border border-neutral-200 transition-colors shadow-sm active:scale-90"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: REAL PATIENT CASES (Transformation Cards with Reels) */}
      <section id="cases" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-y border-neutral-100">
        {/* Watermark */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          PAINLESS DENTISTRY
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Real Cases</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Clinical Success Cases <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Transformations & Patient Reviews</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Real patients, real timelines, and real video journals demonstrating their complete recovery roadmaps under Dr. Aryan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PATIENT_CASES.map((item, idx) => (
              <div key={idx} className="bg-white border border-neutral-200/60 rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl transition-all duration-300 relative group">
                <div className="space-y-4">
                  {/* Media Banner with Video Trigger */}
                  <div 
                    onClick={() => setActiveVideoUrl(item.video)}
                    className="relative aspect-video w-full overflow-hidden bg-neutral-950 cursor-pointer"
                  >
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-4.5 w-4.5 fill-black text-black ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-neutral-950/80 border border-white/10 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                      🎬 Watch Testimonial Reel
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <span className="text-[8px] bg-neutral-100 text-[#5b72ff] border border-neutral-200 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                      {item.treatment}
                    </span>
                    <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight leading-snug mt-1">
                      {item.title}
                    </h3>
                    
                    {/* Case Metadata */}
                    <div className="grid grid-cols-2 gap-2 bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider">
                      <div className="space-y-0.5">
                        <span className="block text-[8px] text-neutral-400 font-bold uppercase">Visits</span>
                        <span className="text-neutral-800">{item.timeline.split('·')[0].trim()}</span>
                      </div>
                      <div className="space-y-0.5 border-l border-neutral-200 pl-3">
                        <span className="block text-[8px] text-neutral-400 font-bold uppercase">Duration</span>
                        <span className="text-neutral-800">{item.timeline.split('·')[1].trim()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 font-medium leading-relaxed italic pt-2">
                      "{item.testimonial}"
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-neutral-50 mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  <span>Patient: {item.patientName}</span>
                  <span className="text-emerald-500">✓ Verified Case</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: SERVICES (Treatments Grid) */}
      <section id="services" className="py-28 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          DENTAL IMPLANTS
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Premium Treatments</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Specialized Restorations <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Advanced Oral Surgery & Aesthetics</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              We practice computerized, painless workflows combining standard protocols with modern lasers and high-ticket titanium implants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedService(service.name);
                  const el = document.getElementById('booking');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white border border-neutral-200 hover:border-neutral-900 p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg"
              >
                <div className="space-y-5 text-left">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center transition-all group-hover:bg-[#5b72ff]/5">
                    {renderServiceIcon(service.icon)}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight">{service.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[8px] text-neutral-900 font-mono font-black uppercase bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                        {service.duration}
                      </span>
                      <span className="text-[8px] text-[#5b72ff] font-mono font-black uppercase bg-[#5b72ff]/5 border border-[#5b72ff]/10 px-2 py-0.5 rounded">
                        {service.price}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    {service.description}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-neutral-50 mt-6 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[#5b72ff] group-hover:underline">
                  <span>Select & Book Assessment</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: DR. ARYAN (Credentials & Bio) */}
      <section id="dr-aryan" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-y border-neutral-100">
        {/* Watermark */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          ALIGNERS
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Doctor Profile Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-sm aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group bg-white p-3">
              <div className="relative w-full h-full rounded-[24px] overflow-hidden">
                <img
                  src="/assets/yourdentist/doctor_profile.png"
                  alt="Dr. Aryan Parmar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 bg-neutral-950/95 border border-white/5 p-4 sm:p-5 rounded-2xl shadow-2xl text-white">
                <h4 className="text-sm font-black uppercase tracking-wider">Dr. Aryan Parmar</h4>
                <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Lead Surgeon & Restorative Director</p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5 text-[9px] text-[#5b72ff] font-black uppercase tracking-widest font-mono">
                  <span>BDS, MDS</span>
                  <span>•</span>
                  <span>15+ Years Exp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio Details */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-4">
              <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Clinical Leadership</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
                Dr. Aryan Parmar <br />
                <span className="font-editorial italic normal-case font-light text-neutral-500">Restorative surgery with precision</span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Dr. Aryan Parmar is Patna's leading implant surgeon and aesthetic dentistry pioneer. Under his supervision, the clinic integrates 3D digital scanners and computerized anesthesia to perform painless, single-session smile reconstructions.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl text-center shadow-sm">
                <span className="block text-lg font-black text-neutral-900 font-mono tracking-tight">BDS, MDS</span>
                <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Certified Surgeon</span>
              </div>
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl text-center shadow-sm">
                <span className="block text-lg font-black text-neutral-900 font-mono tracking-tight">15+ Yrs</span>
                <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Clinical Experience</span>
              </div>
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl text-center shadow-sm">
                <span className="block text-lg font-black text-neutral-900 font-mono tracking-tight">163+</span>
                <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Google Reviews</span>
              </div>
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl text-center shadow-sm">
                <span className="block text-lg font-black text-neutral-900 font-mono tracking-tight">5,000+</span>
                <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Smiles Restored</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                "Certified Restorative Implantologist (MDS)",
                "Painless Computerized Micro-Anesthesia",
                "Laser-Assisted Sterile Operatory Setup",
                "Advanced Digital 3D Scanner Modeling",
                "Member of restorative dental boards",
                "0% EMI financing on implants & aligners"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-[#5b72ff]/5 border border-[#5b72ff]/10 flex items-center justify-center text-[8px] text-[#5b72ff] font-bold shrink-0">
                    ✓
                  </div>
                  <span className="text-xs text-neutral-600 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CONSULTATION BOOKING (Overlapping Split Form) */}
      <section id="booking" className="py-32 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          SMILE MAKEOVER
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch relative z-10">
          {/* Left Column: Form Details & Badges */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 text-left">
            <div className="space-y-4">
              <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Real-time scheduling</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
                Get Your Smile Assessment <br />
                <span className="font-editorial italic normal-case font-light text-neutral-500">Consultation with Dr. Aryan</span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Choose a service, date, and preferred time slot. Your consultation details will be instantly reserved for Dr. Aryan's restorative team in Patna.
              </p>
            </div>

            {/* Diagnostic checkups features */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              {[
                { title: "Google Calendar Integration", desc: "Instantly synchronized with Dr. Aryan's clinical calendar." },
                { title: "Free Diagnostic assessment", desc: "Includes high-res scanner review (worth ₹1,500)." },
                { title: "Instant SMS Confirmation", desc: "Confirmation details will be dispatched immediately." }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#5b72ff]/5 border border-[#5b72ff]/10 flex items-center justify-center text-[10px] text-[#5b72ff] font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-neutral-900 tracking-tight">{badge.title}</h4>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5 leading-normal">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Phone badge */}
            <div className="bg-neutral-50 border border-neutral-100 p-4.5 rounded-2xl flex items-center gap-3.5">
              <Phone className="h-5 w-5 text-neutral-900 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Clinic Helpline</p>
                <p className="text-xs font-black text-neutral-900 mt-0.5">+91 98765 43210</p>
              </div>
            </div>
          </div>

          {/* Right Column: Overlapping Form Panel */}
          <div className="lg:col-span-7 relative">
            {/* Mednix Overlapping Effect */}
            <div className="bg-neutral-950 text-white p-6 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden h-full flex flex-col justify-center border border-white/5 lg:-mt-12 lg:-mb-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#5b72ff]/5 rounded-full blur-[80px] pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {!bookingConfirmed ? (
                  <motion.form
                    key="form"
                    onSubmit={handleBookingSubmit}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-5"
                  >
                    <div className="border-b border-white/5 pb-4">
                      <h3 className="text-base font-black uppercase tracking-widest text-white">
                        Book Smile Assessment
                      </h3>
                      <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Painless restotative solutions Patna</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Full Name</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#5b72ff] transition-colors"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#5b72ff] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Service Selector */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Restoration Interest</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#5b72ff] font-semibold transition-colors appearance-none"
                      >
                        {SERVICES.map((s, idx) => (
                          <option key={idx} value={s.name} className="bg-neutral-900 text-white">{s.name} ({s.price.split(' ')[0]}...)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Choose Date</label>
                        <input
                          type="date"
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#5b72ff] transition-colors"
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[8px] uppercase font-black tracking-widest text-neutral-400">Select Time</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["11:00 AM", "02:00 PM", "05:00 PM"].map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={`py-2 rounded-lg text-[9px] font-black tracking-wider border transition-all ${
                                selectedTime === t
                                  ? 'bg-[#5b72ff] text-white border-[#5b72ff] shadow-md shadow-[#5b72ff]/20'
                                  : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Offer Badges */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 text-[10px] space-y-2 mt-2 text-left">
                      <p className="font-black text-[#5b72ff] uppercase text-[8px] tracking-widest">Included Free Checkup:</p>
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-bold text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>3D Digital Scan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>Health Report</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>Dr. Aryan review</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-white text-black hover:bg-neutral-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]"
                      >
                        Confirm Smile Assessment Slot
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6 py-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#5b72ff] text-white flex items-center justify-center mx-auto text-2xl shadow-xl shadow-[#5b72ff]/20">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-widest text-white">Assessment Slot Reserved!</h3>
                      <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                        Hi <span className="text-white font-bold">{patientName}</span>, your Smile Assessment is successfully reserved on <span className="text-white font-bold">{selectedDate}</span> at <span className="text-white font-bold">{selectedTime}</span>.
                      </p>
                    </div>

                    <div className="bg-neutral-900 border border-white/5 p-4.5 rounded-2xl max-w-sm mx-auto text-left space-y-2 text-xs">
                      <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest">Summary details</p>
                      <p className="text-neutral-300">🩺 Service: {selectedService}</p>
                      <p className="text-neutral-300">👨‍⚕️ Dentist: Dr. Aryan Parmar</p>
                      <p className="text-neutral-300">📞 Phone: {patientPhone}</p>
                    </div>

                    <div className="flex gap-3 max-w-xs mx-auto pt-4">
                      <button
                        onClick={handleResetBooking}
                        className="flex-1 py-3 bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Book Another
                      </button>
                      <a
                        href="#transformations"
                        className="flex-1 py-3 bg-white text-black hover:bg-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                      >
                        Smile Gallery
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: REVIEWS (Google Reviews Grid) */}
      <section id="reviews" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-t border-neutral-100">
        {/* Watermark */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-900/[0.015] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          SMILE DESIGN
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Google Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Patient Satisfaction <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Verified Google Testimonials</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Read verified feedback from patients who completed restorative and cosmetic procedures under Dr. Aryan's care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((review, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-neutral-200/60 p-6 sm:p-8 rounded-3xl space-y-5 transition-all duration-300 shadow-sm hover:shadow-md text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-transparent" />
                      ))}
                    </div>
                    <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded">
                      Google Review
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                    "{review.text}"
                  </p>
                </div>
                
                <div className="border-t border-neutral-50 pt-4 mt-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-neutral-900 tracking-tight">{review.name}</h4>
                    <p className="text-[8px] text-[#5b72ff] font-black uppercase tracking-widest mt-0.5">{review.treatment}</p>
                  </div>
                  <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FAQs */}
      <section id="faqs" className="py-28 px-6 bg-white relative overflow-hidden border-t border-neutral-100">
        <div className="max-w-4xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Frequently Asked Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Clinical Inquiries <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Implant, Aligner & Price details</span>
            </h2>
          </div>

          <div className="space-y-4 text-left">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-neutral-50 border border-neutral-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-neutral-100/50"
                >
                  <span className="text-xs sm:text-sm font-black uppercase text-neutral-900 tracking-wide">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden bg-white border-t border-neutral-100"
                    >
                      <div className="px-6 py-5 text-xs sm:text-sm text-neutral-500 leading-relaxed font-medium">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-400 border-t border-white/5 pt-16 pb-12 px-6 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/5 pb-12">
          {/* Logo & Info */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/yourdentist/logo_cropped.png"
                alt="YOUR DENTIST Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="text-sm font-black tracking-widest text-white uppercase">YOUR DENTIST</span>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed font-bold uppercase tracking-wider">
              Dr. Aryan Parmar Patna Clinic. <br />
              Computerized, painless restorative solutions.
            </p>
          </div>

          {/* Timings */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-black uppercase text-white tracking-widest">Clinic Timings</h4>
            <div className="space-y-1.5 text-xs font-bold uppercase tracking-wide">
              <p>Monday - Saturday: 10:00 AM - 08:00 PM</p>
              <p className="text-amber-500">Sunday: Closed (Emergencies Only)</p>
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-black uppercase text-white tracking-widest">Location address</h4>
            <div className="space-y-1 text-xs font-medium leading-relaxed">
              <p className="font-black text-white uppercase tracking-wider">Patliputra Restorative Studio:</p>
              <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">H/No 12, Pataliputra Colony, Patna, Bihar 800013</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-neutral-500 font-black uppercase tracking-widest font-mono">
          <span>© 2026 YOUR DENTIST Patna. Managed by Creator Armour.</span>
          <span>Restorative Dental Marketing Bihar</span>
        </div>
      </footer>

      {/* Video Testimonial Modal Overlay */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
            onClick={() => setActiveVideoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative aspect-[9/16] w-full max-w-[330px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="absolute top-4 right-4 z-[110] w-8 h-8 rounded-full bg-black/85 text-white flex items-center justify-center hover:bg-black border border-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <video
                src={activeVideoUrl}
                autoPlay
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION ITEMS (WhatsApp Capsule & AI Receptionist) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Floating WhatsApp Action Capsule (P's high ROI CRO widget) */}
        <a
          href="https://wa.me/919876543210?text=Hi%20Dr.%20Aryan,%20I'd%20like%20to%20reserve%20a%20free%20smile%20assessment."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full flex items-center gap-2.5 shadow-2xl transition-transform hover:scale-105 active:scale-95 border border-emerald-500/20 text-xs font-black uppercase tracking-wider"
          title="Book on WhatsApp"
        >
          <span className="text-lg leading-none">💬</span>
          <span>Book on WhatsApp</span>
        </a>

        {/* AI Dentist Assistant Widget */}
        <div className="relative flex flex-col items-end">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white border border-neutral-200 w-[300px] sm:w-[340px] rounded-3xl shadow-2xl overflow-hidden mb-3 flex flex-col"
              >
                {/* Chat Header */}
                <div className="bg-neutral-950 text-white p-4 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest">YOUR DENTIST AI</h4>
                      <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Patna Clinic Assistant</p>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Chat Message Scroll */}
                <div className="p-4 h-[220px] overflow-y-auto space-y-3 bg-neutral-50/50 flex flex-col whitespace-pre-wrap text-left">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-neutral-950 text-white self-end rounded-tr-none shadow-sm'
                          : 'bg-white border border-neutral-100 text-neutral-800 self-start rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-white border border-neutral-100 text-neutral-400 self-start rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs animate-pulse">
                      Assistant is typing...
                    </div>
                  )}
                </div>

                {/* Quick Option Menu */}
                <div className="p-4 border-t border-neutral-200 bg-white space-y-2">
                  <p className="text-[8px] font-black uppercase text-neutral-400 tracking-widest mb-2 text-left">Select inquiry topic:</p>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    <button
                      onClick={() => triggerChatOption("Book Appointment", "Great! To book a Free Smile Assessment, please scroll down to our reservation form, or WhatsApp us directly at +91 98765 43210. 📅")}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-[9px] font-black uppercase tracking-wider rounded-lg border border-neutral-200 transition-colors"
                    >
                      📅 Booking
                    </button>
                    <button
                      onClick={() => triggerChatOption("Implants Price", "Dr. Aryan specializes in premium implants starting at ₹35,000 using top titanium brands. We offer 0% EMI diagnostics. Book a free consultation slot above! 🔩")}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-[9px] font-black uppercase tracking-wider rounded-lg border border-neutral-200 transition-colors"
                    >
                      🔩 Implants
                    </button>
                    <button
                      onClick={() => triggerChatOption("Clear Aligners", "Clear Invisible Aligners consultation is 100% Free! We do complete 3D scanner mapping on day 1 to plan your alignment journey. 🎯")}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-[9px] font-black uppercase tracking-wider rounded-lg border border-neutral-200 transition-colors"
                    >
                      🎯 Aligners
                    </button>
                    <button
                      onClick={() => triggerChatOption("Talk to Team", "Our team is available immediately! Click the WhatsApp bubble directly above this assistant to start chatting live with our front desk. 📞")}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-[9px] font-black uppercase tracking-wider rounded-lg border border-neutral-200 transition-colors"
                    >
                      📞 Live Chat
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assistant Trigger Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-neutral-950 hover:bg-neutral-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 border border-white/5"
            title="Chat Assistant"
          >
            {chatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
