import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Music, 
  Copy, 
  Check, 
  Video, 
  ChevronRight, 
  HelpCircle, 
  Layers, 
  Palette, 
  Gauge, 
  Type, 
  Info,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CarouselPreviewer from '../components/CarouselPreviewer';
import { 
  MOCK_SCALING_MYTH_CAROUSEL,
  MOCK_TREATMENT_EXPLAINED,
  MOCK_COST_BREAKDOWN,
  MOCK_BEFORE_AFTER_STORY,
  MOCK_MISTAKES_PEOPLE_MAKE
} from '../data/carouselSchema';

// Themes with visual gradients and effects
const THEMES = [
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    bgClass: 'bg-gradient-to-br from-[#020d0a] via-[#051c14] to-[#010806]',
    textColor: 'text-emerald-400',
    highlightColor: 'text-white',
    accentColor: '#10b981',
    accentBg: 'bg-emerald-500/20',
    circleColors: ['bg-emerald-500/20', 'bg-teal-500/20'],
    borderClass: 'border-emerald-500/20',
    fontStyle: 'font-outfit'
  },
  {
    id: 'sunset-rose',
    name: 'Sunset Rose',
    bgClass: 'bg-gradient-to-br from-[#120509] via-[#240b15] to-[#070104]',
    textColor: 'text-rose-400',
    highlightColor: 'text-white',
    accentColor: '#f43f5e',
    accentBg: 'bg-rose-500/20',
    circleColors: ['bg-rose-500/20', 'bg-amber-500/20'],
    borderClass: 'border-rose-500/20',
    fontStyle: 'font-serif'
  },
  {
    id: 'cyber-glow',
    name: 'Cyber Glow',
    bgClass: 'bg-gradient-to-br from-[#020514] via-[#070d2b] to-[#010207]',
    textColor: 'text-cyan-400',
    highlightColor: 'text-purple-400',
    accentColor: '#06b6d4',
    accentBg: 'bg-cyan-500/20',
    circleColors: ['bg-cyan-500/20', 'bg-purple-500/20'],
    borderClass: 'border-cyan-500/20',
    fontStyle: 'font-mono'
  },
  {
    id: 'amber-velvet',
    name: 'Amber Velvet',
    bgClass: 'bg-gradient-to-br from-[#0d0701] via-[#1c1103] to-[#050200]',
    textColor: 'text-amber-500',
    highlightColor: 'text-white',
    accentColor: '#f59e0b',
    accentBg: 'bg-amber-500/20',
    circleColors: ['bg-amber-500/20', 'bg-orange-500/20'],
    borderClass: 'border-amber-500/20',
    fontStyle: 'font-sans'
  },
  {
    id: 'monochrome-minimal',
    name: 'Minimal Black',
    bgClass: 'bg-gradient-to-br from-[#000000] via-[#0c0c0c] to-[#000000]',
    textColor: 'text-neutral-400',
    highlightColor: 'text-neutral-100',
    accentColor: '#f5f5f5',
    accentBg: 'bg-neutral-800',
    circleColors: ['bg-neutral-800/20', 'bg-neutral-900/40'],
    borderClass: 'border-neutral-800',
    fontStyle: 'font-outfit'
  }
];

const FONTS = [
  { id: 'font-outfit', name: 'Outfit (Sleek)' },
  { id: 'font-serif', name: 'Playfair (Elegant Serif)' },
  { id: 'font-mono', name: 'Space Mono (Cyberpunk)' },
  { id: 'font-sans', name: 'Inter (Clean Sans)' }
];

const SPEED_PRESETS = [
  { label: 'Slow (3s)', value: 3000 },
  { label: 'Normal (2s)', value: 2000 },
  { label: 'Fast (1.2s)', value: 1200 }
];

