# UI Audit Report - NoticeBazaar

**Audit Date:** 2026-03-22  
**Auditor:** UI Audit Agent  
**Files Reviewed:**
- `src/pages/LandingPage.tsx`
- `src/pages/BrandMobileDashboard.tsx`
- `src/pages/DealDetailPage.tsx`
- `src/pages/ContractUploadFlow.tsx`
- `src/components/ui/` (button, card, input, badge, select, dialog, tooltip, avatar, etc.)

---

## Executive Summary

The NoticeBazaar UI has several inconsistencies that affect visual coherence and user experience. While individual components are well-built, there's no unified design system governing spacing, colors, typography, and border radius values. This audit identifies **20 high-priority issues** and provides recommended design system values for standardization.

---

## Top 20 UI Issues

### 1. **Border Radius Inconsistency (Critical)**
**Severity:** 🔴 Critical  
**Impact:** Visual inconsistency across the entire application

**Problem:** Border radius values are scattered across multiple values without a consistent scale:
- Buttons: `rounded-[12px]`, `rounded-[10px]`, `rounded-[14px]`
- Cards: `rounded-[20px]`
- Inputs: `rounded-md` (~6px)
- Badges: `rounded-full`
- Select: `rounded-md` trigger, `rounded-sm` items
- Dialog: `sm:rounded-lg`
- Tooltip: `rounded-md`
- Avatar: `rounded-full`
- LandingPage sections: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-[24px]`, `rounded-[28px]`, `rounded-[32px]`, `rounded-[36px]`, `rounded-[40px]`, `rounded-[48px]`

**Recommendation:** Implement a consistent border radius scale:
```css
/* Recommended Border Radius Scale */
--radius-xs: 4px;   /* Small elements like badges */
--radius-sm: 8px;   /* Buttons, inputs */
--radius-md: 12px;  /* Cards, containers */
--radius-lg: 16px;  /* Large cards, modals */
--radius-xl: 24px;  /* Hero sections, feature blocks */
--radius-full: 9999px; /* Avatars, circular badges */
```

---

### 2. **Focus Ring Inconsistency (High)**
**Severity:** 🟠 High  
**Impact:** Accessibility and keyboard navigation experience

**Problem:** Focus ring implementations vary across components:
- Button: `focus-visible:ring-4` (4px ring)
- Input: `focus-visible:ring-2` (2px ring)
- Badge: `focus:ring-2` (2px ring)
- Select: `focus:ring-2` (2px ring)
- Dialog close: `focus:ring-2`
- Tooltip: No focus ring defined
- Avatar: No focus ring defined

**Recommendation:** Standardize to `focus-visible:ring-2` for all interactive elements:
```css
/* Standardized Focus Ring */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2;
}
```

---

### 3. **Shadow System Inconsistency (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Visual hierarchy and depth perception

**Problem:** Shadow values are arbitrary and inconsistent:
- Cards: `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`, `shadow-[0_2px_20px_rgba(210,198,221,0.25)]`
- Select: `shadow-md`
- Dialog: `shadow-lg`

**Recommendation:** Implement a consistent shadow scale:
```css
/* Recommended Shadow Scale */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);
--shadow-card: 0 8px 30px rgba(0, 0, 0, 0.04);
```

---

### 4. **Spacing Scale Inconsistency (High)**
**Severity:** 🟠 High  
**Impact:** Layout consistency and visual rhythm

**Problem:** Spacing values (padding, margin, gap) are arbitrary:
- Padding: `p-1.5`, `p-4`, `p-5`, `p-6`, `px-3`, `px-4`, `px-5`, `px-8`, `py-1.5`, `py-2`, `py-2.5`, `py-4`
- Gap: `gap-1.5`, `gap-2`, `gap-4`, `gap-8`, `gap-10`, `gap-24`
- Button default: `px-4 py-2`
- Select: `px-3 py-2`

**Recommendation:** Adopt a consistent 4-point spacing scale:
```css
/* Recommended Spacing Scale */
--space-1: 4px;   /* gap-1, p-1 */
--space-2: 8px;   /* gap-2, p-2 */
--space-3: 12px;  /* gap-3, p-3 */
--space-4: 16px;  /* gap-4, p-4 */
--space-5: 20px;  /* gap-5, p-5 */
--space-6: 24px;  /* gap-6, p-6 */
--space-8: 32px;  /* gap-8, p-8 */
--space-10: 40px; /* gap-10, p-10 */
--space-12: 48px; /* gap-12, p-12 */
```

---

### 5. **Typography Scale Inconsistency (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Readability and visual hierarchy

**Problem:** Typography values don't follow a consistent scale:
- Font sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`
- Font weights: `font-medium`, `font-bold`, `font-semibold`, `font-black`

