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
    name: "Teeth Cleaning & Polish",
    duration: "45 mins",
    price: "Starting from ₹800",
    description: "Deep scaling to remove plaque and calculus, finished with professional stains polishing.",
    icon: "cleaning"
  },
  {
    name: "Laser Teeth Whitening",
    duration: "60 mins",
    price: "Starting from ₹3,500",
    description: "Brighten your smile up to 8 shades in a single session with our painless laser technology.",
    icon: "whitening"
  },
  {
    name: "Premium Dental Implants",
    duration: "90 mins",
    price: "Starting from ₹35,000",
    description: "Permanent, natural-looking tooth replacements utilizing top-tier titanium implants.",
    icon: "implants"
  },
  {
    name: "Painless Root Canal",
    duration: "90 mins",
    price: "Starting from ₹6,000",
    description: "Save damaged teeth with computerized micro-dentistry under local anesthesia.",
    icon: "rootcanal"
  },
  {
    name: "Clear Aligners Consultation",
    duration: "30 mins",
    price: "FREE (Worth ₹1,500)",
    description: "Consultation and digital scan planning for invisible teeth straightening braces.",
    icon: "aligners"
  },
  {
    name: "Child Pediatric Dentistry",
    duration: "45 mins",
    price: "Starting from ₹1,200",
    description: "Gentle dental checkups, sealants, and cavity preventions tailored for young smiles.",
    icon: "pediatric"
  }
];

const renderServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'cleaning':
      return <Activity className="h-6 w-6 text-black" />;
    case 'whitening':
      return <Smile className="h-6 w-6 text-black" />;
    case 'implants':
      return <Shield className="h-6 w-6 text-black" />;
    case 'rootcanal':
      return <Stethoscope className="h-6 w-6 text-black" />;
    case 'aligners':
      return <Target className="h-6 w-6 text-black" />;
    case 'pediatric':
      return <Baby className="h-6 w-6 text-black" />;
    default:
      return <Sparkles className="h-6 w-6 text-black" />;
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

