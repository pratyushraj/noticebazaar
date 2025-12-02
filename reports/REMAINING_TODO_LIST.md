# Remaining TODO List

**Date:** 2025-01-27  
**Status:** Active

---

## High Priority (Complete First)

### 1. Continue Page Refactoring

**Pages to Refactor:**
- [ ] `CreatorDashboard.tsx` - Main dashboard (highest traffic)
- [ ] `CreatorPaymentsAndRecovery.tsx` - Payments page
- [ ] `CreatorContentProtection.tsx` - Protection page
- [ ] `DealDetailPage.tsx` - Deal detail page
- [ ] `CalendarPage.tsx` - Calendar page
- [ ] `MessagesPage.tsx` - Messages page
- [ ] All other creator pages

**Tasks per Page:**
- [ ] Integrate `CreatorNavigationWrapper`
- [ ] Replace hardcoded values with design system tokens
- [ ] Add `ErrorBoundary`
- [ ] Add `SkeletonCard` for loading states
- [ ] Use centralized haptic utility
- [ ] Ensure consistent spacing and typography

---

### 2. Design System Enforcement

**Tasks:**
- [ ] Run repo-wide search for hardcoded values:
  - `px-\d+`, `py-\d+`, `p-\d+`, `m-\d+`
  - `text-\[`, `rounded-\[`, `shadow-\[`
  - `w-\[`, `h-\[`, `mt-\[`, `mb-\[`
  - Hex colors `#...`
  - Inline styles
- [ ] Replace systematically
- [ ] Add missing tokens if needed
- [ ] Create ESLint rules to prevent hardcoded values

---

### 3. Mobile Responsiveness Hardening

**Test Breakpoints:**
- [ ] 320px
- [ ] 360px
- [ ] 375px
- [ ] 390px
- [ ] 414px
- [ ] 428px

**Fix Issues:**
- [ ] overflow-x issues
- [ ] Clipped icons
- [ ] Truncated text
- [ ] Safe-area-inset bottom padding
- [ ] Drawer gesture conflicts
- [ ] Scroll bounce problems

---

## Medium Priority

### 4. Error & Skeleton Coverage

**Tasks:**
- [ ] Add `ErrorBoundary` to all pages
- [ ] Add `SkeletonCard` to all loading states
- [ ] Ensure no blank screens before data loads
- [ ] Unified toast system
- [ ] Error handling for network loss
- [ ] Error handling for permission issues
- [ ] Error handling for missing data

---

### 5. Micro-interactions Audit

**Tasks:**
- [ ] Add haptics to all interactive elements
- [ ] Ensure `active:scale-[0.97]` on all buttons
- [ ] Ensure `transition-all duration-150` on all interactive elements
- [ ] Add hover effects only on desktop (>768px)
- [ ] Normalize framer-motion animations
- [ ] Add elastic spring animations where appropriate

---

### 6. RLS Policy Enforcement

**Tasks:**
- [ ] Finalize RLS system for all tables
- [ ] Generate consolidated RLS migration file
- [ ] Validate all policies
- [ ] Test RLS policies
- [ ] Document RLS policies

---

## Low Priority

### 7. Final Production-Polish Pass

**Tasks:**
- [ ] Frosted glass gradients
- [ ] 1px semi-transparent inner borders
- [ ] Parallax effects in drawer header
- [ ] Sharper shadows with iOS-style spread
- [ ] Smoother overscroll
- [ ] Improve depth layering (z-index, blur, shadow consistency)
- [ ] Subtle spotlight for active cards
- [ ] Premium modal transitions
- [ ] Refine card padding + internal spacing

---

### 8. Cleanup & Validation

**Tasks:**
- [ ] Remove unused imports
- [ ] Remove dead code
- [ ] Fix TypeScript strict errors
- [ ] Ensure no `any` types in critical files
- [ ] Run repo-wide search and replace hardcoded values
- [ ] Remove commented-out code blocks
- [ ] Normalize import order

---

### 9. Generate Reports

**Reports to Generate:**
- [x] FINAL_REFACTOR_SUMMARY.md
- [x] NAVIGATION_CONSISTENCY_REPORT.md
- [x] DESIGN_SYSTEM_ENFORCEMENT_REPORT.md
- [ ] COMPONENTIZATION_REPORT.md
- [ ] RESPONSIVENESS_AUDIT.md
- [ ] ERROR_AND_SKELETON_AUDIT.md
- [ ] MICRO_INTERACTIONS_AUDIT.md
- [ ] RLS_FINAL_POLICY_PACK.sql
- [ ] UI_POLISH_FINAL.md
- [x] REMAINING_TODO_LIST.md

---

## Notes

- Work incrementally in small commits
- Do NOT break working screens
- When a missing token is needed, create it
- Prefer extracting components over rewriting code
- Use framer-motion for all animated elements
- All new components must be mobile-first
- After each batch of changes, run TypeScript check, ESLint, and fix issues

---

**Last Updated:** 2025-01-27