**Recommendation:** Implement a type scale:
```css
/* Recommended Typography Scale */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Font Weight Scale */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

### 6. **Missing Hover States on Some Interactive Elements (High)**
**Severity:** 🟠 High  
**Impact:** User feedback and discoverability

**Problem:** Not all clickable elements have hover states:
- Static buttons in some variants lack hover feedback
- Card components with `interactive` prop have inconsistent hover effects
- Some clickable icons lack hover states

**Recommendation:** Ensure all interactive elements have visible hover states:
```css
/* Example Hover State Implementation */
.interactive-element {
  @apply transition-all duration-200;
}
.interactive-element:hover {
  @apply bg-opacity-90 transform -translate-y-0.5;
}
```

---

### 7. **Color Token Inconsistency (High)**
**Severity:** 🟠 High  
**Impact:** Brand consistency and theming

**Problem:** Colors are used inconsistently:
- Primary pink: `bg-pink-500`, `bg-pink-600`, `text-pink-500`
- Secondary: `bg-secondary`, `text-muted-foreground`
- Overlay: `bg-black/80`, `bg-white/80`
- Destructive: `bg-destructive`

**Recommendation:** Define semantic color tokens:
```css
/* Recommended Color Tokens */
--color-primary: #ec4899;     /* pink-500 */
--color-primary-hover: #db2777; /* pink-600 */
--color-secondary: #6b7280;   /* gray-500 */
--color-background: #ffffff;
--color-foreground: #111827;
--color-muted: #f3f4f6;
--color-destructive: #ef4444;
--color-success: #22c55e;
```

---

### 8. **Button Size Inconsistency (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Touch targets and visual consistency

**Problem:** Button sizes use arbitrary padding values:
- Default: `h-10 px-4 py-2`
- Small: `h-9 px-3`
- Large: `h-11 px-8`
- Icon: `h-10 w-10`

**Recommendation:** Standardize button sizes:
```css
/* Button Sizes */
.btn-sm { @apply h-8 px-3 text-sm; }
.btn-md { @apply h-10 px-4 text-base; }
.btn-lg { @apply h-12 px-6 text-lg; }
.btn-icon { @apply h-10 w-10 p-0; }
```

---

### 9. **Card Component Complexity (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Maintainability and consistency

**Problem:** Card component has too many variants with complex styling:
- 10 variants: primary, secondary, tertiary, default, metric, attention, partner, profile, pink, pink-gradient
- Complex backdrop blur and shadow effects
- Inconsistent padding across variants

**Recommendation:** Simplify to 4-5 core variants with consistent padding:
```tsx
// Simplified Card Variants
type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
```

---

### 10. **Input Component Border Radius Mismatch (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Visual consistency with other form elements

**Problem:** Input uses `rounded-md` while buttons use `rounded-[12px]`:
```tsx
// Current input
className="rounded-md"