const GALLERY_ITEMS = [
  {
    title: "Modern Operatory Setup",
    category: "setup",
    img: "/assets/yourdentist/interior_operatory.jpg",
    desc: "State-of-the-art dental chairs with computerised micro-dentistry tools."
  },
  {
    title: "Clinic Exterior (Day View)",
    category: "setup",
    img: "/assets/yourdentist/exterior_day.jpg",
    desc: "Prime clinic storefront facade in Pataliputra Colony, Patna."
  },
  {
    title: "Clinic Exterior (Night View)",
    category: "setup",
    img: "/assets/yourdentist/exterior_night.jpg",
    desc: "Well-lit and easily accessible clinic entrance during evening hours."
  },
  {
    title: "Branded Welcome Interior",
    category: "setup",
    img: "/assets/yourdentist/wall_brand.png",
    desc: "Hygiene-first patient lounge and professional consultation zone."
  },
  {
    title: "Purexa Clinical Care Products",
    category: "products",
    img: "/assets/yourdentist/purexa_products.png",
    desc: "Standardized clinical dental care range recommended for all procedures."
  },
  {
    title: "Dr. Aryan Parmar in Treatment",
    category: "setup",
    img: "/assets/yourdentist/clinic_in_action.jpg",
    desc: "Pain-free procedures using advanced micro-dentistry tools."
  },
  {
    title: "Dr. Aryan Parmar with Patient",
    category: "setup",
    img: "/assets/yourdentist/dr_with_patient_1.jpg",
    desc: "Dr. Aryan counseling a patient about their treatment roadmap."
  },
  {
    title: "Dr. Aryan Parmar",
    category: "setup",
    img: "/assets/yourdentist/doctor_profile.png",
    desc: "Lead Dentist & Implantologist at Patliputra Clinic."
  },
  {
    title: "Happy Patient Consultation",
    category: "smiles",
    img: "/assets/yourdentist/patient_happy_1.jpg",
    desc: "Smiling patient after receiving scaling and polishing."
  },
  {
    title: "Post-Treatment Satisfaction",
    category: "smiles",
    img: "/assets/yourdentist/patient_happy_2.png",
    desc: "Patient showing off a radiant smile following scaling and polishing treatment."
  },
  {
    title: "Cosmetic Makeover Joy",
    category: "smiles",
    img: "/assets/yourdentist/patient_happy_3.png",
    desc: "Proudly showing results of full arch cosmetic restoration."
  },
  {
    title: "Successful Aligners Transformation",
    category: "smiles",
    img: "/assets/yourdentist/patient_happy_4.jpg",
    desc: "Post-procedure smile restoration reveal."
  },
  {
    title: "Pediatric Care Smile",
    category: "smiles",
    img: "/assets/yourdentist/kid_patient.png",
    desc: "A happy child patient displaying their healthy, cavity-free teeth."
  },
  {
    title: "Orthodontic Gap Correction",
    category: "smiles",
    img: "/assets/yourdentist/gap_case_2.png",
    desc: "Perfect alignment and gap closure achieved with modern cosmetic contouring."
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
  const [activeGalleryTab, setActiveGalleryTab] = useState<string>('all');
  const [activeTourIndex, setActiveTourIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [isHoveringTour, setIsHoveringTour] = useState<boolean>(false);

  // Video testimonial modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Before/after compare slider position (0-100)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // AI Assistant Widget States
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user', text: string }>>([
    { sender: 'ai', text: "👋 Hi\nI'm Your Dentist Assistant.\nHow can I help?" }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    setActiveGalleryTab(tabId);
    setActiveTourIndex(0);
  };

  useEffect(() => {
    if (isHoveringTour) return;

    const filteredGallery = GALLERY_ITEMS.filter(item => activeGalleryTab === 'all' || item.category === activeGalleryTab);
    if (filteredGallery.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveTourIndex((prev) => (prev + 1) % filteredGallery.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeGalleryTab, isHoveringTour]);

  // Premium Framer Motion presets
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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

  const renderWhyUsIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <ShieldCheck className="h-5 w-5 text-white" />;
      case 1:
        return <Activity className="h-5 w-5 text-white" />;
      case 2:
        return <Stethoscope className="h-5 w-5 text-white" />;
      case 3:
        return <Clock className="h-5 w-5 text-white" />;
      case 4:
        return <Percent className="h-5 w-5 text-white" />;
      default:
        return <Check className="h-5 w-5 text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-neutral-900 selection:text-white">
      <SEOHead
        title="YOUR DENTIST | Dr. Aryan Parmar Patna — Painless Dentistry"
        description="Premium dental clinic in Patna. Painless implants, laser whitening, root canals, and pediatric dentistry under Dr. Aryan Parmar."
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

      <FAQSchema
        faqs={[
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
        ]}
      />

      {/* Ticker Banner (Missing Urgency Component) */}
      <div className="bg-black text-white text-center py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative z-50">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span>This Month: ✓ Free Smile Assessment · ✓ Aligner Consultation · ✓ Implant Eligibility Check</span>
        <a href="#booking" className="underline hover:text-neutral-300 ml-2">Secure Free Slot &rarr;</a>
      </div>

      {/* Modern Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/yourdentist/logo_cropped.png"
              alt="YOUR DENTIST Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="text-base font-black tracking-wide text-neutral-900 block">YOUR DENTIST</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Dr. Aryan Parmar</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <a href="#services" className="hover:text-black transition-colors">Services</a>
            <a href="#gallery" className="hover:text-black transition-colors">Smile Gallery</a>
            <a href="#timeline" className="hover:text-black transition-colors">Roadmap</a>
            <a href="#tour" className="hover:text-black transition-colors">Clinic Tour</a>
            <a href="#booking" className="hover:text-black transition-colors">Free Assessment</a>
            <a href="#reviews" className="hover:text-black transition-colors">Reviews</a>
            <a href="#about" className="hover:text-black transition-colors">Clinic</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/919876543210?text=Hi,%20I%20want%20to%20book%20a%20free%20smile%20assessment."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200 text-xs font-black uppercase tracking-wider rounded-xl text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              📲 WhatsApp Now
            </a>
            <a
              href="#booking"
              className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-neutral-950/10 active:scale-[0.98]"
            >
              Free Smile Assessment
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 overflow-hidden bg-neutral-50/50">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-neutral-100 rounded-full blur-[100px] pointer-events-none opacity-60" />

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10"
        >
          {/* Left Text content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Google Reviews Moved to Hero for Social Proof */}
            <motion.div 
              variants={fadeInUp}
              className="inline-flex flex-wrap justify-center lg:justify-start items-center gap-2 bg-white border border-neutral-200/80 px-4 py-2 rounded-2xl shadow-sm text-xs font-bold"
            >
              <div className="flex text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
              </div>
              <span className="text-neutral-950 font-black">5.0 Rating</span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-600">Trusted by 163+ Patients in Patna</span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-neutral-900 leading-tight"
            >
              Painless Dentistry. <br className="hidden sm:inline" />
              <span className="text-neutral-500">Perfect Smiles.</span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-lg text-neutral-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Experience state-of-the-art dental care with computerized micro-dentistry under Dr. Aryan Parmar. From digital smile makeovers to single-visit pain-free implants.
            </motion.p>

            {/* Quick Stats Grid */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-3 gap-6 pt-4 max-w-md mx-auto lg:mx-0 text-center lg:text-left"
            >
              <div className="group cursor-pointer">
                <p className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 group-hover:scale-105 transition-transform origin-left duration-300">1000+</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Smiles Treated</p>
              </div>
              <div className="border-x border-neutral-200 px-2 group cursor-pointer">
                <p className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 group-hover:scale-105 transition-transform duration-300">15+</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Years Experience</p>
              </div>
              <div className="group cursor-pointer">
                <p className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 group-hover:scale-105 transition-transform origin-right duration-300">163+</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Google Reviews</p>
              </div>
            </motion.div>

            {/* CTA Panel with WhatsApp Action Option */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-6"
            >
              <a
                href="#booking"
                className="w-full sm:w-auto px-8 py-4 bg-black text-white hover:bg-neutral-800 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-md shadow-neutral-950/10"
              >
                Free Smile Assessment <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://wa.me/919876543210?text=Hi,%20I%20want%20to%20book%20a%20free%20smile%20assessment."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10"
              >
                📲 WhatsApp Now
              </a>
            </motion.div>
          </div>

          {/* Right Image/Banner Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <motion.div 
              animate={{
                y: [0, -8, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent z-10" />
              <img
                src="/assets/yourdentist/dr_with_patient_1.jpg"
                alt="Dr. Aryan Parmar with Patient"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-white/95 border border-neutral-200/80 p-5 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-neutral-800">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-neutral-900">Patliputra Clinic</h4>
                    <p className="text-[10px] text-neutral-500 font-bold mt-1">H/No 12, Pataliputra Colony, Patna</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Why Patients Choose Us Section */}
      <section className="py-24 px-6 bg-white border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Patna's Preferred Choice</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Why Patients Choose Dr. Aryan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Pain-Free Dentistry", desc: "Computerized micro-anesthesia with no needles." },
              { title: "Digital Scanning", desc: "No messy molds — instant high-resolution 3D records." },
              { title: "Modern Equipment", desc: "State-of-the-art operatory & laser diagnostics." },
              { title: "Same Day Consultation", desc: "Zero waiting lists for dental emergencies." },
              { title: "Transparent Pricing", desc: "Clear upfront quotes with no hidden costs." }
            ].map((item, idx) => (
              <div key={idx} className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl space-y-3 shadow-sm hover:border-black transition-colors duration-300 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                    {renderWhyUsIcon(idx)}
                  </div>
                  <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wide mt-2">{item.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-24 px-6 bg-neutral-50 border-b border-neutral-200/50">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Premium Treatments</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Specialized Oral Care</h2>
            <p className="text-sm text-neutral-600">
              We practice pain-free dentistry combining standard protocols with modern laser, digital smile modeling, and premium medical implants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -6, borderColor: 'rgba(0, 0, 0, 0.8)', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)' }}
                className="bg-white border border-neutral-200 p-6 rounded-2xl transition-all flex flex-col justify-between group cursor-pointer duration-300"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center transition-all group-hover:bg-neutral-950/5">
                    {renderServiceIcon(service.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase text-neutral-900 tracking-wide">{service.name}</h3>
                    <p className="text-xs text-neutral-900 font-mono font-black uppercase mt-1.5 bg-neutral-100 inline-block px-2 py-0.5 rounded border border-neutral-200">
                      {service.duration} · {service.price}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#booking"
                    onClick={() => setSelectedService(service.name)}
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black hover:text-neutral-700 transition-colors"
                  >
                    Select Treatment & Book Assessment →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Interactive Before & After Smile Gallery (WOW feature) */}
      <section id="gallery" className="py-24 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Transformations</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Before & After Smile Gallery</h2>
            <p className="text-sm text-neutral-600">
              Drag the interactive comparison slider horizontally to see the incredible transformation in real-time.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto flex flex-col items-center">
            {/* Interactive Split Compare Slider */}
            <motion.div variants={fadeInUp} className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-neutral-200 shadow-2xl select-none">
                {/* BEFORE Image (Underlay) */}
                <img
                  src={BEFORE_AFTER_IMAGES[activeGalleryIndex].before}
                  alt="Before Treatment"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 z-20 bg-neutral-900/95 text-white px-3 py-1.5 rounded-lg border border-neutral-800 text-[9px] font-black uppercase tracking-wider">
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
                  <div className="absolute top-4 right-4 z-20 bg-white border border-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    After Transform
                  </div>
                </div>

                {/* Separator Line */}
                <div
                  className="absolute inset-y-0 w-1 bg-black z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-black border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-[10px] text-white font-black">↔</span>
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

              {/* Slider Controller Help */}
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-4">
                ← Drag to compare transformation details →
              </p>
            </motion.div>

            {/* Case Info and inline Navigation controls */}
            <motion.div 
              variants={fadeInUp}
              className="w-full mt-6 flex justify-between items-center bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm"
            >
              <div className="space-y-0.5">
                <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                  Transformation Case {activeGalleryIndex + 1} of {BEFORE_AFTER_IMAGES.length}
                </span>
                <h4 className="text-sm font-black uppercase text-neutral-900">
                  {BEFORE_AFTER_IMAGES[activeGalleryIndex].title}
                </h4>
                <p className="text-xs text-neutral-500 font-medium">
                  {BEFORE_AFTER_IMAGES[activeGalleryIndex].desc}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveGalleryIndex((prev) => (prev - 1 + BEFORE_AFTER_IMAGES.length) % BEFORE_AFTER_IMAGES.length);
                    setSliderPosition(50);
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center border border-neutral-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-neutral-700" />
                </button>
                <button
                  onClick={() => {
                    setActiveGalleryIndex((prev) => (prev + 1) % BEFORE_AFTER_IMAGES.length);
                    setSliderPosition(50);
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center border border-neutral-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-neutral-700" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Smile Transformation Timeline Section */}
      <section id="timeline" className="py-24 px-6 bg-neutral-50 border-y border-neutral-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Your Smile Roadmap</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Smile Transformation Timeline</h2>
            <p className="text-sm text-neutral-600">
              A seamless, planned roadmap custom-designed for aligners, veneer makeovers, and premium implants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Desktop timeline horizontal connector line */}
            <div className="hidden md:block absolute top-[52px] left-[10%] right-[10%] h-0.5 bg-neutral-200 z-0" />

            {[
              { step: "01", title: "Consultation", desc: "Free initial assessment and comprehensive 3D digital records mapping." },
              { step: "02", title: "Treatment Plan", desc: "Interactive presentation of procedure phases & transparent price packages." },
              { step: "03", title: "Procedure", desc: "Painless computerized clinical session matching standard workflows." },
              { step: "04", title: "Follow-Up", desc: "Precision alignment check, post-op fit support, and checkups." },
              { step: "05", title: "Smile Transform", desc: "Your final fully restored, healthy, and beautiful smile is ready." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-neutral-200 rounded-3xl p-6 relative z-10 shadow-sm space-y-4 hover:border-black transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-400">Phase</span>
                  <span className="text-xs font-black bg-black text-white px-2.5 py-0.5 rounded-lg font-mono">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-neutral-900">{item.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed font-medium mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Tour & Brand Showcase */}
      <section id="tour" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Clinic Tour</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Brand Showcase & Patient Smiles</h2>
            <p className="text-sm text-neutral-600">
              Get an inside look at our modern operatory setups, premium dental products, and real patient smiles at YOUR DENTIST Patna.
            </p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {[
                { id: 'all', label: 'All Photos' },
                { id: 'setup', label: 'Clinic Setup' },
                { id: 'smiles', label: 'Happy Patients' },
                { id: 'products', label: 'Products' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    activeGalleryTab === tab.id
                      ? 'bg-black text-white border-black shadow-md shadow-neutral-950/10'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slideshow Component */}
          {(() => {
            const filteredGallery = GALLERY_ITEMS.filter(item => activeGalleryTab === 'all' || item.category === activeGalleryTab);
            const currentTourItem = filteredGallery[activeTourIndex] || filteredGallery[0];

            const handleNextTourItem = () => {
              setDirection(1);
              setActiveTourIndex((prev) => (prev + 1) % filteredGallery.length);
            };

            const handlePrevTourItem = () => {
              setDirection(-1);
              setActiveTourIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
            };

            const slideVariants = {
              enter: (dir: number) => ({
                x: dir > 0 ? 80 : -80,
                opacity: 0
              }),
              center: {
                x: 0,
                opacity: 1,
                transition: { duration: 0.35, ease: 'easeOut' }
              },
              exit: (dir: number) => ({
                x: dir < 0 ? 80 : -80,
                opacity: 0,
                transition: { duration: 0.25, ease: 'easeIn' }
              })
            };

            if (filteredGallery.length === 0) return null;

            return (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Main Showcase Image Container */}
                <div 
                  onMouseEnter={() => setIsHoveringTour(true)}
                  onMouseLeave={() => setIsHoveringTour(false)}
                  className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xl group"
                >
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.img
                      key={currentTourItem.img}
                      src={currentTourItem.img}
                      alt={currentTourItem.title}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                    <button
                      onClick={handlePrevTourItem}
                      className="w-12 h-12 rounded-full bg-white/95 hover:bg-white text-neutral-800 flex items-center justify-center shadow-lg border border-neutral-200 pointer-events-auto transition-transform hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextTourItem}
                      className="w-12 h-12 rounded-full bg-white/95 hover:bg-white text-neutral-800 flex items-center justify-center shadow-lg border border-neutral-200 pointer-events-auto transition-transform hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Category tag inside image */}
                  <div className="absolute top-4 left-4 z-20 bg-neutral-900/90 text-white border border-neutral-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {currentTourItem.category === 'setup' ? 'Setup & Tech' : currentTourItem.category === 'smiles' ? 'Patient Smile' : 'Clinical Product'}
                  </div>
                </div>

                {/* Slide Metadata & Indicators */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase text-neutral-900">{currentTourItem.title}</h4>
                    <p className="text-xs text-neutral-500 font-medium">{currentTourItem.desc}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {filteredGallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDirection(i > activeTourIndex ? 1 : -1);
                          setActiveTourIndex(i);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeTourIndex === i ? 'w-5 bg-black' : 'w-2 bg-neutral-200 hover:bg-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Slideshow Thumbnails row */}
                <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
                  {filteredGallery.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDirection(idx > activeTourIndex ? 1 : -1);
                        setActiveTourIndex(idx);
                      }}
                      className={`relative aspect-square w-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        activeTourIndex === idx ? 'border-black scale-[0.98]' : 'border-neutral-200 hover:border-neutral-400 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Patient Stories Section (Embedded Video reels layout) */}
      <section className="py-24 px-6 bg-neutral-50 border-t border-neutral-200/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Video Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Patient Stories</h2>
            <p className="text-sm text-neutral-600">
              Watch real dental transformations and listen to stories from our Patna patients. Click to play video.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Dr. Smita Prasad", type: "Painless Implant", img: "/assets/yourdentist/patient_happy_2.png", video: "/assets/yourdentist/posto_reel_insta_optimized.mp4" },
              { name: "Rishav Raj", type: "Cosmetic Restoration", img: "/assets/yourdentist/patient_happy_3.png", video: "/assets/yourdentist/simba_reel_optimized.mp4" },
              { name: "Aman Sen", type: "Clear Aligners", img: "/assets/yourdentist/patient_happy_4.jpg", video: "/assets/yourdentist/simba_reel_optimized.mp4" },
              { name: "Kajal Kumari", type: "Pediatric Cleaning", img: "/assets/yourdentist/kid_patient.png", video: "/assets/yourdentist/posto_reel_insta_optimized.mp4" }
            ].map((story, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveVideoUrl(story.video)}
                className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-neutral-200/80 bg-neutral-100 shadow-lg cursor-pointer"
              >
                <img src={story.img} alt={story.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-5">
                  <span className="self-start text-[8px] bg-neutral-900/80 text-white border border-neutral-700 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                    🎬 Watch Reel
                  </span>
                  
                  {/* Play Button Overlay */}
                  <div className="self-center w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-black" />
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black uppercase text-white">{story.name}</h4>
                    <p className="text-[10px] text-neutral-300 font-bold">{story.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Booking Module */}
      <section id="booking" className="py-24 px-6 bg-white border-y border-neutral-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Booking Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Real-time scheduling</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
                Request a Free Smile Assessment & Consultation
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                Choose a service, date, and preferred time slot below. Your confirmation details will be instantly generated for Dr. Aryan's clinical team.
              </p>
            </div>

            {/* Core Badges */}
            <div className="space-y-3.5 pt-4">
              {[
                { title: "Google Calendar Sync", desc: "Auto-synced with Dr. Aryan's active schedule." },
                { title: "Free Diagnostic Checkup", desc: "Includes comprehensive scan and diagnostic breakdown." },
                { title: "Instant Notification", desc: "Get confirmation via SMS or WhatsApp." }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] text-black font-bold shrink-0 mt-0.5 border border-neutral-200">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-neutral-900">{badge.title}</h4>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-4.5 rounded-2xl flex items-center gap-3">
              <Phone className="h-5 w-5 text-neutral-900" />
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase">Emergency Helpline</p>
                <p className="text-xs font-black text-neutral-900 mt-0.5">+91 98765 43210</p>
              </div>
            </div>
          </div>

          {/* Booking Panel Form */}
          <div className="lg:col-span-7">
            <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!bookingConfirmed ? (
                  <motion.form
                    key="form"
                    onSubmit={handleBookingSubmit}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-black uppercase text-neutral-900 border-b border-neutral-200 pb-3">
                      Select Assessment Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-neutral-500">Full Name</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none text-neutral-900 focus:border-black"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-neutral-500">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none text-neutral-900 focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Service Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-neutral-500">Treatment interest</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none text-neutral-900 focus:border-black font-semibold"
                      >
                        {SERVICES.map((s, idx) => (
                          <option key={idx} value={s.name}>{s.name} ({s.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-neutral-500">Choose Date</label>
                        <input
                          type="date"
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs outline-none text-neutral-900 focus:border-black"
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-neutral-500">Select Time</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["11:00 AM", "02:00 PM", "05:00 PM"].map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className={`py-2 rounded-lg text-[10px] font-black border transition-all ${
                                selectedTime === t
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-900'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* FREE Smile Assessment Checklists */}
                    <div className="bg-neutral-100/60 rounded-2xl p-4 border border-neutral-200 text-xs space-y-2 mt-2">
                      <p className="font-black text-neutral-900 uppercase text-[9px] tracking-wider">Your Free Assessment Includes:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-bold text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>3D Digital Scan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Dental Health Report</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Dr. Aryan consultation</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit CTAs */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                      >
                        Confirm Free Smile Assessment Slot
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
                    <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto text-2xl shadow-lg">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase text-neutral-900">Assessment Slot Reserved!</h3>
                      <p className="text-sm text-neutral-600 max-w-sm mx-auto">
                        Hi <span className="text-neutral-900 font-bold">{patientName}</span>, your Smile Assessment is successfully reserved on <span className="text-neutral-900 font-bold">{selectedDate}</span> at <span className="text-neutral-900 font-bold">{selectedTime}</span>.
                      </p>
                    </div>

                    <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl max-w-sm mx-auto text-left space-y-2 shadow-sm">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Summary</p>
                      <p className="text-xs text-neutral-700 font-semibold">🩺 Service: {selectedService}</p>
                      <p className="text-xs text-neutral-700 font-semibold">👨‍⚕️ Provider: Dr. Aryan Parmar</p>
                      <p className="text-xs text-neutral-700 font-semibold">📞 Contact: {patientPhone}</p>
                    </div>

                    <div className="flex gap-3 max-w-xs mx-auto pt-4">
                      <button
                        onClick={handleResetBooking}
                        className="flex-1 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Book Another
                      </button>
                      <a
                        href="#gallery"
                        className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center"
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

      {/* Meet the Doctors Section */}
      <section id="about" className="py-24 px-6 bg-white">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          {/* Left Doctor Card */}
          <motion.div variants={fadeInUp} className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-neutral-200 shadow-xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent z-10" />
              <img
                src="/assets/yourdentist/doctor_profile.png"
                alt="Dr. Aryan Parmar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-white/95 border border-neutral-200 p-5 rounded-2xl shadow-lg">
                <h4 className="text-sm font-black uppercase text-neutral-900">Dr. Aryan Parmar</h4>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Lead Dental Surgeon & Implantologist</p>
                <div className="flex gap-2.5 mt-3 pt-3 border-t border-neutral-200/80 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                  <span>BDS, MDS</span>
                  <span>•</span>
                  <span>15+ Yrs Exp</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Text (7 columns) */}
          <motion.div variants={fadeInUp} className="lg:col-span-7 space-y-6">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Clinical Leadership</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900 leading-tight">
              Dr. Aryan Parmar <br />
              <span className="text-neutral-500">Dentistry with a Caring Touch</span>
            </h2>

            <p className="text-sm text-neutral-600 leading-relaxed font-medium">
              Dr. Aryan Parmar is one of Patna's most respected oral surgeons and cosmetic dental specialists. Certified in advanced implantology and dental scanning, he believes in delivering painless, single-session clinical recoveries.
            </p>

            {/* Authority Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center">
                <span className="block text-xl font-black text-neutral-900 font-mono">BDS, MDS</span>
                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Lead Surgeon</span>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center">
                <span className="block text-xl font-black text-neutral-900 font-mono">15+ Yrs</span>
                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Exp</span>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center">
                <span className="block text-xl font-black text-neutral-900 font-mono">163+</span>
                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Reviews</span>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl text-center">
                <span className="block text-xl font-black text-neutral-900 font-mono">1000+</span>
                <span className="block text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Smiles</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                "Certified Dental Implantologist (MDS)",
                "Advanced Digital Smile Designer",
                "Computerized Micro-Dentistry Expert",
                "15+ Years Clinical Practice",
                "Patliputra Dental Association Board Member",
                "1000+ Successful Procedures"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center text-[8px] text-black font-bold shrink-0 border border-neutral-200">
                    ✓
                  </div>
                  <span className="text-xs text-neutral-700 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 px-6 bg-neutral-50 border-y border-neutral-200/50">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Google Reviews & Patient Stories</h2>
            <p className="text-sm text-neutral-600">
              Read real feedback from patients who completed treatments under Dr. Aryan Parmar at Patliputra Clinic.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Rahul Sharma",
                treatment: "Laser Teeth Whitening",
                rating: 5,
                text: "The whitening treatment was absolutely amazing! I got 6 shades lighter in less than an hour. Painless and very professional staff."
              },
              {
                name: "Priya Mehta",
                treatment: "Premium Dental Implant",
                rating: 5,
                text: "Was extremely scared of implants, but Dr. Aryan made it completely painless. He explained every step. The replacement tooth feels totally natural."
              },
              {
                name: "Arjun Kapoor",
                treatment: "Painless Root Canal",
                rating: 5,
                text: "I went in with severe toothache and got a root canal. Micro-dentistry anesthesia was so effective I didn't feel a single needle or drilling sound."
              }
            ].map((review, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeInUp}
                whileHover={{ y: -6, borderColor: 'rgba(0, 0, 0, 0.8)', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)' }}
                className="bg-white border border-neutral-200 p-6 rounded-2xl space-y-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-neutral-700 uppercase bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200">
                    Verified review
                  </span>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                  "{review.text}"
                </p>
                <div className="border-t border-neutral-100 pt-4">
                  <h4 className="text-xs font-black uppercase text-neutral-900">{review.name}</h4>
                  <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">Treatment: {review.treatment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Frequently Asked Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-neutral-900">Any Questions? We have Answers</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is dental implant treatment painful?",
                a: "No. Implants are performed under local computerized anesthesia, meaning you won't feel anything during the process. Post-treatment discomfort is minimal and easily managed with prescribed pain relievers."
              },
              {
                q: "Do you offer EMI payments for expensive treatments?",
                a: "Yes! We offer 0% EMI financing options through Bajaj Finance and other banking partners for dental treatments above ₹5,000, making implants and straightening affordable."
              },
              {
                q: "How long does teeth whitening last?",
                a: "Typically, professional laser whitening results last between 1 to 2 years, depending on your lifestyle and diet (coffee, tea, smoking etc). We also provide touch-up packages to preserve brightness."
              },
              {
                q: "Do you accept health insurance policies?",
                a: "Yes, we accept major health insurance plans covering dental procedures, including Star Health, Niva Bupa, and ICICI Lombard. Please consult our front desk before booking."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-neutral-100"
                >
                  <span className="text-xs sm:text-sm font-black uppercase text-neutral-900 tracking-wide">{faq.q}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-neutral-600 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-200 pt-4 bg-white">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-800 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-neutral-800 pb-12">
          {/* Logo & Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/assets/yourdentist/logo_cropped.png"
                alt="YOUR DENTIST Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="text-sm font-black text-white">YOUR DENTIST</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-bold uppercase">
              Dr. Aryan Parmar Patna Clinic. Pain-free oral care solutions.
            </p>
          </div>

          {/* Timings */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Working Hours</h4>
            <div className="space-y-1.5 text-xs font-bold uppercase">
              <p>Monday - Saturday: 10:00 AM - 08:00 PM</p>
              <p className="text-amber-500">Sunday: Closed (Emergencies only)</p>
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Location Address</h4>
            <div className="space-y-1 text-xs font-medium">
              <p className="font-bold text-white uppercase">Patliputra Clinic:</p>
              <p>H/No 12, Pataliputra Colony, Patna, Bihar 800013</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
          <span>© 2026 YOUR DENTIST. Managed by Creator Armour.</span>
          <span>Dental Marketing Solutions Patna</span>
        </div>
      </footer>

      {/* Video Testimonial Modal Overlay */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveVideoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative aspect-[9/16] w-full max-w-[340px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors"
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

      {/* Floating Buttons: WhatsApp & AI Receptionist (Highest ROI) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Floating WhatsApp Action Button */}
        <a
          href="https://wa.me/919876543210?text=Hi,%20I%20want%20to%20book%20a%20free%20smile%20assessment."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 border border-emerald-500"
          title="WhatsApp Now"
        >
          <span className="text-2xl">📲</span>
        </a>

        {/* AI Dentist Assistant Widget */}
        <div className="relative flex flex-col items-end">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white border border-neutral-200 w-[320px] sm:w-[355px] rounded-3xl shadow-2xl overflow-hidden mb-3 flex flex-col"
              >
                {/* Chat Header */}
                <div className="bg-black text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Dentist Assistant</h4>
                      <p className="text-[9px] text-neutral-400 font-bold">Patliputra Clinic AI</p>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Chat Message Scroll */}
                <div className="p-4 h-[250px] overflow-y-auto space-y-3 bg-neutral-50/50 flex flex-col whitespace-pre-wrap">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-neutral-900 text-white self-end rounded-tr-none'
                          : 'bg-white border border-neutral-200 text-neutral-800 self-start rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-white border border-neutral-200 text-neutral-400 self-start rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs animate-pulse">
                      Assistant is typing...
                    </div>
                  )}
                </div>

                {/* Quick Option Menu */}
                <div className="p-4 border-t border-neutral-200 bg-white space-y-2">
                  <p className="text-[8px] font-black uppercase text-neutral-400 tracking-wider mb-2">Select inquiries:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => triggerChatOption("Book Appointment", "Great! To book a Free Smile Assessment, please scroll down to our reservation form, or WhatsApp us directly at +91 98765 43210. 📅")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors"
                    >
                      📅 Book Appointment
                    </button>
                    <button
                      onClick={() => triggerChatOption("Scaling", "Professional Teeth Scaling & Polishing starts from just ₹800! It includes ultrasonic cleanup to remove calculus. Would you like to schedule one? ✨")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors"
                    >
                      ✨ Scaling
                    </button>
                    <button
                      onClick={() => triggerChatOption("Implants", "Dr. Aryan specializes in premium implants starting at ₹35,000 using top titanium brands. We offer 0% EMI diagnostics. Book a free consultation slot above! 🔩")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors"
                    >
                      🔩 Implants
                    </button>
                    <button
                      onClick={() => triggerChatOption("Aligners", "Clear Invisible Aligners consultation is 100% Free! We do complete 3D scanner mapping on day 1 to plan your alignment journey. 🎯")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors"
                    >
                      🎯 Aligners
                    </button>
                    <button
                      onClick={() => triggerChatOption("Talk to Team", "Our team is available immediately! Click the WhatsApp bubble directly above this assistant to start chatting live with our front desk. 📞")}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-black rounded-lg border border-neutral-200 transition-colors"
                    >
                      📞 Talk to Team
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assistant Trigger Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-black hover:bg-neutral-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 border border-neutral-800"
            title="Chat Assistant"
          >
            {chatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
