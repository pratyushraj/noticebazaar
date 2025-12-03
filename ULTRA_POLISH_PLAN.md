# Ultra Polish Execution Plan

## Branch: `ultra-polish/20251202/run-1`

## Pre-flight Status
- ✅ Branch created
- ✅ Dependencies installed
- ⚠️ Lint: Some errors in scripts/ (non-critical, will address in Step 5)
- ⚠️ TypeScript: Config issues (non-critical, build succeeds)
- ✅ Build: Succeeds

## Execution Strategy

Given the large codebase, we'll focus on:
1. **Critical UI components** (pages, main components)
2. **High-impact files** (most visible to users)
3. **Systematic replacement** with design-system tokens

## Files to Prioritize

### Step 1: Tokenization (High Priority)
1. `src/pages/MessagesPage.tsx` - Multiple hardcoded rgba, text-[10px], p-3.5
2. `src/pages/CreatorContentProtection.tsx` - Hardcoded colors, spacing
3. `src/pages/CreatorPaymentsAndRecovery.tsx` - Hardcoded values
4. `src/components/creator-dashboard/CreatorBottomNav.tsx` - Hardcoded shadows
5. `src/components/ui/card.tsx` - Hardcoded rgba values

### Step 2: Animations & Haptics
- Components already using motionTokens (mostly done)
- Need to verify all haptic calls use centralized utility

### Step 3: Performance
- Focus on long lists (Messages, Deals, Payments)
- Memoize stable components

### Step 4: Accessibility
- Add aria-labels
- Focus trap for modals
- Skip link

### Step 5: TypeScript
- Focus on src/lib/hooks/* and src/pages/*
- Replace critical `any` types

### Step 6: Backend
- Migration already applied
- Generate down-migration

### Step 7: E2E Tests
- Update/run Playwright tests

### Step 8: Final Build
- Lint fix, build, bundle

### Step 9: QA Report
- Generate comprehensive report

---

**Status:** Starting Step 1 - Tokenization

