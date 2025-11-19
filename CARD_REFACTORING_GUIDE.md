# Dashboard Card System Refactoring Guide

## Overview
This guide documents the standardized card design system that all dashboard cards must follow.

## Base Card Component (`src/components/ui/card.tsx`)

The base `Card` component now includes:

### Props:
- `variant`: "default" | "metric" | "attention" | "partner" | "profile"
- `interactive`: boolean (enables hover/active states)

### Standard Styles:
- **Container**: `rounded-2xl bg-[#0A0F1A]/70 border border-white/5 shadow-[0_0_20px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md`
- **Padding**: `px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6`
- **Interactive**: `hover:bg-white/10 active:scale-[0.98] transition-all duration-200`

### Variants:
- **default**: Base card style
- **metric**: Adds `bg-gradient-to-br from-white/5 to-white/0`
- **attention**: Red alert style with inner glow
- **partner**: Purple gradient for partner program
- **profile**: Profile-specific styling

## Typography Standards:

### Card Titles:
```tsx
<CardTitle>Title Text</CardTitle>
// Applies: text-sm font-semibold text-white/70
```

### Primary Numbers (₹ values, large counts):
```tsx
<div className="text-3xl font-bold text-white">₹73,754</div>
```

### Secondary Values:
```tsx
<div className="text-base text-white/60">Secondary info</div>
```

### Footnotes:
```tsx
<p className="text-xs text-white/40">Footnote text</p>
```

## Icon Container Standard:
```tsx
<div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5">
  <Icon className="h-5 w-5 text-white/80" />
</div>
```

## Migration Pattern:

### Before:
```tsx
<Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-white/5 rounded-2xl px-5 py-4">
  <CardContent className="p-6">
    <h2 className="text-lg font-bold text-white">Title</h2>
  </CardContent>
</Card>
```

### After:
```tsx
<Card variant="metric">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Files That Need Updating:

1. ✅ `src/components/ui/card.tsx` - Base component updated
2. ✅ `src/components/creator-dashboard/HeroEarningsCard.tsx` - Updated
3. ✅ `src/components/creator-dashboard/WeeklyPerformance.tsx` - Updated
4. ✅ `src/components/creator-dashboard/CombinedPaymentsCard.tsx` - Updated
5. ✅ `src/components/creator-dashboard/MoneyOverview.tsx` - Updated
6. ✅ `src/components/creator-dashboard/CriticalActions.tsx` - Updated
7. ⏳ All other creator-dashboard/*.tsx files
8. ⏳ All payments/*.tsx files
9. ⏳ Partner program files
10. ⏳ Profile pages

## Checklist for Each Card:

- [ ] Replace custom Card className with `variant` prop
- [ ] Remove custom padding (handled by base Card)
- [ ] Update CardTitle to use standardized component
- [ ] Update typography to match standards
- [ ] Wrap icons in standard container
- [ ] Update CardContent (no custom padding needed)
- [ ] Add `interactive` prop if card is clickable
- [ ] Test mobile responsiveness

