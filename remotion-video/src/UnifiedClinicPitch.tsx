import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import config from './unified-pitch-config.json';

export const UnifiedClinicPitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // 1. LIQUID RADIAL MESH GRADIENT (Premium dynamic background)
  const t = frame * 0.025;
  const light1X = 50 + Math.sin(t) * 30;
  const light1Y = 30 + Math.cos(t * 0.8) * 15;
  const light2X = 50 + Math.cos(t * 1.1) * 30;
  const light2Y = 75 + Math.sin(t * 0.9) * 15;
  const light3X = 25 + Math.sin(t * 0.6) * 15;
  const light3Y = 50 + Math.cos(t * 1.3) * 15;

  const background = `
    radial-gradient(circle at ${light1X}% ${light1Y}%, rgba(14, 165, 233, 0.45) 0%, transparent 60%),
    radial-gradient(circle at ${light2X}% ${light2Y}%, rgba(236, 72, 153, 0.45) 0%, transparent 60%),
    radial-gradient(circle at ${light3X}% ${light3Y}%, rgba(245, 158, 11, 0.35) 0%, transparent 50%),
    #04040a
  `;

  // Continuous smooth 3D swing for graphics
  const rotY = Math.sin(frame * 0.05) * 20;
  const rotX = Math.cos(frame * 0.04) * 12;

  // Ascending ripples for visual activity
  const rippleScale = interpolate(frame % 100, [0, 100], [0, 2.8]);
  const rippleOpacity = interpolate(frame % 100, [0, 100], [0.25, 0]);

  // Color keywords dynamically for maximum visual punch
  const getWordColor = (word: string): string => {
    const w = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"]/g,"");
    if (["doctors:", "stop", "wasting", "slow", "hours!"].includes(w)) return "#EF4444"; // Alarm Red
    if (["paid", "chairs", "staff"].includes(w)) return "#F59E0B"; // Gold Amber
    if (["engine", "one:", "vetted", "creators", "vlogs"].includes(w)) return "#06B6D4"; // Cyan
    if (["two:", "script", "edit", "reels", "fifteen"].includes(w)) return "#10B981"; // Emerald
    if (["first", "pilot", "free", "free!"].includes(w)) return "#EC4899"; // Pink Accent
    return "#FFFFFF";
  };

  return (
    <AbsoluteFill style={{ background, fontFamily: '"Outfit", "Inter", sans-serif', overflow: 'hidden' }}>
      
      {/* BACKGROUND MUSIC */}
      <Audio
        src={staticFile(config.bg_music)}
        volume={0.16}
      />

      {/* BACKGROUND RIPPLES */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          width: '180px',
          height: '180px',
          marginLeft: '-90px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.12)',
          transform: `scale(${rippleScale})`,
          opacity: rippleOpacity,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 3D GRAPHICS PANEL */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          width: '100%',
          height: '260px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 8,
          perspective: '1200px',
          pointerEvents: 'none',
        }}
      >
        {config.sentences.map((sent, index) => {
          const isActive = currentTime >= sent.start && currentTime <= sent.end;
          if (!isActive) return null;

          const relFrame = frame - Math.floor(sent.start * fps);
          const graphicScale = spring({
            frame: relFrame,
            fps,
            config: { damping: 10, stiffness: 100 },
          });

          const transform3D = `scale(${graphicScale}) rotateY(${rotY}deg) rotateX(${rotX}deg)`;

          return (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '220px',
                height: '220px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: transform3D,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out',
              }}
            >
              {/* Floor projection shadow */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  width: '140px',
                  height: '18px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  borderRadius: '50%',
                  filter: 'blur(10px)',
                  transform: `scale(${1 + Math.sin(frame * 0.05) * 0.08}) translateZ(-50px)`,
                  opacity: 0.6,
                }}
              />

              {/* SLIDE 1: Wasting Slow Hours (Alarm warning Shield) */}
              {index === 0 && (
                <svg viewBox="0 0 100 100" width="180" height="180" style={{ transformStyle: 'preserve-3d' }}>
                  <path
                    d="M50,15 L82,30 L82,65 C82,80 50,92 50,92 C50,92 18,80 18,65 L18,30 Z"
                    fill="rgba(239, 68, 68, 0.15)"
                    stroke="#EF4444"
                    strokeWidth="6"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                  {/* Glowing 3D alarm exclamation symbol */}
                  <g style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}>
                    <line x1="50" y1="35" x2="50" y2="58" stroke="#FFFFFF" strokeWidth="8.5" strokeLinecap="round" />
                    <circle cx="50" cy="71" r="5.5" fill="#FFFFFF" />
                  </g>
                </svg>
              )}

              {/* SLIDE 2: Standby Payroll cost (Pulsing clock + Indian Rupee dial) */}
              {index === 1 && (
                <svg viewBox="0 0 100 100" width="180" height="180" style={{ transformStyle: 'preserve-3d' }}>
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="rgba(245, 158, 11, 0.18)"
                    stroke="#F59E0B"
                    strokeWidth="6.5"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                  {/* Rupees icon embedded inside clock */}
                  <g style={{ transform: 'translateZ(30px)', stroke: '#FFFFFF', strokeWidth: '5.5', fill: 'none', strokeLinecap: 'round' }}>
                    <path d="M42,38 H58 M42,46 H58 M49,38 C56,38 56,54 49,54 H42 L55,70" />
                  </g>
                  {/* Rotating Clock hand */}
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="24"
                    stroke="#F59E0B"
                    strokeWidth="5"
                    strokeLinecap="round"
                    transform={`rotate(${(frame * 6) % 360} 50 50)`}
                    style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
                  />
                </svg>
              )}

              {/* SLIDE 3: Engine One Vetted Creators (Location locator + camera shutter) */}
              {index === 2 && (
                <svg viewBox="0 0 100 100" width="180" height="180" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Locator Pin at base Z-depth */}
                  <path
                    d="M50,10 C32,10 18,24 18,42 C18,65 50,90 50,90 C50,90 82,65 82,42 C82,24 68,10 50,10 Z"
                    fill="rgba(6, 182, 212, 0.15)"
                    stroke="#06B6D4"
                    strokeWidth="6"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                  {/* Camera icon floating forward */}
                  <g style={{ transform: 'translateZ(45px)', transformStyle: 'preserve-3d' }}>
                    <rect x="35" y="34" width="30" height="20" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="5.5" />
                    <rect x="42" y="29" width="16" height="6" rx="2" fill="#FFFFFF" />
                    <circle cx="50" cy="44" r="5" fill="#06B6D4" />
                  </g>
                </svg>
              )}

              {/* SLIDE 4: Engine Two - 15 Reels (Play board + pencil drawing) */}
              {index === 3 && (
                <svg viewBox="0 0 100 100" width="180" height="180" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Play Board outline */}
                  <path
                    d="M20,25 L80,25 L85,32 L85,75 A5,5 0 0,1 80,80 L20,80 A5,5 0 0,1 15,75 L15,32 Z"
                    fill="rgba(16, 185, 129, 0.18)"
                    stroke="#10B981"
                    strokeWidth="6"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                  <line x1="15" y1="36" x2="85" y2="36" stroke="#10B981" strokeWidth="5.5" style={{ transform: 'translateZ(20px)' }} />
                  {/* Glowing 3D Play symbol floating */}
                  <polygon
                    points="42,44 64,54 42,64"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    filter="drop-shadow(0 0 10px #10B981)"
                    style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
                  />
                </svg>
              )}

              {/* SLIDE 5: Pilot Free (Twinkling Sparkles) */}
              {index === 4 && (
                <svg viewBox="0 0 120 120" width="190" height="190" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Gold Star outline */}
                  <polygon
                    points="60,15 74,48 107,48 80,70 92,103 60,82 28,103 40,70 13,48 46,48"
                    fill="rgba(236, 72, 153, 0.2)"
                    stroke="#EC4899"
                    strokeWidth="6"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                  {/* Glowing 3D Sparkle floating deep forward */}
                  <path
                    d="M60,25 L64,48 L87,52 L64,56 L60,79 L56,56 L33,52 L56,48 Z"
                    fill="#FFFFFF"
                    filter="drop-shadow(0 0 12px #EC4899)"
                    style={{
                      transform: `scale(${0.8 + Math.abs(Math.sin(frame * 0.08)) * 0.3}) translateZ(55px)`,
                      transformStyle: 'preserve-3d',
                    }}
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* DYNAMIC TEXT BADGE & SLANTED HORMOZI SUBTITLES */}
      <AbsoluteFill style={{ zIndex: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 50px' }}>
        
        {config.sentences.map((sent, index) => {
          const isActive = currentTime >= sent.start && currentTime <= sent.end;
          if (!isActive) return null;

          const relFrame = frame - Math.floor(sent.start * fps);

          const cardSpring = spring({
            frame: relFrame,
            fps,
            config: { damping: 13, stiffness: 80 },
          });

          const translateY = interpolate(cardSpring, [0, 1], [380, 0]);
          const isFinalCTA = index === config.sentences.length - 1;

          // Slide 5: Glassmorphic Final CTA Booking Card
          if (isFinalCTA) {
            return (
              <div
                key={index}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `4px solid ${config.brand_colors.primary}`,
                  borderRadius: '45px',
                  padding: '52px 35px',
                  transform: `translateY(${translateY}px)`,
                  boxShadow: `0 35px 80px -10px ${config.brand_colors.primary}88`,
                  textAlign: 'center',
                }}
              >
                {/* SVG Clinically Safe Shield Logo */}
                <div style={{ width: '90px', height: '90px', margin: '0 auto 22px auto' }}>
                  <svg viewBox="0 0 100 100" fill="none" width="100%" height="100%">
                    <path
                      d="M50,12 L82,27 L82,65 C82,80 50,90 50,90 C50,90 18,80 18,65 L18,27 Z"
                      fill="none"
                      stroke={config.brand_colors.primary}
                      strokeWidth="8"
                    />
                    <path d="M36,50 L46,60 L66,38" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: '66px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0',
                    fontFamily: '"Outfit", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '2.5px',
                    lineHeight: '1.1',
                  }}
                >
                  {config.business_name}
                </h2>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '36px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px 32px',
                    borderRadius: '100px',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                >
                  🌐 creatorarmour.com
                </div>
              </div>
            );
          }

          // Slides 1-4: Slanted kinetic subtitles in clean glass cards
          return (
            <div
              key={index}
              style={{
                width: '100%',
                background: 'rgba(5, 5, 12, 0.72)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '45px',
                padding: '48px 25px',
                transform: `translateY(${translateY}px)`,
                boxShadow: '0 32px 75px rgba(0,0,0,0.65)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '22px 18px',
                textAlign: 'center',
              }}
            >
              {sent.words.map((w, wIdx) => {
                const isWordActive = currentTime >= w.start && currentTime <= w.end;
                const wordFrame = frame - Math.floor(w.start * fps);
                const wordScale = isWordActive 
                  ? interpolate(wordFrame, [0, 3], [1, 1.28], { extrapolateRight: 'clamp' })
                  : 1;

                const wordColor = getWordColor(w.word);

                return (
                  <div
                    key={wIdx}
                    style={{
                      display: 'inline-block',
                      transform: `scale(${wordScale}) rotate(${isWordActive ? '-3deg' : '0deg'})`,
                      transition: 'all 0.12s ease-out',
                      background: isWordActive ? `${wordColor}28` : 'transparent',
                      border: isWordActive ? `3.5px solid ${wordColor}` : '3.5px solid transparent',
                      padding: '6px 15px',
                      borderRadius: '22px',
                      boxShadow: isWordActive ? `0 10px 22px -5px ${wordColor}55` : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '76px',
                        fontFamily: '"Impact", "Arial Black", sans-serif',
                        fontWeight: '900',
                        color: isWordActive ? wordColor : '#FFFFFF',
                        display: 'inline-block',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textShadow: '6px 6px 0px #000000',
                      }}
                    >
                      {w.word}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </AbsoluteFill>
      
    </AbsoluteFill>
  );
};
