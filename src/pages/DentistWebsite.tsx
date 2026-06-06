import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
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
  Stethoscope
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
    price: "₹800",
    description: "Deep scaling to remove plaque and calculus, finished with professional stains polishing.",
    icon: "🦷"
  },
  {
    name: "Laser Teeth Whitening",
    duration: "60 mins",
    price: "₹3,500",
    description: "Brighten your smile up to 8 shades in a single session with our painless laser technology.",
    icon: "✨"
  },
  {
    name: "Premium Dental Implants",
    duration: "90 mins",
    price: "₹35,000",
    description: "Permanent, natural-looking tooth replacements utilizing top-tier titanium implants.",
    icon: "🔩"
  },
  {
    name: "Painless Root Canal",
    duration: "90 mins",
    price: "₹6,000",
    description: "Save damaged teeth with computerized micro-dentistry under local anesthesia.",
    icon: "🔬"
  },
  {
    name: "Clear Aligners Consultation",
    duration: "30 mins",
    price: "FREE",
    description: "Consultation and digital scan planning for invisible teeth straightening braces.",
    icon: "🎯"
  },
  {
    name: "Child Pediatric Dentistry",
    duration: "45 mins",
    price: "₹1,200",
    description: "Gentle dental checkups, sealants, and cavity preventions tailored for young smiles.",
    icon: "👶"
  }
];

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