const PRESETS = [
  {
    id: 'skincare-barter',
    name: '🧴 Skincare Barter Pitch',
    description: 'Perfect for skin/beauty brands looking for product exchange creators.',
    slides: [
      { text: "BRANDS LOOKING FOR\n[BARTER COLLABS] ✨", delay: 2000 },
      { text: "NICHE:\n[SKINCARE & BEAUTY] 🧴", delay: 2000 },
      { text: "DELIVERABLES:\n[1x REEL + 1x STORY] 📸", delay: 2000 },
      { text: "WHAT YOU GET:\n[PREMIUM VITAMIN C KIT]\nworth ₹8,000+ 🎁", delay: 2200 },
      { text: "CLICK THE LINK IN BIO\n[TO SECURE YOUR SPOT] 👇", delay: 2000 }
    ],
    themeId: 'midnight-emerald'
  },
  {
    id: 'fashion-barter',
    name: '👗 Mod-Fashion Lookbooks',
    description: 'For fashion labels looking to barter custom-styled outfits.',
    slides: [
      { text: "FASHION CREATORS!\n[WE ARE HIRING] 👗", delay: 2000 },
      { text: "NICHE:\n[AESTHETIC LOOKBOOKS] ⚡", delay: 2000 },
      { text: "OFFERING:\n[3x LUXURY OUTFITS] of your choice 🎁", delay: 2000 },
      { text: "SHIPPING:\n[FULLY COVERED] 📦", delay: 1800 },
      { text: "LOCK IN THE COLLAB VIA\n[CREATOR ARMOUR LINK IN BIO] 🚀", delay: 2200 }
    ],
    themeId: 'sunset-rose'
  },
  {
    id: 'healthy-snacks',
    name: '🥑 Healthy Snacks Campaign',
    description: 'Designed for food, wellness & fitness creators.',
    slides: [
      { text: "ATTENTION:\n[FITNESS & FOOD CREATORS] 🥑", delay: 2000 },
      { text: "GET OUR HIGH-PROTEIN\n[SUPERFOOD HAMPER] 🎁", delay: 2000 },
      { text: "100% BARTER COLLAB\n[NO CHARGES EVER] 🚫", delay: 1800 },
      { text: "MINIMUM FOLLOWERS:\n[1,000+] (ANY NICHE) 📈", delay: 2000 },
      { text: "TAP THE LINK IN BIO\n[TO CLAIM IN 60 SECONDS] 👇", delay: 2000 }
    ],
    themeId: 'amber-velvet'
  },
  {
    id: 'pet-nutrition',
    name: '🐾 Pet Care Product Exchange',
    description: 'For puppy, pet-parents, and veterinary-niche influencers.',
    slides: [
      { text: "PET PARENTS & PUPPIES!\n[BARTER IS LIVE] 🐶🐱", delay: 2000 },
      { text: "NICHE:\n[PET CARE & DOGS/CATS] 🐾", delay: 2000 },
      { text: "WHAT WE SEND YOU:\n[3 MONTHS FRESH NUTRITION]\nvalued at ₹12,000! 🥩", delay: 2200 },
      { text: "DELIVERABLES:\n[2x VERTICAL VIDEOS] 🎥", delay: 2000 },
      { text: "APPLY NOW — LINK IN BIO\n[VIA CREATOR ARMOUR ESCROW] 🛡️", delay: 2200 }
    ],
    themeId: 'cyber-glow'
  }
];

