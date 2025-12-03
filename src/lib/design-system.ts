/**
 * NoticeBazaar Design System
 * 
 * Consistent design tokens for premium UI across all dashboard pages
 */

// ============================================
// CARD VARIANTS
// ============================================

export const cardVariants = {
  primary: {
    base: "bg-gradient-to-br from-[#1E263A] via-[#182133] to-[#121722] border border-white/10",
    padding: "p-6",
    radius: "rounded-2xl",
    shadow: "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
    backdrop: "backdrop-blur-xl",
  },
  secondary: {
    base: "bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-purple-600/20 border border-white/15 relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:rounded-[28px] before:pointer-events-none",
    padding: "p-5",
    radius: "rounded-[28px]",
    shadow: "shadow-lg shadow-black/10",
    backdrop: "backdrop-blur-xl",
  },
  tertiary: {
    base: "bg-white/5 border border-white/10",
    padding: "p-4",
    radius: "rounded-2xl",
    shadow: "shadow-lg shadow-black/20",
    backdrop: "backdrop-blur-xl",
  },
} as const;

export const getCardClasses = (variant: keyof typeof cardVariants = 'tertiary') => {
  const variantStyles = cardVariants[variant];
  return `${variantStyles.base} ${variantStyles.padding} ${variantStyles.radius} ${variantStyles.shadow} ${variantStyles.backdrop}`;
};

// ============================================
// SPACING HIERARCHY
// ============================================

export const spacing = {
  section: "space-y-6", // 24px between major sections
  card: "space-y-4", // 16px inside cards
  compact: "space-y-2", // 8px for tight spacing
  loose: "space-y-8", // 32px for loose spacing
  page: "p-4 md:p-6", // Page padding
  cardPadding: {
    primary: "p-6",
    secondary: "p-5",
    tertiary: "p-4",
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  h1: "text-2xl md:text-3xl font-bold text-white",
  h2: "text-xl md:text-2xl font-semibold text-white",
  h3: "text-lg md:text-xl font-semibold text-white",
  h4: "text-base md:text-lg font-semibold text-white",
  body: "text-sm md:text-base text-white/80",
  bodySmall: "text-xs md:text-sm text-white/70",
  label: "text-xs font-medium text-white/60 uppercase tracking-wider",
  caption: "text-xs text-white/50",
  amount: "text-2xl md:text-3xl font-bold tabular-nums",
  amountSmall: "text-lg md:text-xl font-semibold tabular-nums",
} as const;

// ============================================
// SECTION LAYOUT
// ============================================

export const sectionLayout = {
  container: "space-y-6 p-4 md:p-6 pb-24",
  header: "mb-6",
  grid: {
    two: "grid grid-cols-1 md:grid-cols-2 gap-6",
    three: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    four: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  },
} as const;

// ============================================
// MOBILE RESPONSIVE (320-425px)
// ============================================

export const mobile = {
  padding: "px-3 py-4", // Reduced padding for small screens
  text: {
    h1: "text-xl", // Smaller on mobile
    h2: "text-lg",
    h3: "text-base",
    body: "text-sm",
  },
  spacing: {
    section: "space-y-4", // Tighter spacing on mobile
    card: "space-y-3",
  },
  touchTarget: "min-h-[44px] min-w-[44px]", // iOS minimum touch target
} as const;

// ============================================
// ANIMATIONS & INTERACTIONS (iOS 17 + visionOS)
// ============================================

export const animations = {
  cardHover: "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl",
  cardPress: "active:scale-[0.98] transition-all duration-150",
  fadeIn: "animate-fadeIn",
  stagger: {
    delay1: "stagger-1",
    delay2: "stagger-2",
    delay3: "stagger-3",
  },
  // iOS 17 elastic spring
  spring: {
    type: "spring",
    damping: 18,
    stiffness: 200,
    mass: 0.7,
  },
  // Micro-interactions
  microTap: {
    scale: 0.97,
    transition: { duration: 0.12, ease: "easeOut" },
  },
  microHover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: "easeOut" },
  },
} as const;

// ============================================
// SPOTLIGHT GRADIENTS
// ============================================

export const spotlight = {
  top: "absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none",
  bottom: "absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/10 to-transparent pointer-events-none",
  center: "absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent pointer-events-none",
} as const;

// ============================================
// BUTTONS
// ============================================

export const buttons = {
  primary: "bg-gradient-to-r from-[#6C4BFF] to-[#9A3DFF] text-white font-semibold rounded-xl py-3 px-6 shadow-lg shadow-purple-500/20 active:scale-[0.97] transition-all",
  secondary: "bg-white/5 border border-white/10 text-white/70 hover:text-white/90 rounded-xl py-3 px-4 transition-all",
  tertiary: "text-white/60 hover:text-white/90 transition-colors",
  icon: "p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95",
} as const;

// ============================================
// BADGES & PILLS
// ============================================

export const badges = {
  success: "bg-green-500/20 text-green-400 border border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  danger: "bg-red-500/20 text-red-400 border border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  neutral: "bg-white/5 text-white/70 border border-white/10",
} as const;

// ============================================
// GLASSMORPHISM (iOS 17 + visionOS)
// ============================================