export default function DentistWebsite() {
  const [selectedService, setSelectedService] = useState<string>(SERVICES[0].name);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Before/after compare slider position (0-100)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !patientName || !patientPhone) {
      toast.error("Please fill in all booking details.");
      return;
    }
    setBookingConfirmed(true);
    toast.success("Appointment slot reserved successfully!");
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

  return (
    <div className="min-h-screen bg-[#070a13] text-[#f1f5f9] font-sans antialiased overflow-x-hidden selection:bg-cyan-500/20">
      <SEOHead
        title="YOUR DENTIST | Dr. Aryan Parmar Patna — Painless Dentistry"
        description="Premium dental clinic in Patna. Painless implants, laser whitening, root canals, and pediatric dentistry under Dr. Aryan Parmar."
        image="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200"
        imageAlt="YOUR DENTIST Patna Clinic"
      />

      {/* Modern Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-[#070a13]/80 backdrop-blur-md border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-400/15">
              <span className="text-white text-lg font-black font-mono">YD</span>
            </div>
            <div>
              <span className="text-base font-black tracking-wide text-white block">YOUR DENTIST</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Dr. Aryan Parmar</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#gallery" className="hover:text-white transition-colors">Smile Gallery</a>
            <a href="#booking" className="hover:text-white transition-colors">Book Slot</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#about" className="hover:text-white transition-colors">Clinic</a>
          </div>

          <a
            href="#booking"
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-cyan-600 hover:to-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98]"
          >
            Book Slot
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-extrabold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Painless Dental Care in Patna
            </div>

            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
              Painless Dentistry. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Perfect Smiles.</span>
            </h1>

            <p className="text-lg text-neutral-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Experience state-of-the-art dental care with computerized micro-dentistry under Dr. Aryan Parmar. From digital smile makeovers to single-visit pain-free implants.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-4 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">5k+</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Happy Smiles</p>
              </div>
              <div className="border-x border-white/5 px-2">
                <p className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">15+</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Years Experience</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">4.9★</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Google Rating</p>
              </div>
            </div>

            {/* CTA Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-6">
              <a
                href="#booking"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                Schedule Appointment <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#services"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center"
              >
                Our Treatments
              </a>
            </div>
          </div>

          {/* Right Image/Banner Mockup (WOW Factor) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-white/[0.08] shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a13] via-transparent to-transparent z-10" />
              <img
                src="/assets/yourdentist/dr_with_patient_1.jpg"
                alt="Dr. Aryan Parmar with Patient"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-[#070a13]/85 backdrop-blur-md border border-white/[0.08] p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center font-bold text-cyan-400 text-sm">
                    🩺
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">Patliputra Clinic</h4>
                    <p className="text-[10px] text-neutral-400 font-bold mt-1">H/No 12, Pataliputra Colony, Patna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-24 px-6 bg-[#080c16] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Premium Treatments</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">Specialized Oral Care</h2>
            <p className="text-sm text-neutral-400">
              We practice pain-free dentistry combining standard protocols with modern laser, digital smile modeling, and premium medical implants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => (
              <div
                key={idx}
                className="bg-[#090d16] border border-white/[0.06] p-6 rounded-2xl hover:border-cyan-500/30 transition-all flex flex-col justify-between group hover:-translate-y-1 duration-300"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase text-white tracking-wide">{service.name}</h3>
                    <p className="text-xs text-cyan-400 font-mono font-black uppercase mt-1">
                      {service.duration} · Est: {service.price}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#booking"
                    onClick={() => setSelectedService(service.name)}
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Select Treatment & Book →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Before & After Smile Gallery (WOW feature) */}
      <section id="gallery" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Transformations</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">Before & After Smile Gallery</h2>
            <p className="text-sm text-neutral-400">
              Drag the interactive comparison slider horizontally to see the incredible transformation in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive Split Compare Slider (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full max-w-2xl aspect-[4/3] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl select-none">
                {/* BEFORE Image (Underlay) */}
                <img
                  src={BEFORE_AFTER_IMAGES[activeGalleryIndex].before}
                  alt="Before Treatment"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-wider text-amber-400">
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
                  <div className="absolute top-4 right-4 z-20 bg-cyan-500/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-400/20 text-[9px] font-black uppercase tracking-wider text-black">
                    After Transform
                  </div>
                </div>

                {/* Separator Line */}
                <div
                  className="absolute inset-y-0 w-1 bg-cyan-400 z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-400 border-4 border-[#070a13] shadow-lg flex items-center justify-center">
                    <span className="text-[10px] text-[#070a13] font-black">↔</span>
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
            </div>

            {/* Selector list (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-lg font-black uppercase text-white">Select Transformation Case:</h3>
              <div className="space-y-3">
                {BEFORE_AFTER_IMAGES.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveGalleryIndex(idx);
                      setSliderPosition(50);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      activeGalleryIndex === idx
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]'
                    }`}
                  >
                    <p className="text-xs font-black uppercase text-white">{item.title}</p>
                    <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Booking Module */}
      <section id="booking" className="py-24 px-6 bg-[#080c16] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Booking Info (5 columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Real-time scheduling</span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-white leading-tight">
                Secure Your Pain-Free Slot Online
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                Choose a service, date, and preferred time slot below. Your confirmation details will be instantly generated for Dr. Aryan's clinical team.
              </p>
            </div>

            {/* Core Badges */}
            <div className="space-y-3.5 pt-4">
              {[
                { title: "Google Calendar Sync", desc: "Auto-synced with Dr. Aryan's active schedule." },
                { title: "No Upfront Cost", desc: "Pay at the clinic after consultation/cleansing." },
                { title: "Instant Notification", desc: "Get confirmation via SMS or WhatsApp." }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-400 font-bold shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">{badge.title}</h4>
                    <p className="text-xs text-neutral-500 font-bold mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#090d16] border border-white/[0.04] p-4.5 rounded-2xl flex items-center gap-3">
              <Phone className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase">Emergency Helpline</p>
                <p className="text-xs font-black text-white mt-0.5">+91 98765 43210</p>
              </div>
            </div>
          </div>

          {/* Booking Panel Form (7 columns) */}
          <div className="lg:col-span-7">
            <div className="bg-[#090d16] border border-white/[0.06] p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
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
                    <h3 className="text-lg font-black uppercase text-white border-b border-white/5 pb-3">
                      Select Slot Details
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
                          className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-cyan-500/30"
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
                          className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-cyan-500/30"
                        />
                      </div>
                    </div>

                    {/* Service Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-neutral-500">Treatment/Service</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full bg-[#070a13] border border-white/[0.08] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-cyan-500/30 font-semibold"
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
                          className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-cyan-500/30"
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
                                  ? 'bg-cyan-500 text-black border-cyan-500 shadow-md'
                                  : 'bg-black/40 text-neutral-400 border-white/[0.06] hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Submit CTAs */}
                    <div className="pt-4 border-t border-white/5">
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-cyan-600 hover:to-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/10 active:scale-[0.98]"
                      >
                        Confirm Slot Reservation
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
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl">
                      🎉
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase text-white">Booking Confirmed!</h3>
                      <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                        Hi <span className="text-white font-bold">{patientName}</span>, your appointment is successfully reserved on <span className="text-cyan-400 font-bold">{selectedDate}</span> at <span className="text-cyan-400 font-bold">{selectedTime}</span>.
                      </p>
                    </div>

                    <div className="bg-[#070a13] border border-white/[0.06] p-4.5 rounded-2xl max-w-sm mx-auto text-left space-y-2">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Appointment Summary</p>
                      <p className="text-xs text-neutral-300 font-semibold">🩺 Service: {selectedService}</p>
                      <p className="text-xs text-neutral-300 font-semibold">👨‍⚕️ Provider: Dr. Aryan Parmar</p>
                      <p className="text-xs text-neutral-300 font-semibold">📞 Contact: {patientPhone}</p>
                    </div>

                    <div className="flex gap-3 max-w-xs mx-auto pt-4">
                      <button
                        onClick={handleResetBooking}
                        className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Book Another
                      </button>
                      <a
                        href="#gallery"
                        className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center"
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
      <section id="about" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Doctor Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-white/[0.08] shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a13] via-transparent to-transparent z-10" />
              <img
                src="/assets/yourdentist/doctor_profile.png"
                alt="Dr. Aryan Parmar"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-black/80 backdrop-blur-md border border-white/[0.08] p-5 rounded-2xl">
                <h4 className="text-sm font-black uppercase text-white">Dr. Aryan Parmar</h4>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-1">Lead Dental Surgeon & Implantologist</p>
                <div className="flex gap-2.5 mt-3 pt-3 border-t border-white/5 text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                  <span>BDS, MDS</span>
                  <span>•</span>
                  <span>15+ Yrs Exp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Text (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Clinical Leadership</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white leading-tight">
              Dr. Aryan Parmar <br />
              <span className="text-neutral-500">Dentistry with a Caring Touch</span>
            </h2>

            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
              Dr. Aryan Parmar is one of Patna's most respected oral surgeons and cosmetic dental specialists. Certified in advanced implantology and computerized smile design, he believes in delivering painless, single-session clinical recoveries.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                "Certified Dental Implantologist",
                "Advanced Digital Smile Designer",
                "Computerized Micro-Dentistry Expert",
                "15+ Years Clinical Practice",
                "Patliputra Dental Association Board Member",
                "Trained in Painless Laser Protocol"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[8px] text-cyan-400 font-bold shrink-0">
                    ✓
                  </div>
                  <span className="text-xs text-neutral-300 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 px-6 bg-[#080c16] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">Google Reviews & Patient Stories</h2>
            <p className="text-sm text-neutral-400">
              Read real feedback from patients who completed treatments under Dr. Aryan Parmar at Patliputra Clinic.
            </p>
          </div>

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
              <div key={idx} className="bg-[#090d16] border border-white/[0.06] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase bg-cyan-500/10 px-2.5 py-0.5 rounded-md">
                    Verified review
                  </span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                  "{review.text}"
                </p>
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-black uppercase text-white">{review.name}</h4>
                  <p className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">Treatment: {review.treatment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Frequently Asked Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">Any Questions? We have Answers</h2>
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
                className="bg-[#090d16] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-white/[0.01]"
                >
                  <span className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">{faq.q}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-neutral-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
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
                      <div className="px-6 pb-5 text-sm text-neutral-400 leading-relaxed border-t border-white/5 pt-4">
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
      <footer className="bg-[#05070e] border-t border-white/[0.06] pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/5 pb-12">
          {/* Logo & Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                YD
              </div>
              <span className="text-sm font-black text-white">YOUR DENTIST</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-bold uppercase">
              Dr. Aryan Parmar Patna Clinic. Pain-free oral care solutions.
            </p>
          </div>

          {/* Timings */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Working Hours</h4>
            <div className="space-y-1.5 text-xs text-neutral-400 font-bold uppercase">
              <p>Monday - Saturday: 10:00 AM - 08:00 PM</p>
              <p className="text-amber-500">Sunday: Closed (Emergencies only)</p>
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider">Location Address</h4>
            <div className="space-y-1 text-xs text-neutral-400 font-medium">
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
    </div>
  );
}