export default function ReelGenerator() {
  const [searchParams] = useSearchParams();
  const [generatorMode, setGeneratorMode] = useState<'reel' | 'carousel'>('reel');
  const [carouselCampaign, setCarouselCampaign] = useState<any>(MOCK_SCALING_MYTH_CAROUSEL);
  const [jsonText, setJsonText] = useState(JSON.stringify(MOCK_SCALING_MYTH_CAROUSEL, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setCarouselCampaign(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const loadCarouselPreset = (preset: any) => {
    setCarouselCampaign(preset);
    setJsonText(JSON.stringify(preset, null, 2));
    setJsonError(null);
  };

  const [slides, setSlides] = useState([
    { text: "D2C BRANDS LOOKING FOR\n[100% BARTER COLLABS] 📦✨", delay: 2000 },
    { text: "TIRED OF SENDING PRODUCTS\n[AND GETTING NO CONTENT?] 🚫", delay: 2000 },
    { text: "WE SOURCED 1,000+ CREATORS\n[READY TO DO BARTER] 📈", delay: 2000 },
    { text: "WE HANDLE CREATOR TRACKING,\n[ESCROW & DELIVERABLES] 🛡️", delay: 2000 },
    { text: "ZERO SETUP OR ONBOARDING COST.\n[TAP THE LINK IN BIO] 👇", delay: 2000 }
  ]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'carousel') {
      setGeneratorMode('carousel');
    }
    const hookParam = searchParams.get('hook');
    if (hookParam) {
      const topicParam = searchParams.get('topic') || '';
      const formatParam = searchParams.get('format') || '';
      const categoryParam = searchParams.get('category') || '';
      
      const newSlides = [
        { text: `${hookParam}`, delay: 2500 },
        { text: `TOPIC:\n[${topicParam}] 🦷`, delay: 2200 },
        { text: `RECOMMENDED FORMAT:\n[${formatParam}] 🎥`, delay: 2200 },
        { text: `CONTENT CATEGORY:\n[${categoryParam}] ⚡`, delay: 2000 },
        { text: "TAP THE LINK IN BIO\n[TO SECURE YOUR VISIT] 👇", delay: 2200 }
      ];
      setSlides(newSlides);
      setCurrentSlideIndex(0);
      setIsPlaying(true);
    }
  }, [searchParams]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [themeId, setThemeId] = useState('midnight-emerald');
  const [fontId, setFontId] = useState('font-outfit');
  const [animationSpeed, setAnimationSpeed] = useState(2000); // ms per slide
  const [showMusicVisualizer, setShowMusicVisualizer] = useState(true);
  const [showProgressBars, setShowProgressBars] = useState(true);
  const [showNoiseOverlay, setShowNoiseOverlay] = useState(true);
  const [showSparkles, setShowSparkles] = useState(true);
  const [customAudioLabel, setCustomAudioLabel] = useState('Trending Audio: Creator Armour Barter Growth Vibe (Original Audio)');
  const [copiedLink, setCopiedLink] = useState(false);

  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  // Auto-play routine
  useEffect(() => {
    if (isPlaying) {
      const currentDelay = slides[currentSlideIndex]?.delay || animationSpeed;
      slideTimerRef.current = setTimeout(() => {
        setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
      }, currentDelay);
    }

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
      }
    };
  }, [isPlaying, currentSlideIndex, slides, animationSpeed]);

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setSlides(JSON.parse(JSON.stringify(preset.slides)));
    setThemeId(preset.themeId);
    const themeObj = THEMES.find(t => t.id === preset.themeId);
    if (themeObj) {
      setFontId(themeObj.fontStyle);
    }
    setCurrentSlideIndex(0);
    setIsPlaying(true);
  };

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...slides];
    updated[index].text = newText;
    setSlides(updated);
  };

  const handleDelayChange = (index: number, delayMs: number) => {
    const updated = [...slides];
    updated[index].delay = delayMs;
    setSlides(updated);
  };

  const addNewSlide = () => {
    setSlides([...slides, { text: "EDIT THIS TEXT\n[USE BRACKETS TO GLOW] ⚡", delay: 2000 }]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    setCurrentSlideIndex(0);
  };

  const formatSlideText = (text: string) => {
    // Parse text between [brackets] and wrap them in highlighted span
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const cleanText = part.slice(1, -1);
        return (
          <span 
            key={idx} 
            className={`font-black tracking-tight ${activeTheme.highlightColor} px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 shadow-lg shadow-white/5 animate-pulse`}
            style={{ textShadow: `0 0 15px ${activeTheme.accentColor}40` }}
          >
            {cleanText}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const copyTips = () => {
    const link = "https://creatorarmour.com/signup?mode=brand";
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020504] text-white font-outfit pb-20 relative overflow-hidden">
      <Helmet>
        <title>Animated Text Reel Studio | Creator Armour</title>
        <meta name="description" content="Generate high-converting animated text Reels for D2C brand barter opportunities. Edit slides, apply neon glassmorphism themes, and boost your applications." />
      </Helmet>

      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white uppercase italic">Creator Armour Studio</span>
              <span className="block text-[9px] font-bold text-emerald-500 tracking-[0.2em] uppercase leading-none mt-0.5">Dynamic Reels Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50 hidden md:inline-flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Award className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              100% Free Lead Magnet Tool
            </span>
          </div>
        </div>
      </header>

      {/* Mode Selector Toggle */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex justify-center sm:justify-start">
        <div className="p-1 rounded-2xl bg-white/5 border border-white/5 inline-flex gap-2">
          <button 
            onClick={() => setGeneratorMode('reel')}
            className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              generatorMode === 'reel' 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            🎥 Dynamic Text Reels
          </button>
          <button 
            onClick={() => setGeneratorMode('carousel')}
            className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              generatorMode === 'carousel' 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            🗂️ Instagram Carousel (JSON)
          </button>
        </div>
      </div>

      {/* Main Studio Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Controls & Editing Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {generatorMode === 'reel' ? (
            <>
              {/* Main Hook Card */}
              <div className="p-8 rounded-[32px] bg-gradient-to-r from-emerald-950/20 to-teal-950/10 border border-emerald-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles className="w-24 h-24 text-emerald-400" />
                </div>
                <div className="max-w-lg space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Stop making boring reels</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-white leading-tight">
                    Create Dynamic <span className="text-emerald-400 italic">Text-Only</span> Reels For Barter In 60 Seconds.
                  </h1>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Text-only reels are generating millions of organic views on Instagram right now. Use this studio to design elegant, looping text animation sequences to showcase your brand barter offers or call for creators.
                  </p>
                </div>
              </div>

              {/* SECTION 1: PRESET CAMPAIGNS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-black tracking-tight text-white">Select a Campaign Preset</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all duration-300 group flex flex-col justify-between h-36"
                    >
                      <div>
                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{preset.name}</h3>
                        <p className="text-xs text-white/40 leading-snug mt-1.5">{preset.description}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500/70 tracking-wider uppercase inline-flex items-center gap-1 mt-3">
                        Load Template <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: THE SLIDE EDITOR */}
              <div className="space-y-4 p-6 rounded-3xl bg-neutral-900/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-lg font-black tracking-tight text-white">Edit Slide Text Sequence</h2>
                  </div>
                  <button 
                    onClick={addNewSlide}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add Slide
                  </button>
                </div>

                <p className="text-xs text-white/40 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  💡 <strong>Pro Tip:</strong> Wrap any word in square brackets like <code>[this]</code> to make it glow in the highlight theme color and dynamic slide animation!
                </p>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
                  {slides.map((slide, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-2xl bg-black/40 border transition-all duration-300 flex items-start gap-4 ${
                        currentSlideIndex === index ? 'border-emerald-500/40 shadow-md shadow-emerald-500/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 pt-1.5">
                        <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/60">
                          {index + 1}
                        </span>
                        <button 
                          onClick={() => deleteSlide(index)}
                          disabled={slides.length <= 1}
                          className="text-white/20 hover:text-rose-500 disabled:opacity-30 disabled:pointer-events-none p-1 transition-colors mt-2"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <textarea
                          value={slide.text}
                          onChange={(e) => handleTextChange(index, e.target.value)}
                          placeholder={`Enter text for slide ${index + 1}...`}
                          rows={2}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/30 transition-all font-sans"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Slide Duration:</span>
                          <select
                            value={slide.delay || 2000}
                            onChange={(e) => handleDelayChange(index, Number(e.target.value))}
                            className="bg-white/5 border border-white/5 text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500/30 font-bold"
                          >
                            <option value="1200" className="bg-neutral-900">1.2 seconds (Fast)</option>
                            <option value="1800" className="bg-neutral-900">1.8 seconds (Medium)</option>
                            <option value="2000" className="bg-neutral-900">2.0 seconds (Standard)</option>
                            <option value="2500" className="bg-neutral-900">2.5 seconds (Thorough)</option>
                            <option value="3000" className="bg-neutral-900">3.0 seconds (Slow)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: DESIGN CONFIGURATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme & Fonts Selectors */}
                <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Theme Aesthetics</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Visual Palette</label>
                      <div className="flex flex-wrap gap-2">
                        {THEMES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setThemeId(t.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              themeId === t.id 
                                ? 'bg-white/10 text-white border-white/30' 
                                : 'bg-white/5 text-white/50 border-white/5 hover:border-white/15'
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Font Family</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONTS.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setFontId(f.id)}
                            className={`p-2 rounded-xl border text-left text-xs transition-all ${
                              fontId === f.id 
                                ? 'bg-white/10 text-white border-white/30 font-bold' 
                                : 'bg-white/5 text-white/50 border-white/5 hover:border-white/15'
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Overlays Options */}
                <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Studio Overlays</h3>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.07] transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Music Equalizer</span>
                        <span className="text-[10px] text-white/40">Displays audio waves at bottom</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showMusicVisualizer}
                        onChange={(e) => setShowMusicVisualizer(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.07] transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Slide Progress Bars</span>
                        <span className="text-[10px] text-white/40">Story-style progress on top</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showProgressBars}
                        onChange={(e) => setShowProgressBars(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/[0.07] transition-all">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Analog Noise Overlay</span>
                        <span className="text-[10px] text-white/40">Subtle aesthetic CRT/Static dust</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showNoiseOverlay}
                        onChange={(e) => setShowNoiseOverlay(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Carousel Header Card */}
              <div className="p-8 rounded-[32px] bg-gradient-to-r from-emerald-950/20 to-teal-950/10 border border-emerald-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles className="w-24 h-24 text-emerald-400" />
                </div>
                <div className="max-w-lg space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Template-Driven Generator</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-white leading-tight">
                    Design Premium <span className="text-emerald-400 italic">JSON-Driven</span> Carousels.
                  </h1>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Custom AI layouts output structured JSON payload matching our verified conversion structures. Renders instantly on the right.
                  </p>
                </div>
              </div>

              {/* CAROUSEL CAMPAIGN PRESETS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-black tracking-tight text-white">Select a Carousel Preset</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => loadCarouselPreset(MOCK_SCALING_MYTH_CAROUSEL)}
                    className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">🦷 Myth vs Fact</h3>
                      <p className="text-[11px] text-white/40 leading-snug mt-1">Debunking dental cleaning misconceptions.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => loadCarouselPreset(MOCK_TREATMENT_EXPLAINED)}
                    className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">🏥 Treatment Explained</h3>
                      <p className="text-[11px] text-white/40 leading-snug mt-1">Step-by-step mapping of wisdom tooth surgery.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => loadCarouselPreset(MOCK_COST_BREAKDOWN)}
                    className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">💰 Cost Breakdown</h3>
                      <p className="text-[11px] text-white/40 leading-snug mt-1">Price transparency on Root Canals.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => loadCarouselPreset(MOCK_BEFORE_AFTER_STORY)}
                    className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">✨ Before & After Story</h3>
                      <p className="text-[11px] text-white/40 leading-snug mt-1">👰 7-day wedding smile transformation.</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => loadCarouselPreset(MOCK_MISTAKES_PEOPLE_MAKE)}
                    className="p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between h-28 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">🪥 Mistakes People Make</h3>
                      <p className="text-[11px] text-white/40 leading-snug mt-1">3 brushing errors ruining enamel.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* JSON TEXT EDITOR CONTAINER */}
              <div className="space-y-4 p-6 rounded-3xl bg-neutral-900/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-lg font-black tracking-tight text-white">Interactive JSON Payload Editor</h2>
                  </div>
                  {jsonError ? (
                    <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black rounded uppercase tracking-wider">
                      Syntax Error
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded uppercase tracking-wider animate-pulse">
                      ✓ Sync Active
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={jsonText}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    rows={12}
                    className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/30 leading-relaxed"
                  />
                  {jsonError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-mono leading-relaxed mt-2">
                      ⚠️ {jsonError}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Realtime Smartphone Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {generatorMode === 'reel' ? (
            <div className="sticky top-24 w-full flex flex-col items-center space-y-6">
              
              {/* Live Indicator */}
              <div className="flex items-center justify-between w-[340px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Live Preview</span>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Aspect 9:16 (Full HD)</span>
              </div>

              {/* SmartPhone Video Preview Container */}
              <div className="relative">
                
                {/* Outer Neon Glow */}
                <div 
                  className="absolute inset-[-4px] rounded-[52px] opacity-20 blur-[16px] pointer-events-none transition-all duration-500"
                  style={{ background: `linear-gradient(135deg, ${activeTheme.accentColor}, #020504)` }}
                />

                {/* 3D Glass Device Frame */}
                <div className="w-[340px] h-[660px] bg-[#0d0f14] rounded-[48px] p-3 border-4 border-[#1E293B] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] relative overflow-hidden ring-1 ring-white/10 flex flex-col">
                  
                  {/* Notch / Speaker */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1E293B] rounded-b-2xl z-50 flex items-center justify-center">
                    <div className="w-10 h-1 bg-black/60 rounded-full" />
                  </div>

                  {/* Inner Canvas (Where Reel Plays) */}
                  <div id="reel-inner-canvas" className={`w-full h-full rounded-[38px] overflow-hidden ${activeTheme.bgClass} relative flex flex-col justify-between p-6 select-none`}>
                    
                    {/* Subtle Noise Static Filter */}
                    {showNoiseOverlay && (
                      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noiseFilter%29%22%2F%3E%3C%2Fsvg%3E')] bg-repeat" />
                    )}

                    {/* Gradient Blurred Mesh Background Blobs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                      <div className={`absolute top-[20%] left-[-10%] w-[180px] h-[180px] rounded-full blur-[80px] opacity-40 animate-pulse ${activeTheme.circleColors[0]}`} />
                      <div className={`absolute bottom-[20%] right-[-10%] w-[180px] h-[180px] rounded-full blur-[80px] opacity-40 animate-pulse ${activeTheme.circleColors[1]}`} style={{ animationDelay: '1.5s' }} />
                    </div>

                    {/* Top Story/Reel Progress Indicators */}
                    {showProgressBars && (
                      <div className="w-full flex gap-1.5 z-20 mt-2">
                        {slides.map((_, idx) => (
                          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-white transition-all duration-300 ${
                                idx < currentSlideIndex 
                                  ? 'w-full' 
                                  : idx === currentSlideIndex 
                                  ? isPlaying 
                                    ? 'animate-[storyProgress_linear]' 
                                    : 'w-1/2' 
                                  : 'w-0'
                              }`}
                              style={{ 
                                animationDuration: `${slides[idx]?.delay || animationSpeed}ms`,
                                animationPlayState: isPlaying ? 'running' : 'paused'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Top Branding / Logo Overlay */}
                    <div className="w-full flex items-center justify-between z-20 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black tracking-widest text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                          BARTER DEALS
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">
                        Creator Armour
                      </span>
                    </div>

                    {/* CENTRAL HIGH-FIDELITY ANIMATED TEXT CONTENT */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center z-10 py-10">
                      <div 
                        key={currentSlideIndex} // Triggers animation on change
                        className={`w-full whitespace-pre-line text-2xl font-black text-white/90 leading-[1.3] px-2 tracking-tight ${fontId} animate-[reelSlideUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]`}
                      >
                        {formatSlideText(slides[currentSlideIndex]?.text || '')}
                      </div>
                    </div>

                    {/* BOTTOM REEL AUDIO INFO & GRAPHICS */}
                    <div className="w-full space-y-4 z-20 pb-2">
                      
                      {/* Music Visualizer Waves */}
                      {showMusicVisualizer && (
                        <div className="flex items-end justify-center gap-1.5 h-6 opacity-80">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => (
                            <div 
                              key={bar} 
                              className="w-1 rounded-t-full"
                              style={{
                                backgroundColor: activeTheme.accentColor,
                                height: isPlaying ? `${Math.floor(Math.random() * 20) + 4}px` : '4px',
                                animation: isPlaying ? `reelBarGlow_${bar % 3} 1.2s ease-in-out infinite alternate` : 'none',
                                animationDelay: `${bar * 0.08}s`
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Audio track label */}
                      <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full py-1.5 px-3 backdrop-blur-md">
                        <Music className="w-3.5 h-3.5 text-white/70 animate-bounce" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[9px] font-bold text-white/80 whitespace-nowrap animate-marquee">
                            {customAudioLabel}
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Absolute Side Reels Indicator Icons */}
                <div className="absolute right-[-44px] bottom-24 flex flex-col items-center gap-6 z-20 bg-black/40 border border-white/5 py-4 px-2 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                      ❤️
                    </div>
                    <span className="text-[9px] font-bold text-white/50">84.2K</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                      💬
                    </div>
                    <span className="text-[9px] font-bold text-white/50">1.4K</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">
                      ✈️
                    </div>
                    <span className="text-[9px] font-bold text-white/50">4.1K</span>
                  </div>
                </div>

              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-2xl border border-white/5 w-[340px] justify-between">
                <button
                  onClick={() => {
                    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
                  }}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  title="Previous Slide"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-3 rounded-full flex items-center justify-center transition-all ${
                    isPlaying 
                      ? 'bg-white text-black hover:bg-white/95' 
                      : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black translate-x-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setCurrentSlideIndex(0);
                    setIsPlaying(true);
                  }}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  title="Reset Loop"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
                  }}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  title="Next Slide"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Record / Dispatch Steps Info Accordion */}
              <div className="w-[340px] p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-[#0e1014] border border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">How to export & post:</h4>
                </div>
                
                <ul className="space-y-3 text-xs text-white/60">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">01.</span>
                    <span>Open your browser's screen recorder (OBS, Loom, or macOS native Cmd+Shift+5).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">02.</span>
                    <span>Position your cursor outside the phone preview area and record the looping preview.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">03.</span>
                    <span>Crop the screen recording to vertical 9:16 and add a trending audio on Instagram.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">04.</span>
                    <span>Paste your Creator Armour escrow link in your bio so creators can apply directly!</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <button
                    onClick={copyTips}
                    className="flex-1 p-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedLink ? <Check className="w-3 h-3 stroke-[3px]" /> : <Copy className="w-3 h-3" />}
                    Copy Portal Link
                  </button>
                  <a
                    href="/barter"
                    target="_blank"
                    className="p-2 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                  >
                    View Barter Hub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          ) : (
            <div className="sticky top-24 w-full flex flex-col items-center space-y-6">
              
              {/* Live Indicator */}
              <div className="flex items-center justify-between w-[340px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Carousel Live Mockup</span>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Aspect 9:16 (Slides)</span>
              </div>

              {/* RENDER THE CAROUSEL PREVIEWER */}
              <CarouselPreviewer campaign={carouselCampaign} themeId={themeId} />

              {/* Tips for Carousels */}
              <div className="w-[340px] p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-[#0e1014] border border-white/5 space-y-3.5 text-left">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Carousel Export Workflow:</h4>
                </div>
                
                <ul className="space-y-2.5 text-xs text-white/60">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">01.</span>
                    <span>Review the rendered templates to verify formatting fits slide boundaries.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">02.</span>
                    <span>Directly copy the generated JSON payload to sync with your database or third-party automated graphics tool.</span>
                  </li>
                </ul>
              </div>

            </div>
          )}
        </div>

      </main>

      {/* Styled Animations */}
      <style>{`
        @keyframes storyProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes reelSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 12s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes reelBarGlow_0 {
          0% { transform: scaleY(0.4); opacity: 0.5; }
          100% { transform: scaleY(1.2); opacity: 1; }
        }
        @keyframes reelBarGlow_1 {
          0% { transform: scaleY(0.8); opacity: 0.7; }
          100% { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes reelBarGlow_2 {
          0% { transform: scaleY(0.3); opacity: 0.4; }
          100% { transform: scaleY(1.0); opacity: 1; }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