export const glass = {
  base: "bg-white/5 backdrop-blur-xl border border-white/10",
  strong: "bg-white/10 backdrop-blur-2xl border border-white/15",
  subtle: "bg-white/3 backdrop-blur-lg border border-white/5",
  // Apple-grade frosted glass
  apple: "bg-white/5 backdrop-blur-2xl border border-white/10",
  appleStrong: "bg-white/10 backdrop-blur-2xl border border-white/15",
  appleSubtle: "bg-black/5 backdrop-blur-xl border border-white/5",
  // Inner borders for depth
  withInner: "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
} as const;

// ============================================
// GRADIENT BACKGROUNDS
// ============================================

export const gradients = {
  page: "bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900",
  card: "bg-gradient-to-br from-[#11121A] via-[#171822] to-[#12131A]",
  primary: "bg-gradient-to-r from-[#6C4BFF] to-[#9A3DFF]",
  secondary: "bg-gradient-to-r from-blue-500 to-purple-600",
} as const;

// ============================================
// SEPARATORS
// ============================================

export const separators = {
  section: "h-[1px] w-full bg-white/5 my-6",
  card: "h-[1px] w-full bg-white/10 my-4",
  subtle: "h-[1px] w-full bg-white/3 my-3",
} as const;

// ============================================
// ICON SIZES
// ============================================

export const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

// ============================================
// SCROLL BEHAVIOR
// ============================================

export const scroll = {
  container: "overflow-y-auto overscroll-behavior-contain",
  smooth: "scroll-smooth",
} as const;

// ============================================
// SECTION HEADERS
// ============================================

export const sectionHeader = {
  base: "flex items-center justify-between mb-4 md:mb-5",
  title: "font-semibold text-[17px] md:text-[20px]",
  action: "text-sm text-purple-300 hover:text-white transition-colors",
} as const;

// ============================================
// RADIUS TOKENS
// ============================================

export const radius = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
} as const;

// ============================================
// SHADOW TOKENS (visionOS-like depth)
// ============================================

export const shadows = {
  sm: "shadow-sm shadow-black/10",
  md: "shadow-md shadow-black/20",
  lg: "shadow-lg shadow-black/20",
  xl: "shadow-xl shadow-black/30",
  card: "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
  drawer: "shadow-[0_0_50px_rgba(0,0,0,0.4)]",
  inner: "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
  // visionOS-like depth shadows
  depth: "shadow-[0_0_50px_-10px_rgba(0,0,0,0.45)]",
  depthStrong: "shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)]",
  depthSubtle: "shadow-[0_0_30px_-5px_rgba(0,0,0,0.3)]",
  // Vision Pro depth system
  vision: "shadow-[0_0_60px_rgba(0,0,0,0.45)]",
} as const;

// ============================================
// VISIONOS TOKENS (Vision Pro depth system)
// ============================================

export const vision = {
  spotlight: {
    base: "absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none",
    hover: "absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300",
  },
  glare: {
    soft: "absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent pointer-events-none",
  },
  depth: {
    elevation: "shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-[30px] bg-[rgba(255,255,255,0.08)]",
  },
} as const;

// ============================================
// iOS 17 GLASS TOKENS
// ============================================

export const ios = {
  glass: {
    bg: "bg-[rgba(255,255,255,0.08)]",
    border: "border border-white/10",
    shadow: "shadow-[0_0_60px_rgba(0,0,0,0.45)]",
    full: "bg-[rgba(255,255,255,0.08)] backdrop-blur-[30px] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.45)]",
  },
} as const;

// ============================================
// MOTION TOKENS (Framer Motion presets)
// ============================================

export const motion = {
  spring: {
    // iOS 17 spec: stiffness: 220, damping: 28, mass: 0.9
    ios17: {
      type: "spring" as const,
      stiffness: 220,
      damping: 28,
      mass: 0.9,
    },
    elastic: {
      type: "spring" as const,
      damping: 18,
      stiffness: 200,
      mass: 0.7,
    },
    gentle: {
      type: "spring" as const,
      damping: 25,
      stiffness: 150,
      mass: 0.8,
    },
  },
  fade: {
    in: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, ease: "easeOut" },
    },
    out: {
      initial: { opacity: 1 },
      animate: { opacity: 0 },
      transition: { duration: 0.2, ease: "easeIn" },
    },
  },
  slide: {
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: animations.spring,
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: animations.spring,
    },
  },
} as const;

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  text: {
    primary: "text-white",
    secondary: "text-white/80",
    tertiary: "text-white/70",
    muted: "text-white/60",
    disabled: "text-white/50",
  },
  bg: {
    primary: "bg-white/5",
    secondary: "bg-white/10",
    tertiary: "bg-white/3",
    overlay: "bg-black/40",
  },
  border: {
    primary: "border-white/10",
    secondary: "border-white/5",
    tertiary: "border-white/3",
  },
} as const;

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  base: "z-0",
  dropdown: "z-10",
  sticky: "z-20",
  overlay: "z-40",
  modal: "z-50",
  drawer: "z-[9999]",
  toast: "z-[10000]",
} as const;

