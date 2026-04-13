'use client';

/**
 * ThreeDIllustration — Lightweight CSS 3D SVG illustrations
 * Zero dependencies · Lazy loaded · Decorative only
 *
 * Uses CSS perspective + transforms for 3D effect.
 * SVG gradients + backdrop-filter for glass/plastic material.
 */

import React, { Suspense, lazy } from 'react';

// ─── Shared Styles ───────────────────────────────────────────────────────────

const floatKeyframes = `
  @keyframes float3d {
    0%, 100% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); }
    50%       { transform: translateY(-12px) rotateX(-1deg) rotateY(2deg); }
  }
  @keyframes shimmer {
    0%   { opacity: 0.4; }
    50%  { opacity: 0.9; }
    100% { opacity: 0.4; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.3); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .float-animate { animation-play-state: paused; }
  }
`;

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  perspective: '800px',
  userSelect: 'none',
  pointerEvents: 'none',
};

// ─── EMPTY STATE: Floating 3D box + sparkle ─────────────────────────────────

function EmptyDealsSVG({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 80 : size === 'md' ? 120 : 160;
  const face = s * 0.85;
  const depth = s * 0.35;

  return (
    <div style={{ ...wrapperStyle, width: s * 1.6, height: s * 1.4 }}>
      <style>{floatKeyframes}</style>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', animation: 'float3d 4s ease-in-out infinite' }} className="float-animate">
        {/* Front face */}
        <div style={{
          position: 'absolute',
          width: face,
          height: face * 0.75,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 32px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
          transform: 'translateZ(0px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 6,
        }}>
          {/* Empty box icon */}
          <svg width={face * 0.4} height={face * 0.4} viewBox="0 0 40 40" fill="none">
            <rect x="4" y="8" width="32" height="24" rx="3" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M14 16h12M20 13v6" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: size === 'sm' ? 7 : size === 'md' ? 9 : 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            No deals yet
          </span>
        </div>

        {/* Top face */}
        <div style={{
          position: 'absolute',
          width: face,
          height: depth,
          borderRadius: '10px 10px 0 0',
          background: 'linear-gradient(180deg, rgba(139,92,246,0.2), rgba(59,130,246,0.12))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
          transform: `rotateX(-70deg) translateZ(${face * 0.37}px) translateY(-${depth}px)`,
          transformOrigin: 'bottom center',
        }} />

        {/* Right face */}
        <div style={{
          position: 'absolute',
          width: depth,
          height: face * 0.75,
          borderRadius: '0 10px 10px 0',
          background: 'linear-gradient(270deg, rgba(59,130,246,0.18), rgba(99,102,241,0.1))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: 'none',
          transform: `rotateY(70deg) translateZ(${face * 0.43}px) translateX(${depth}px)`,
          transformOrigin: 'left center',
        }} />

        {/* Sparkle */}
        <div style={{
          position: 'absolute',
          top: -8,
          right: -4,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.6)',
          boxShadow: '0 0 12px 4px rgba(251,191,36,0.3)',
          animation: 'shimmer 2.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// ─── SUCCESS STATE: Floating 3D checkmark badge ───────────────────────────────

function SuccessBadgeSVG({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 72 : size === 'md' ? 108 : 144;
  const r = s / 2;

  return (
    <div style={{ ...wrapperStyle, width: s * 1.7, height: s * 1.7 }}>
      <style>{floatKeyframes}</style>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', animation: 'float3d 4.5s ease-in-out infinite 0.5s' }} className="float-animate">

        {/* Glow ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: s * 0.9, height: s * 0.9,
          borderRadius: '50%',
          border: '2px solid rgba(16,185,129,0.25)',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-ring 2.5s ease-out infinite',
        }} />

        {/* Back plate */}
        <div style={{
          position: 'absolute',
          width: s, height: s,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.12))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          boxShadow: '0 12px 40px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
          transform: 'translateZ(-8px)',
        }} />

        {/* Front face */}
        <div style={{
          position: 'absolute',
          width: s, height: s,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(6,182,212,0.15) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
          transform: 'translateZ(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Checkmark */}
          <svg width={s * 0.5} height={s * 0.5} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5"/>
            <path d="M12 20.5l5.5 5.5 10.5-11" stroke="rgba(52,211,153,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS: Payment done ────────────────────────────────────────────────────

function SuccessPaymentSVG({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 72 : size === 'md' ? 108 : 144;

  return (
    <div style={{ ...wrapperStyle, width: s * 1.6, height: s * 1.4 }}>
      <style>{floatKeyframes}</style>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', animation: 'float3d 5s ease-in-out infinite 1s' }} className="float-animate">

        {/* Card */}
        <div style={{
          position: 'absolute',
          width: s * 0.9, height: s * 0.58,
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.35)',
          transform: 'translateZ(6px) rotateX(-5deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ width: s * 0.3, height: 6, borderRadius: 3, background: 'rgba(16,185,129,0.4)' }} />
          <div style={{ width: s * 0.2, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          <svg width={s * 0.18} height={s * 0.12} viewBox="0 0 24 16" fill="none">
            <path d="M9 6L11.5 10.5L15 6" stroke="rgba(52,211,153,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Coin sparkle */}
        <div style={{
          position: 'absolute',
          top: -6, right: s * 0.1,
          width: 14, height: 14,
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.7)',
          boxShadow: '0 0 10px 3px rgba(251,191,36,0.3)',
          animation: 'shimmer 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// ─── HERO: Floating 3D geometric composition ──────────────────────────────────

function HeroSVG({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 120 : size === 'md' ? 200 : 280;

  return (
    <div style={{ ...wrapperStyle, width: s * 1.5, height: s * 1.2 }}>
      <style>{floatKeyframes}</style>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', animation: 'float3d 6s ease-in-out infinite' }} className="float-animate">

        {/* Large backdrop disc */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: s * 0.9, height: s * 0.9,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%) translateZ(-10px)',
        }} />

        {/* Floating card 1 */}
        <div style={{
          position: 'absolute',
          width: s * 0.38, height: s * 0.28,
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.12))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 24px rgba(59,130,246,0.15)',
          transform: 'translateZ(14px) translateX(-30%) translateY(-20%) rotateX(-8deg) rotateY(6deg)',
        }}>
          <div style={{ padding: '20% 24%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: '70%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        {/* Floating card 2 */}
        <div style={{
          position: 'absolute',
          width: s * 0.32, height: s * 0.24,
          borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,182,212,0.1))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 6px 20px rgba(16,185,129,0.12)',
          transform: 'translateZ(22px) translateX(25%) translateY(15%) rotateX(5deg) rotateY(-8deg)',
        }}>
          <div style={{ padding: '18% 22%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(16,185,129,0.4)' }} />
            <div style={{ width: '55%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        {/* Central orb */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: s * 0.22, height: s * 0.22,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(168,85,247,0.5), rgba(59,130,246,0.3))',
          boxShadow: '0 0 30px 8px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
          transform: 'translate(-50%, -50%) translateZ(6px)',
        }} />

        {/* Sparkle 1 */}
        <div style={{
          position: 'absolute',
          top: '15%', right: '18%',
          width: 10, height: 10, borderRadius: '50%',
          background: 'rgba(251,191,36,0.6)',
          boxShadow: '0 0 10px 3px rgba(251,191,36,0.3)',
          animation: 'shimmer 2s ease-in-out infinite',
        }} />

        {/* Sparkle 2 */}
        <div style={{
          position: 'absolute',
          bottom: '22%', left: '12%',
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(52,211,153,0.6)',
          boxShadow: '0 0 8px 2px rgba(52,211,153,0.3)',
          animation: 'shimmer 2.8s ease-in-out infinite 1s',
        }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export type ThreeDIllustrationType = 'empty' | 'success' | 'success-payment' | 'hero';
export type ThreeDIllustrationSize = 'sm' | 'md' | 'lg';

interface ThreeDIllustrationProps {
  type?: ThreeDIllustrationType;
  size?: ThreeDIllustrationSize;
  className?: string;
  style?: React.CSSProperties;
}

function IllustrationContent({ type, size }: { type: ThreeDIllustrationType; size: ThreeDIllustrationSize }) {
  switch (type) {
    case 'empty':
      return <EmptyDealsSVG size={size} />;
    case 'success':
      return <SuccessBadgeSVG size={size} />;
    case 'success-payment':
      return <SuccessPaymentSVG size={size} />;
    case 'hero':
    default:
      return <HeroSVG size={size} />;
  }
}

export default function ThreeDIllustration({
  type = 'hero',
  size = 'md',
  className,
  style,
}: ThreeDIllustrationProps) {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IllustrationContent type={type} size={size} />
    </div>
  );
}

// ─── Lazy export ──────────────────────────────────────────────────────────────
// Use React.lazy for code splitting when importing this component
// import { lazy } from 'react';
// export const LazyThreeDIllustration = lazy(() => import('./ThreeDIllustration'));