// Current button
className="rounded-[12px]"
```

**Recommendation:** Align input border radius with button:
```css
/* Unified border radius for form elements */
input, select, textarea, button {
  @apply rounded-lg; /* 8px */
}
```

---

### 11. **Landing Page Section Spacing Inconsistency (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Visual rhythm and readability

**Problem:** Landing page sections have inconsistent vertical spacing:
- Hero: `pt-32 pb-20`
- Features: `py-16`
- CTA: `py-24`
- Footer: `pt-16`

**Recommendation:** Use consistent section spacing:
```css
/* Section Spacing */
.section { @apply py-16 md:py-24; }
.section-sm { @apply py-12 md:py-16; }
.section-lg { @apply py-24 md:py-32; }
```

---

### 12. **Mobile Dashboard File Size (Low)**
**Severity:** 🟢 Low  
**Impact:** Performance and maintainability

**Problem:** BrandMobileDashboard.tsx is 3991+ lines, ContractUploadFlow.tsx is 6494+ lines:
- Difficult to maintain
- Hard to identify UI patterns
- Performance implications

**Recommendation:** Split into smaller, focused components:
```tsx
// Proposed structure
components/
  dashboard/
    DashboardHeader.tsx
    DashboardStats.tsx
    DashboardList.tsx
    DashboardFilters.tsx
```

---

### 13. **Badge Component Border Radius (Low)**
**Severity:** 🟢 Low  
**Impact:** Visual consistency

**Problem:** Badge always uses `rounded-full`, which may not fit all use cases:
```tsx
// Current badge
className="rounded-full"
```

**Recommendation:** Add border radius variants:
```tsx
// Badge variants
type BadgeRadius = 'full' | 'md' | 'lg';
```

---

### 14. **Missing Active States (Medium)**
**Severity:** 🟡 Medium  
**Impact:** User feedback

**Problem:** Some buttons have `active:scale-[0.97]` but not all interactive elements:
```tsx
// Button has active state
className="active:scale-[0.97]"

