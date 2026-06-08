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
  img: string;
}

const SERVICES: Service[] = [
  {
    name: "Premium Dental Implants",
    duration: "90 mins",
    price: "Starting from ₹24,999",
    description: "Permanent, natural-looking tooth replacements utilizing top-tier titanium implants.",
    icon: "implants",
    img: "/assets/yourdentist/interior_operatory.jpg"
  },
  {
    name: "Porcelain Veneers & Smile Makeovers",
    duration: "120 mins",
    price: "Starting from ₹12,000/tooth",
    description: "Porcelain and composite veneers for full arch cosmetic smile transformations.",
    icon: "whitening",
    img: "/assets/yourdentist/veneer_case_1.png"
  },
  {
    name: "Clear Aligners",
    duration: "30 mins",
    price: "Starting from ₹45,000",
    description: "Invisible teeth straightening braces with complete digital 3D planning.",
    icon: "aligners",
    img: "/assets/yourdentist/dr_with_patient_1.jpg"
  },
  {
    name: "Painless Root Canal",
    duration: "90 mins",
    price: "Starting from ₹5,999",
    description: "Save damaged teeth with computerized micro-dentistry under local anesthesia.",
    icon: "rootcanal",
    img: "/assets/yourdentist/clinic_in_action.jpg"
  },
  {
    name: "Laser Teeth Whitening",
    duration: "60 mins",
    price: "Starting from ₹4,999",
    description: "Brighten your smile up to 8 shades in a single session with our painless laser technology.",
    icon: "cleaning",
    img: "/assets/yourdentist/patient_happy_1.jpg"
  },
  {
    name: "Teeth Cleaning & Polish",
    duration: "45 mins",
    price: "Starting from ₹999",
    description: "Deep scaling to remove plaque and calculus, finished with professional stains polishing.",
    icon: "pediatric",
    img: "/assets/yourdentist/patient_happy_3.png"
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
      return <Award className="h-5 w-5 text-[#5b72ff]" />;
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
    before: "/assets/yourdentist/gap_case_2.png",
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

const CLINIC_PHOTOS = [
  { id: "operatory", name: "Operatory Studio", desc: "Sterile surgical operatory with digital alignment systems.", img: "/assets/yourdentist/interior_operatory.jpg" },
  { id: "consult", name: "Clinical Consult", desc: "Dr. Aryan performing diagnostic digital scanner screening with a patient.", img: "/assets/yourdentist/dr_with_patient_1.jpg" },
  { id: "treatment", name: "Clinical Action", desc: "Dr. Aryan operating under computerized micro-dentistry systems.", img: "/assets/yourdentist/clinic_in_action.jpg" },
  { id: "lobby", name: "Executive Lobby", desc: "Patient lounge and custom wall branding reception.", img: "/assets/yourdentist/wall_brand.png" },
  { id: "exterior_day", name: "Day Exterior", desc: "Centrally located premium clinic facade in Patliputra Colony.", img: "/assets/yourdentist/exterior_day.jpg" },
  { id: "exterior_night", name: "Night Exterior", desc: "Lighted facade for convenient after-hours consultation.", img: "/assets/yourdentist/exterior_night.jpg" }
];

const DENTISTS = [
  { name: "Dr. Clara Collins", role: "Prosthodontist", img: "/assets/yourdentist/clara_collins.png" },
  { name: "Dr. Mason Carter", role: "Implant Specialist", img: "/assets/yourdentist/mason_carter.png" }
];

const REVIEWS = [
  {
    name: "Dr. Smita Prasad",
    treatment: "Premium Dental Implant",
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
    metrics: [
      { label: "Visits", value: "2 Visits" },
      { label: "Duration", value: "3 Weeks" },
      { label: "Result", value: "100% Closed" }
    ],
    patientName: "Anjali S. (Patna)",
    testimonial: "I couldn't smile confidently for years. Dr. Aryan completed my veneers in just 2 sessions. Completely painless and life-changing.",
    video: "/assets/yourdentist/posto_reel_insta_optimized.mp4",
    thumbnail: "/assets/yourdentist/patient_happy_1.jpg"
  },
  {
    title: "Dental Implant Rehabilitation",
    treatment: "Premium Titanium Implants",
    metrics: [
      { label: "Procedure", value: "1 Day" },
      { label: "Function", value: "100% Functional" },
      { label: "Comfort", value: "99%" }
    ],
    patientName: "Dr. Smita Prasad (Patna)",
    testimonial: "As a doctor myself, I was highly critical of safety. The computerized implant surgery was painless, and the new teeth feel completely natural.",
    video: "/assets/yourdentist/posto_reel_insta_optimized.mp4",
    thumbnail: "/assets/yourdentist/patient_happy_2.png"
  },
  {
    title: "Complete Smile Makeover",
    treatment: "Porcelain Veneers",
    metrics: [
      { label: "Veneers", value: "8 Veneers" },
      { label: "Duration", value: "14 Days" },
      { label: "Satisfaction", value: "10/10" }
    ],
    patientName: "Rishav Raj (Patna)",
    testimonial: "Clear veneers changed my life. Dr. Aryan explained everything so well. Gaps closed and teeth whitened in exactly 14 days as predicted.",
    video: "/assets/yourdentist/simba_reel_optimized.mp4",
    thumbnail: "/assets/yourdentist/patient_happy_4.jpg"
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

  // Active studio photo for interactive gallery
  const [activeStudioPhoto, setActiveStudioPhoto] = useState(CLINIC_PHOTOS[0]);

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

  // Clinic Studio Gallery Auto-playing fast slideshow (2.5s interval)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStudioPhoto((prevPhoto) => {
        const currentIndex = CLINIC_PHOTOS.findIndex((p) => p.id === prevPhoto.id);
        const nextIndex = (currentIndex + 1) % CLINIC_PHOTOS.length;
        return CLINIC_PHOTOS[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
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
    <div className="min-h-screen bg-white text-neutral-900 font-sora antialiased overflow-x-hidden selection:bg-neutral-900 selection:text-white pb-[60px] md:pb-0">
      <SEOHead
        title="YOUR DENTIST | Dr. Aryan Parmar Patna — Painless Dentistry"
        description="Premium dental clinic in Patna. Painless implants, laser whitening, root canals, and invisible aligners under Dr. Aryan Parmar."
        image="/assets/yourdentist/exterior_day.jpg"
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
            <a href="#transformations" className="hover:text-white transition-colors">Transformations</a>
            <a href="#cases" className="hover:text-white transition-colors">Success Cases</a>
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
      <section className="bg-white pt-8 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Glowy ambient backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#5b72ff]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Giant Outlined Watermark behind Hero */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[16vw] font-black text-neutral-950/[0.035] border-text select-none pointer-events-none tracking-widest uppercase text-center font-sans z-0">
          SMILE MAKEOVER
        </div>

        <div className="max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-neutral-50/70 backdrop-blur-md border border-neutral-200/80 text-neutral-900 p-6 sm:p-10 relative shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[640px] z-10">
          {/* Card Navbar */}
          <div className="flex justify-between items-center w-full mb-12 relative z-20">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/yourdentist/logo_cropped.png"
                alt="YOUR DENTIST Logo"
                className="w-7 h-7 object-contain"
              />
              <div>
                <span className="text-sm font-black tracking-widest text-neutral-900 uppercase block leading-none">YOUR DENTIST</span>
                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block mt-0.5">DR. ARYAN PARMAR</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-neutral-600">
              <a href="#transformations" className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"><span className="text-neutral-300 font-black leading-none">•</span> Transformations</a>
              <a href="#cases" className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"><span className="text-neutral-300 font-black leading-none">•</span> Cases</a>
              <a href="#services" className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"><span className="text-neutral-300 font-black leading-none">•</span> Treatments</a>
              <a href="#dr-aryan" className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"><span className="text-neutral-300 font-black leading-none">•</span> Doctor</a>
            </div>

            <a
              href="#booking"
              className="px-5 py-2.5 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100 text-neutral-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Book Free Slot
            </a>
          </div>

          {/* Hero Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow py-4 relative z-10">
            {/* Left Column: Heading and Tagline */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col justify-center h-full">
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black uppercase tracking-tight leading-[0.95] text-neutral-900">
                Smile With <br />
                <span className="text-neutral-500 font-editorial italic normal-case block font-light mt-1">Confidence Again</span>
              </h1>

              {/* Trust stats directly below the headline */}
              <div className="flex flex-wrap items-center gap-3 py-2 bg-neutral-100/50 border-y border-neutral-200/80 my-2 justify-center lg:justify-start w-fit mx-auto lg:mx-0 text-[10px] font-black uppercase tracking-wider text-neutral-700 px-4 rounded-lg">
                <span className="text-amber-500 font-mono tracking-normal text-xs leading-none">★★★★★</span>
                <span className="text-neutral-900 font-bold">4.9 Google Rating</span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-600">163+ Reviews</span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-600">5,000+ Patients Treated</span>
              </div>

              {/* Doctor badge for quick clinical authority */}
              <div className="flex items-center gap-3 bg-white border border-neutral-200/80 rounded-2xl p-2.5 w-fit mx-auto lg:mx-0 shadow-sm">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                  <img
                    src="/assets/yourdentist/doctor_profile.png"
                    alt="Dr. Aryan Parmar avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left leading-tight">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-900 leading-none">Dr. Aryan Parmar</h4>
                  <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1 leading-none">Implants • Aligners • Veneers</p>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-[#5b72ff] font-black uppercase tracking-widest">
                Premium Dental Implants, Aligners & Smile Makeovers in Patna
              </p>

              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
                Skip the generic dental clinic experience. Dr. Aryan Parmar offers state-of-the-art computerized procedures, pain-free anesthesia, and natural-looking cosmetic veneer transformations tailored for your facial structure.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <a
                  href="#booking"
                  className="px-6 py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg text-center animate-pulse"
                >
                  Book Appointment
                </a>
                <a
                  href="https://wa.me/919876543210?text=Hi%20Dr.%20Aryan,%20I'd%20like%20to%20reserve%20a%20free%20smile%20assessment."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-md"
                >
                  💬 WhatsApp Us
                </a>
              </div>
            </div>

            {/* Right Column: Real Clinic Consultation (Authenticity Focused) */}
            <div className="lg:col-span-6 flex justify-center relative min-h-[300px] lg:min-h-[400px] items-center">
              <div className="absolute w-[280px] h-[280px] bg-[#5b72ff]/10 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none" />
              
              {/* Premium Clinical Consultation Frame */}
              <div className="relative z-10 w-full max-w-md rounded-[32px] overflow-hidden border border-neutral-200/80 bg-white p-3 shadow-2xl">
                <div className="aspect-[4/3] w-full rounded-[24px] overflow-hidden bg-neutral-50 border border-neutral-100 relative">
                  <img
                    src="/assets/yourdentist/dr_with_patient_1.jpg"
                    alt="Dr. Aryan Parmar in Consultation"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-emerald-400">
                    ✓ Direct Diagnostic Consultation
                  </div>
                  <div className="absolute bottom-4 right-4 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-neutral-200">
                    Patliputra Colony, Patna
                  </div>
                </div>
                <div className="p-4 text-left space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-neutral-800 tracking-wider">Clinical Standards in Action</h4>
                  <p className="text-[9px] text-neutral-500 font-medium">Dr. Aryan Parmar consulting a patient using digital 3D scans</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer row */}
          <div className="border-t border-neutral-200/80 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center w-full gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-500 relative z-20">
            <span>PAINLESS TECHNOLOGY LEADER</span>
            <span className="font-mono text-[#5b72ff] tracking-widest">{`Patna, India — ${timeString || '22:00:00'} IST`}</span>
            <span>HYGIENE STANDARD CERTIFIED</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: GOOGLE REVIEWS + STATS BAR (CRO Priority 3) */}
      <section className="bg-white border-y border-neutral-100 py-8 px-6 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">★★★★★</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">163+ Five-Star Google Reviews</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">250+</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">Smile Transformations Completed</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-2xl font-black text-neutral-900 font-mono tracking-tight">1,000+</span>
            <span className="block text-[9px] text-neutral-400 font-black uppercase tracking-widest">Dental Procedures Completed</span>
          </div>
          <div className="space-y-1 py-2 md:py-0">
            <span className="block text-lg font-black text-neutral-900 uppercase tracking-tight leading-none mt-1">PATLIPUTRA COLONY</span>
            <span className="block text-[8px] text-neutral-400 font-black uppercase tracking-widest mt-1">Patna, Bihar 800013</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: BEFORE / AFTER TRANSFORMATIONS (CRO Priority 3) */}
      <section id="transformations" className="py-28 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
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

      {/* SECTION 4: CLINICAL SUCCESS CASES (CRO Priority 3 & 5) */}
      <section id="cases" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-y border-neutral-100">
        {/* Watermark */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          IMPLANTS
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Real Cases</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Clinical Success Cases <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Actual Patient Outcomes & Metrics</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Transparent cases proving our clinical speed, safety, and outcomes. Click video to play actual recovery diaries.
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
                    
                    {/* Case Metadata - Premium Clinic Metrics (CRO Priority 5) */}
                    <div className="grid grid-cols-3 gap-2 bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase tracking-wider text-center">
                      {item.metrics.map((m, mIdx) => (
                        <div key={mIdx} className="space-y-0.5">
                          <span className="block text-[7px] text-neutral-400 font-bold uppercase">{m.label}</span>
                          <span className="text-neutral-800 font-mono font-black">{m.value}</span>
                        </div>
                      ))}
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

      {/* SECTION: INSTAGRAM SOCIAL PROOF (CRO Priority 6) */}
      <section className="py-28 px-6 bg-white border-t border-neutral-100 relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          TRANSFORMATIONS
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Social Connection</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Follow Our <span className="font-editorial italic normal-case font-light text-neutral-500">Smile Transformations</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              We document real patient smiles daily. See behind-the-scenes clinic standards, raw transformation timelines, and doctor tips on Instagram.
            </p>
          </div>

          {/* Instagram Stats Profile Card */}
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-[32px] p-6 sm:p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-sm">
            <div className="md:col-span-4 space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 shrink-0 shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                    <img
                      src="/assets/yourdentist/logo_cropped.png"
                      alt="Your Dentist Instagram Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="text-left leading-tight">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">@yourdentist_patna</h4>
                  <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Dr. Aryan Parmar Clinic</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full border-t border-neutral-200/60 pt-4">
                <div className="text-center md:text-left">
                  <span className="block text-sm font-black text-neutral-900 font-mono leading-none">420+</span>
                  <span className="block text-[7px] text-neutral-400 font-black uppercase tracking-widest mt-1">Posts</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-sm font-black text-neutral-900 font-mono leading-none">12.4K</span>
                  <span className="block text-[7px] text-neutral-400 font-black uppercase tracking-widest mt-1">Followers</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-sm font-black text-neutral-900 font-mono leading-none">2.4M</span>
                  <span className="block text-[7px] text-neutral-400 font-black uppercase tracking-widest mt-1">Views</span>
                </div>
              </div>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#5b72ff] hover:bg-[#7a5cff] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center block shadow-md shadow-[#5b72ff]/10"
              >
                Follow Profile
              </a>
            </div>

            {/* Reels Mockup Grid */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { views: "450K+", type: "Clinic Tour", file: "/assets/yourdentist/posto_reel_insta_optimized.mp4", thumbnail: "/assets/yourdentist/clinic_in_action.jpg" },
                { views: "820K+", type: "Patient Consult", file: "/assets/yourdentist/posto_reel_insta_optimized.mp4", thumbnail: "/assets/yourdentist/dr_with_patient_1.jpg" },
                { views: "1.2M+", type: "Aesthetics", file: "/assets/yourdentist/simba_reel_optimized.mp4", thumbnail: "/assets/yourdentist/patient_happy_3.png" }
              ].map((reel, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveVideoUrl(reel.file)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200/80 shadow-md cursor-pointer hover:shadow-lg transition-all duration-300"
                >
                  <img
                    src={reel.thumbnail}
                    alt={`${reel.type} transformation reel`}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors flex flex-col justify-between p-3">
                    <span className="self-end bg-black/60 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-white border border-white/5">
                      ▶ {reel.views}
                    </span>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[#5b72ff]">{reel.type}</span>
                      <span className="block text-[7px] text-neutral-200 font-bold uppercase tracking-wider mt-0.5">View Makeover &rarr;</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SERVICES (Treatments Grid with Cost - CRO Priority 4) */}
      <section id="services" className="py-28 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          ALIGNERS
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
                className="bg-white border border-neutral-200 hover:border-neutral-900 rounded-3xl transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg overflow-hidden"
              >
                {/* Authentic Service/Treatment Image */}
                <div className="aspect-[16/10] w-full bg-neutral-100 border-b border-neutral-200 overflow-hidden relative">
                  <img
                    src={service.img}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm">
                    {renderServiceIcon(service.icon)}
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between">
                  <div className="space-y-4 text-left">
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
                    <span>Select & Book Consultation</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: MEDICAL BOARD TEAM (3 Specialists Grid & Credentials Details) */}
      <section id="dr-aryan" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-y border-neutral-100">
        {/* Watermark */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          PAINLESS DENTISTRY
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Clinical Leadership</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Medical Specialist Board <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">World-class clinical expertise in Patna</span>
            </h2>
          </div>

          {/* 3-Specialist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dr. Aryan Parmar Card */}
            <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group bg-white p-3 flex flex-col justify-between">
              <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-neutral-950">
                <img
                  src="/assets/yourdentist/doctor_profile.png"
                  alt="Dr. Aryan Parmar"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-neutral-950/95 border border-white/5 p-4 rounded-xl shadow-2xl text-white">
                <h4 className="text-xs font-black uppercase tracking-wider">Dr. Aryan Parmar</h4>
                <p className="text-[7px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Lead Surgeon & Restorative Director</p>
                <p className="text-[9px] text-[#5b72ff] font-mono font-black uppercase tracking-widest mt-2">BDS, MDS • 12+ Years Exp</p>
              </div>
            </div>

            {/* Dr. Clara Collins Card */}
            <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group bg-white p-3 flex flex-col justify-between">
              <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-neutral-950">
                <img
                  src="/assets/yourdentist/clara_collins.png"
                  alt="Dr. Clara Collins"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-neutral-950/95 border border-white/5 p-4 rounded-xl shadow-2xl text-white">
                <h4 className="text-xs font-black uppercase tracking-wider">Dr. Clara Collins</h4>
                <p className="text-[7px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Prosthodontist & Veneer Specialist</p>
                <p className="text-[9px] text-[#5b72ff] font-mono font-black uppercase tracking-widest mt-2">BDS, MDS • 8+ Years Exp</p>
              </div>
            </div>

            {/* Dr. Mason Carter Card */}
            <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group bg-white p-3 flex flex-col justify-between">
              <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-neutral-950">
                <img
                  src="/assets/yourdentist/mason_carter.png"
                  alt="Dr. Mason Carter"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-neutral-950/95 border border-white/5 p-4 rounded-xl shadow-2xl text-white">
                <h4 className="text-xs font-black uppercase tracking-wider">Dr. Mason Carter</h4>
                <p className="text-[7px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Implantologist & Oral Surgeon</p>
                <p className="text-[9px] text-[#5b72ff] font-mono font-black uppercase tracking-widest mt-2">BDS, MDS • 10+ Years Exp</p>
              </div>
            </div>
          </div>

          {/* Details Row: Credentials & Specialties vs Purexa post-care partnership */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-16 border-t border-neutral-200/60">
            {/* Left Column: Credentials and Specialties */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-3">
                <h3 className="text-lg font-black uppercase text-neutral-900">Clinical Excellence & Authority</h3>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Our specialist board holds verified MDS/BDS credentials from India's premier dental institutes, executing combined therapy with computerized precision. Dr. Aryan treats patients at two primary locations: Patna and Purnea.
                </p>
              </div>

              {/* Grid of Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Clinical Volume", value: "5,000+ Patients Treated" },
                  { label: "Patient Feedback", value: "163+ Five Star Reviews" },
                  { label: "Active Practice", value: "Patna & Purnea Studios" },
                  { label: "Diagnostic Tech", value: "Modern Digital Dentistry" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-neutral-200/80 p-3.5 rounded-xl shadow-sm">
                    <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <span className="block text-[7px] text-neutral-400 font-bold uppercase tracking-wider leading-none">{item.label}</span>
                      <span className="text-xs font-black uppercase text-neutral-800 tracking-wide mt-1 block">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expertise Chips */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3.5 shadow-sm">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-[#5b72ff]">Specialty Focus Areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Computerized Implants", "Veneer Smile Design", "Clear Aligners", "Painless RCT", "Laser Whitening", "Pediatric Care"].map((spec) => (
                    <span key={spec} className="px-3 py-1.5 bg-[#5b72ff]/5 border border-[#5b72ff]/10 rounded-lg text-[10px] font-black uppercase text-[#5b72ff] tracking-wider">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Purexa Collaboration Card */}
            <div className="lg:col-span-5 bg-white border border-neutral-200/80 rounded-[32px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded">✓ Certified Partnership</span>
                </div>
                <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight leading-snug">
                  Premium Post-Care <br />
                  <span className="font-editorial italic normal-case font-light text-neutral-500">Purexa Oral Hygiene Systems</span>
                </h3>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Every implant, veneers, or whitening treatment includes a custom Purexa clinical recovery kit to accelerate healing and protect enamel.
                </p>
              </div>
              
              {/* Product Image Frame */}
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100 relative mt-4">
                <img
                  src="/assets/yourdentist/purexa_products.png"
                  alt="Purexa Clinical Products partnership"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: RESTORATIVE STUDIO GALLERY (Clinic Environment Slideshow) */}
      <section id="studio-gallery" className="py-28 px-6 bg-white relative overflow-hidden border-b border-neutral-100">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          RESTORE STUDIO
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Physical Proof</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Restorative Studio Gallery <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Explore our premium clinical environment</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Verify our hygiene, clinical tools, and accessibility. Tap the views below to tour our Patliputra Colony facility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Viewport - Featured Photo */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div className="relative rounded-[28px] overflow-hidden border border-neutral-200 bg-neutral-950 shadow-xl aspect-[16/10] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeStudioPhoto.id}
                    src={activeStudioPhoto.img}
                    alt={activeStudioPhoto.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute bottom-6 left-6 right-6 z-20 bg-neutral-950/90 border border-white/5 p-5 rounded-2xl text-white backdrop-blur-sm text-left">
                  <span className="text-[8px] font-black text-[#5b72ff] uppercase tracking-widest">Studio Perspective</span>
                  <h4 className="text-sm font-black uppercase tracking-wider mt-1">{activeStudioPhoto.name}</h4>
                  <p className="text-xs text-neutral-400 font-medium mt-1.5 leading-relaxed">{activeStudioPhoto.desc}</p>
                </div>
              </div>
            </div>

            {/* Right Side - Vertical Selectors */}
            <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
              {CLINIC_PHOTOS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveStudioPhoto(item)}
                  className={`group text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                    activeStudioPhoto.id === item.id
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-lg'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200/60'
                  }`}
                >
                  {/* Small image preview in the button */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300/40">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="leading-tight">
                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${activeStudioPhoto.id === item.id ? 'text-white' : 'text-neutral-900'}`}>{item.name}</h4>
                    <p className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${activeStudioPhoto.id === item.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {item.id === 'lobby' ? 'Reception Lounge' : item.id === 'consult' ? 'Consultation Room' : item.id.includes('exterior') ? 'External Facade' : 'Clinical Area'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CONSULTATION BOOKING (Urgency Form - CRO Priority 7) */}
      <section id="booking" className="py-32 px-6 bg-white relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14vw] font-black text-neutral-950/[0.035] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          CONSULTATION
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
                      {/* Urgency signals (CRO Priority 7) */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#5b72ff]/20 text-[#5b72ff] border border-[#5b72ff]/30 animate-pulse">
                          ⚡ Limited Consultation Slots Available This Week
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ Average Response Time: Under 15 Minutes
                        </span>
                      </div>
                      
                      <h3 className="text-base font-black uppercase tracking-widest text-white mt-1">
                        Book Smile Assessment
                      </h3>
                    </div>

                    {/* Form Trust indicators */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-neutral-900 border border-white/5 rounded-2xl p-4 text-[9px] font-black uppercase tracking-wider text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Consultation with Dr. Aryan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Treatment Plan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Cost Estimate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>No Obligation</span>
                      </div>
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

      {/* SECTION 8: GOOGLE REVIEWS SCREENSHOTS (CRO Priority 10) */}
      <section id="reviews" className="py-28 px-6 bg-[#0c0d12] text-white relative overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14vw] font-black text-white/[0.03] select-none pointer-events-none tracking-widest uppercase font-sans z-0">
          REVIEWS
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Verified Outcomes</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase leading-tight">
              Real Patients, <br />
              <span className="font-editorial italic normal-case font-light text-neutral-400">Real Google Reviews</span>
            </h2>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              We don't display generic testimonial copy. Here are actual screenshots and verified logs of Google reviews left by patients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review Screenshot Mockup 1 */}
            <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-left shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.137 4.2-3.417 0-6.19-2.772-6.19-6.185 0-3.413 2.773-6.185 6.19-6.185 1.54 0 2.946.568 4.027 1.505l3.14-3.14C19.16 2.062 15.936 1 12.24 1 5.86 1 .69 6.17.69 12.5S5.86 24 12.24 24c6.16 0 11.23-4.43 11.23-11.285 0-.76-.07-1.49-.2-2.185H12.24z"
                      />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Google Review</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[7px] font-black uppercase text-emerald-400 font-mono">
                    ✓ Verified Account
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-black uppercase text-[#5b72ff] border border-white/5 font-mono">
                    RS
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Rahul Sharma</h4>
                    <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Patna Local Guide</p>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-transparent" />
                  ))}
                </div>
                <blockquote className="text-xs text-neutral-300 font-medium leading-relaxed italic border-l-2 border-[#5b72ff] pl-3.5">
                  "Pain-free root canal. Highly recommended. I went in with severe toothache and got a root canal. Micro-dentistry anesthesia was so effective I didn't feel a single needle."
                </blockquote>
              </div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-neutral-500 pt-3 border-t border-white/5 mt-4">
                <span>Review ID: 839218</span>
                <span className="text-emerald-500">★★★★★</span>
              </div>
            </div>

            {/* Review Screenshot Mockup 2 */}
            <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-left shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.137 4.2-3.417 0-6.19-2.772-6.19-6.185 0-3.413 2.773-6.185 6.19-6.185 1.54 0 2.946.568 4.027 1.505l3.14-3.14C19.16 2.062 15.936 1 12.24 1 5.86 1 .69 6.17.69 12.5S5.86 24 12.24 24c6.16 0 11.23-4.43 11.23-11.285 0-.76-.07-1.49-.2-2.185H12.24z"
                      />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Google Review</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[7px] font-black uppercase text-emerald-400 font-mono">
                    ✓ Verified Account
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-black uppercase text-[#5b72ff] border border-white/5 font-mono">
                    SP
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Dr. Smita Prasad</h4>
                    <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Medical Officer (Patna)</p>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-transparent" />
                  ))}
                </div>
                <blockquote className="text-xs text-neutral-300 font-medium leading-relaxed italic border-l-2 border-[#5b72ff] pl-3.5">
                  "Best dental implant clinic in Patna. The entire procedure was smooth. Dr. Aryan explained every step. The replacement tooth feels totally natural and strong."
                </blockquote>
              </div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-neutral-500 pt-3 border-t border-white/5 mt-4">
                <span>Review ID: 290183</span>
                <span className="text-emerald-500">★★★★★</span>
              </div>
            </div>

            {/* Review Screenshot Mockup 3 */}
            <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 text-left shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.137 4.2-3.417 0-6.19-2.772-6.19-6.185 0-3.413 2.773-6.185 6.19-6.185 1.54 0 2.946.568 4.027 1.505l3.14-3.14C19.16 2.062 15.936 1 12.24 1 5.86 1 .69 6.17.69 12.5S5.86 24 12.24 24c6.16 0 11.23-4.43 11.23-11.285 0-.76-.07-1.49-.2-2.185H12.24z"
                      />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400">Google Review</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[7px] font-black uppercase text-emerald-400 font-mono">
                    ✓ Verified Account
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-black uppercase text-[#5b72ff] border border-white/5 font-mono">
                    RR
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Rishav Raj</h4>
                    <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Patient (Patna)</p>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-transparent" />
                  ))}
                </div>
                <blockquote className="text-xs text-neutral-300 font-medium leading-relaxed italic border-l-2 border-[#5b72ff] pl-3.5">
                  "Clear aligners changed my life. Dr. Aryan explained everything so well. Gaps closed in 6 months exactly as predicted. Transparent pricing was a huge help."
                </blockquote>
              </div>
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-neutral-500 pt-3 border-t border-white/5 mt-4">
                <span>Review ID: 890124</span>
                <span className="text-emerald-500">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: LOCAL SEO SPECIFIC BLOCK (CRO Priority 9) */}
      <section className="py-24 px-6 bg-white border-t border-neutral-100 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[9px] font-black text-[#5b72ff] uppercase tracking-widest">Local Care Center</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Why Patients Choose Us in <br />
              <span className="font-editorial italic normal-case font-light text-neutral-500">Patliputra Colony & Patna</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Serving premium restorative solutions across Patna's primary neighborhoods with localized diagnostic teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="border border-neutral-200/80 rounded-2xl p-6 space-y-3.5 text-left bg-neutral-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#5b72ff]/5 border border-[#5b72ff]/10 flex items-center justify-center text-xs font-black text-[#5b72ff]">
                01
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">Area Coverage</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Our clinic is centrally located in **Patliputra Colony**, making it easily accessible for families residing in **Boring Road**, **Bailey Road**, and surrounding **Patna** sub-districts.
              </p>
            </div>

            <div className="border border-neutral-200/80 rounded-2xl p-6 space-y-3.5 text-left bg-neutral-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#5b72ff]/5 border border-[#5b72ff]/10 flex items-center justify-center text-xs font-black text-[#5b72ff]">
                02
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">Specialized Treatments</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                We are Patna's authority for **Dental Implants**, **Clear Aligners**, **Root Canal Treatment (RCT)**, **Porcelain Veneers**, and professional **Teeth Whitening** systems.
              </p>
            </div>

            <div className="border border-neutral-200/80 rounded-2xl p-6 space-y-3.5 text-left bg-neutral-50/50 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#5b72ff]/5 border border-[#5b72ff]/10 flex items-center justify-center text-xs font-black text-[#5b72ff]">
                03
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">Clinical Standards</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                Our sterile diagnostics include full computerized alignment plans, ensuring safe oral surgery and cosmetic smile makeovers in Bihar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FAQs */}
      <section id="faqs" className="py-28 px-6 bg-neutral-50 relative overflow-hidden border-t border-neutral-100">
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
                className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-neutral-100/50"
                >
                  <span className="text-xs sm:text-sm font-black uppercase text-neutral-900 tracking-wide">{faq.question}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-neutral-500 transition-transform duration-305 ${activeFaq === idx ? 'rotate-180' : ''}`} />
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

      {/* FLOATING ACTION ITEMS (WhatsApp Sticky Capsule - CRO Priority 8) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Floating WhatsApp Action Capsule (Sticky on Mobile & Desktop) */}
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
                      onClick={() => triggerChatOption("Implants Price", "Dr. Aryan specializes in premium implants starting at ₹24,999 using top titanium brands. We offer 0% EMI diagnostics. Book a free consultation slot above! 🔩")}
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
