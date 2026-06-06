import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import React from 'react';

// Import slides directly
import slide1 from './slides/slide_1.png';
import slide2 from './slides/slide_2.png';
import slide3 from './slides/slide_3.png';
import slide4 from './slides/slide_4.png';
import slide5 from './slides/slide_5.png';
import slide6 from './slides/slide_6.png';
import slide7 from './slides/slide_7.png';

const SLIDES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7];
const SLIDE_DURATION = 90; // 90 frames = 3 seconds at 30fps

export const ScalingReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#080C14', fontFamily: 'sans-serif' }}>
      {/* Background radial gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, #0F172A 0%, #080C14 100%)',
        }}
      />

      {SLIDES.map((slide, index) => {
        const startFrame = index * SLIDE_DURATION;
        const endFrame = startFrame + SLIDE_DURATION;
        
        // If current frame is outside this slide range, don't render it
        if (frame < startFrame - 15 || frame >= endFrame + 15) {
          return null;
        }

        // Calculations for slide transitions (slide in from right, exit to left)
        const activeProgress = spring({
          frame: frame - startFrame,
          fps,
          config: { damping: 14, stiffness: 90 },
        });

        const exitProgress = spring({
          frame: frame - endFrame + 15, // exit animation starts 15 frames before slide end
          fps,
          config: { damping: 14, stiffness: 90 },
        });

        // Horizontal translation (Slide-in / Slide-out)
        const translateX = interpolate(
          activeProgress - exitProgress,
          [0, 1],
          [1080, 0]
        ) + interpolate(
          exitProgress,
          [0, 1],
          [0, -1080]
        );

        // Subtle scale zoom-in effect during active state
        const scale = interpolate(
          frame - startFrame,
          [0, SLIDE_DURATION],
          [1.0, 1.05],
          { extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${translateX}px)`,
            }}
          >
            {/* Blurred background panel of the slide */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${slide})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                filter: 'blur(40px)',
                opacity: 0.15,
                transform: 'scale(1.2)',
              }}
            />

            {/* Central 4:5 Slide Card */}
            <div
              style={{
                width: 1080,
                height: 1350,
                boxShadow: '0 30px 100px rgba(0,0,0,0.8)',
                borderRadius: '24px',
                overflow: 'hidden',
                transform: `scale(${scale})`,
                border: '1px solid rgba(255,255,255,0.08)',
                zIndex: 10,
              }}
            >
              <img
                src={slide}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                alt={`Slide ${index + 1}`}
              />
            </div>
          </div>
        );
      })}

      {/* Top Progress Bar Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          right: 60,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          gap: 6,
          zIndex: 100,
        }}
      >
        {SLIDES.map((_, index) => {
          const startFrame = index * SLIDE_DURATION;
          const progress = interpolate(
            frame,
            [startFrame, startFrame + SLIDE_DURATION],
            [0, 100],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#6366F1',
                  borderRadius: 4,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Footer Branding Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(10,15,28,0.7)',
          padding: '12px 24px',
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '1px',
          }}
        >
          AI REACTIVATION
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>•</span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          CREATORARMOUR
        </span>
      </div>
    </AbsoluteFill>
  );
};