// Card interactive lacks active state
```

**Recommendation:** Add active states to all interactive elements:
```css
.interactive:active {
  @apply scale-[0.98];
}
```

---

### 15. **Transition Duration Inconsistency (Low)**
**Severity:** 🟢 Low  
**Impact:** Animation consistency

**Problem:** Transition durations vary:
- Some elements: `duration-150`
- Others: `duration-200`
- Buttons: `duration-300`

**Recommendation:** Standardize transition durations:
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

---

### 16. **Gradient Usage Inconsistency (Low)**
**Severity:** 🟢 Low  
**Impact:** Brand consistency

**Problem:** Gradient directions and colors vary:
- `bg-gradient-to-r from-pink-500 to-rose-500`
- `bg-gradient-to-r from-purple-600 to-pink-600`
- Various angle-specific gradients

**Recommendation:** Define standard gradient tokens:
```css
--gradient-primary: linear-gradient(to right, #ec4899, #f43f5e);
--gradient-secondary: linear-gradient(to right, #9333ea, #ec4899);
```

---

### 17. **Z-Index Scale Inconsistency (Low)**
**Severity:** 🟢 Low  
**Impact:** Layering consistency

**Problem:** Z-index values are arbitrary:
- Tooltip: `z-50`
- Dialog: `z-50`
- Modals: Various values

**Recommendation:** Implement z-index scale:
```css
--z-dropdown: 10;
--z-sticky: 20;
--z-modal: 30;
--z-popover: 40;
--z-tooltip: 50;
--z-toast: 60;
```

---

### 18. **Disabled State Styling (Medium)**
**Severity:** 🟡 Medium  
**Impact:** Accessibility

**Problem:** Disabled states are inconsistent:
```tsx
// Some buttons
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Others lack disabled states
```

**Recommendation:** Standardize disabled states:
```css
.disabled {
  @apply opacity-50 cursor-not-allowed pointer-events-none;
}
```

---

### 19. **Font Family Declaration (Low)**
**Severity:** 🟢 Low  
**Impact:** Typography consistency

**Problem:** Font family uses Inter but implementation varies:
```css
font-family: Inter, system-ui, sans-serif;
```

**Recommendation:** Define font tokens:
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

---

### 20. **Line Height Inconsistency (Low)**
**Severity:** 🟢 Low  
**Impact:** Readability

**Problem:** Line heights are implicit and vary across text sizes.

**Recommendation:** Define line height scale:
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## Inconsistencies Summary

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Border Radius | 10+ different values | 🔴 Critical |
| Focus States | 6 different implementations | 🟠 High |
| Spacing | 15+ different values | 🟠 High |
| Colors | Inconsistent token usage | 🟠 High |
| Typography | 9 sizes, 4 weights | 🟡 Medium |
| Shadows | 5+ different values | 🟡 Medium |
| Hover States | Missing on some elements | 🟠 High |
| Active States | Missing on some elements | 🟡 Medium |
| Transitions | 3 different durations | 🟢 Low |

---

## Recommended Design System Values

### Colors
```css
:root {
  /* Brand Colors */
  --color-primary: #ec4899;      /* pink-500 */
  --color-primary-hover: #db2777; /* pink-600 */
  --color-primary-light: #fce7f3; /* pink-100 */
  
  /* Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Neutral Colors */
  --color-background: #ffffff;
  --color-foreground: #111827;
  --color-muted: #f3f4f6;
  --color-muted-foreground: #6b7280;
  --color-border: #e5e7eb;
}
```

### Spacing
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
}
```

### Typography
```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Border Radius
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-2xl: 1.5rem;  /* 24px */
  --radius-full: 9999px;
}
```

### Shadows
```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.12);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

---

## Priority Fixes

### P0 (Immediate - Critical)
1. **Standardize border radius scale** - Affects entire UI
2. **Implement consistent focus rings** - Accessibility impact

### P1 (This Sprint - High)
3. **Create spacing scale** - Layout consistency
4. **Define color tokens** - Brand consistency
5. **Add missing hover states** - User feedback

### P2 (Next Sprint - Medium)
6. **Standardize typography scale** - Readability
7. **Simplify card variants** - Maintainability
8. **Align input/button border radius** - Visual consistency
9. **Add missing active states** - User feedback
10. **Standardize disabled states** - Accessibility

### P3 (Backlog - Low)
11. **Standardize transitions** - Animation consistency
12. **Define z-index scale** - Layering
13. **Create gradient tokens** - Brand consistency
14. **Split large components** - Maintainability

---

## Code Snippets for Improvements

### 1. Tailwind Config Update
```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
    },
  },
}
```

### 2. CSS Variables
```css
/* src/index.css */
@layer base {
  :root {
    /* Colors */
    --color-primary: #ec4899;
    --color-primary-hover: #db2777;
    --color-primary-light: #fce7f3;
    
    /* Spacing */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 24px;
    
    /* Shadows */
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
}
```

### 3. Button Component Update
```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)
```

### 4. Input Component Update
```tsx
// src/components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "placeholder:text-gray-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 5. Card Component Simplification
```tsx
// src/components/ui/card.tsx
const cardVariants = cva(
  "rounded-2xl bg-white transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-gray-200 shadow-sm",
        elevated: "shadow-lg",
        outlined: "border-2 border-gray-300",
        filled: "bg-gray-50",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
)
```

---

## Next Steps

1. **Create Design Tokens File** - Implement CSS variables in `src/styles/tokens.css`
2. **Update Tailwind Config** - Map tokens to Tailwind theme
3. **Refactor Components** - Update button, input, card to use new tokens
4. **Create Component Library** - Document design system in Storybook
5. **Add Lint Rules** - Enforce consistent spacing/border-radius values

---

## Conclusion

The NoticeBazaar UI has solid foundations but lacks a unified design system. Implementing the recommended changes will improve:
- **Visual consistency** across all pages
- **Accessibility** for keyboard navigation
- **Maintainability** with standardized tokens
- **Developer experience** with clear patterns to follow

Priority should be given to P0 and P1 fixes to address critical inconsistencies and accessibility issues.
