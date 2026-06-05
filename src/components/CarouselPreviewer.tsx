import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  MessageSquare
} from 'lucide-react';
import { CarouselCampaign, CarouselSlide } from '../data/carouselSchema';

interface CarouselPreviewerProps {
  campaign: CarouselCampaign;
  themeId?: string;
}

export default function CarouselPreviewer({ campaign, themeId = 'midnight-emerald' }: CarouselPreviewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const totalSlides = campaign.slides.length;
  const currentSlide = campaign.slides[currentSlideIndex];

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Color theme definitions matching the ReelGenerator style guide
  const getThemeClasses = () => {
    switch (themeId) {
      case 'sunset-rose':
        return {
          bg: 'bg-gradient-to-br from-[#120509] via-[#240b15] to-[#070104]',
          accentText: 'text-rose-400',
          accentBg: 'bg-rose-500/20 border-rose-500/30',
          highlightText: 'text-rose-300',
          glowShadow: 'shadow-rose-500/20'
        };
      case 'cyber-glow':
        return {
          bg: 'bg-gradient-to-br from-[#020514] via-[#070d2b] to-[#010207]',
          accentText: 'text-cyan-400',
          accentBg: 'bg-cyan-500/20 border-cyan-500/30',
          highlightText: 'text-cyan-300',
          glowShadow: 'shadow-cyan-500/20'
        };
      case 'amber-velvet':
        return {
          bg: 'bg-gradient-to-br from-[#0d0701] via-[#1c1103] to-[#050200]',
          accentText: 'text-amber-500',
          accentBg: 'bg-amber-500/20 border-amber-500/30',
          highlightText: 'text-amber-300',
          glowShadow: 'shadow-amber-500/20'
        };
      case 'midnight-emerald':
      default:
        return {
          bg: 'bg-gradient-to-br from-[#020d0a] via-[#051c14] to-[#010806]',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-500/20 border-emerald-500/30',
          highlightText: 'text-emerald-300',
          glowShadow: 'shadow-emerald-500/20'
        };
    }
  };

  const theme = getThemeClasses();

  // Helper to render layout-specific visual styles
  const renderSlideContent = (slide: CarouselSlide) => {
    switch (slide.layout) {
      case 'HOOK':
        return (
          <div className="h-full flex flex-col justify-between p-6 relative">
            {slide.imageUrl ? (
              <div className="absolute inset-0 z-0">
                <img 
                  src={slide.imageUrl} 
                  alt="Slide Cover" 
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[-10%] w-[180px] h-[180px] rounded-full blur-[80px] opacity-30 bg-emerald-500/20" />
              </div>
            )}
            
            <div className="z-10 mt-6 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-white/90 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                {campaign.industry.toUpperCase()} TRUTHS
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>

            <div className="z-10 flex-1 flex flex-col justify-end pb-8 text-left space-y-4">
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                {slide.headline}
              </h2>
              {slide.subheadline && (
                <p className="text-sm font-semibold text-emerald-400 drop-shadow-md">
                  {slide.subheadline}
                </p>
              )}
            </div>
          </div>
        );

      case 'MYTH_VS_FACT':
        return (
          <div className="h-full flex flex-col justify-between p-6 relative text-left">
            <div className="mt-6">
              <span className="text-[10px] font-black tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                MYTH VS FACT
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6">
              {/* Myth Box */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  <span>The Myth</span>
                </div>
                <p className="text-sm font-medium text-white/80 leading-relaxed">
                  {slide.myth}
                </p>
              </div>

              {/* Fact Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>The Reality</span>
                </div>
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  {slide.fact}
                </p>
              </div>
            </div>

            <div className="pb-4">
              <p className="text-[10px] text-white/40 italic">
                *Verified scientific clinical logic.
              </p>
            </div>
          </div>
        );

      case 'PROBLEM':
      case 'ANALOGY':
      case 'EDUCATION':
        return (
          <div className="h-full flex flex-col justify-between p-6 text-left">
            <div className="mt-6 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {slide.layout}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <h3 className="text-xl font-black text-white leading-tight tracking-tight">
                {slide.headline}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                {slide.bodyText}
              </p>
            </div>

            <div className="pb-4">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-bold">Swipe to keep learning ➡️</span>
            </div>
          </div>
        );

      case 'TIMELINE':
        return (
          <div className="h-full flex flex-col justify-between p-6 text-left">
            <div className="mt-6">
              <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                PROGRESSION TIMELINE
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <h3 className="text-lg font-black text-white mb-2">
                {slide.headline}
              </h3>
              
              <div className="space-y-3 relative pl-4 border-l border-white/10">
                {slide.timelineSteps?.map((step, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                    <p className="text-xs font-bold text-white/90">{step.split(':')[0]}:</p>
                    <p className="text-[11px] text-white/50 leading-snug">{step.split(':')[1] || ''}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-4">
              <span className="text-[10px] text-rose-400/80 font-bold tracking-wider uppercase">⚠️ Don't ignore the signs</span>
            </div>
          </div>
        );

      case 'BENEFITS':
        return (
          <div className="h-full flex flex-col justify-between p-6 text-left">
            <div className="mt-6">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                CLINICAL BENEFITS
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              <h3 className="text-lg font-black text-white">
                {slide.headline}
              </h3>
              
              <div className="space-y-2.5">
                {slide.points?.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-white/90 leading-snug">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-4">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-bold">Final slide next ➡️</span>
            </div>
          </div>
        );

      case 'CTA':
        return (
          <div className="h-full flex flex-col justify-between p-6 text-left relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute bottom-[20%] right-[-10%] w-[180px] h-[180px] rounded-full blur-[80px] opacity-30 bg-emerald-500/20" />
            </div>

            <div className="z-10 mt-6">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                EXCLUSIVE INVITATION
              </span>
            </div>

            <div className="z-10 flex-1 flex flex-col justify-center space-y-5">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white leading-tight tracking-tight">
                  {slide.headline}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-semibold">
                  {slide.bodyText}
                </p>
              </div>

              {slide.tagline && (
                <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{slide.tagline}</span>
                </div>
              )}

              {/* Interactive Mock Call-to-action button */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2.5 backdrop-blur-md">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse">
                  <MessageSquare className="w-4 h-4" />
                  <span>Algorithm Boosted CTA</span>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-95 transition-all">
                  {slide.buttonText || campaign.cta.buttonText}
                </button>
              </div>
            </div>

            <div className="z-10 pb-4">
              <p className="text-[9px] text-white/40 leading-relaxed">
                By booking through Creator Armour, standard consumer checks apply.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      
      {/* 3D Glass Device Frame */}
      <div className="relative">
        <div 
          className="absolute inset-[-4px] rounded-[52px] opacity-20 blur-[16px] pointer-events-none transition-all duration-500"
          style={{ background: `linear-gradient(135deg, ${theme.accentText}, #020504)` }}
        />

        <div className="w-[340px] h-[520px] bg-[#0d0f14] rounded-[48px] p-3 border-4 border-[#1E293B] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] relative overflow-hidden ring-1 ring-white/10 flex flex-col">
          
          {/* Mockup Canvas Screen */}
          <div className={`w-full h-full rounded-[38px] overflow-hidden ${theme.bg} relative flex flex-col justify-between select-none`}>
            
            {/* Top Indicator / Slide Dots */}
            <div className="w-full flex gap-1 z-20 px-6 mt-4">
              {campaign.slides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentSlideIndex 
                      ? 'flex-1 bg-white' 
                      : 'w-2 bg-white/20'
                  }`} 
                />
              ))}
            </div>

            {/* Main Slide Panel */}
            <div className="flex-1 w-full relative">
              {renderSlideContent(currentSlide)}
            </div>

            {/* Bottom Actions Mockup (Instagram Overlay) */}
            <div className="border-t border-white/5 bg-black/45 backdrop-blur-md px-6 py-3.5 z-20 flex justify-between items-center">
              <div className="flex items-center gap-4 text-white/60">
                <Heart className="w-4 h-4 hover:text-rose-500 cursor-pointer transition-colors" />
                <MessageCircle className="w-4 h-4 hover:text-cyan-400 cursor-pointer transition-colors" />
                <Send className="w-4 h-4 hover:text-emerald-400 cursor-pointer transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/40">
                  {currentSlideIndex + 1} / {totalSlides}
                </span>
                <Bookmark className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Manual Layout Navigator Controls */}
      <div className="flex items-center gap-4 bg-neutral-900/60 p-2.5 rounded-2xl border border-white/5 w-[340px] justify-between">
        <button
          onClick={prevSlide}
          className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>

        <span className="text-xs font-black text-white/60 uppercase tracking-widest">
          Slide {currentSlideIndex + 1}
        </span>

        <button
          onClick={nextSlide}
          className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
