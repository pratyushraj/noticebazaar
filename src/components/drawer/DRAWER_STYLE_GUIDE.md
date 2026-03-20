# Premium Drawer UI - Style Guide

## Design Tokens

### Colors

```typescript
const DRAWER_COLORS = {
  // Background
  background: {
    gradient: 'from-[#2b1044] via-[#2a0f45] to-[#1f0b34]',
    surface: 'bg-black/30',
  },
  
  // Borders
  border: {
    default: 'border-white/6',
    active: 'border-white/10',
  },
  
  // Text
  text: {
    primary: 'text-white',
    muted: 'text-white/60',
    label: 'text-white/40',
  },
  
  // Accent
  accent: {
    primary: '#6f4cff',
    gradient: 'linear-gradient(90deg,#7b5cff,#5fd4ff)',
    active: 'from-[#7b5cff] to-[#5fd4ff]',
  },
  
  // Danger
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    border: 'border-red-500/20',
  },
  
  // Badges
  badge: {
    default: 'bg-red-500',
    active: 'bg-white/20',
  },
};
```

### Spacing

```typescript
const DRAWER_SPACING = {
  drawerPadding: {
    vertical: 'pt-[18px] pb-[18px]',
    horizontal: 'px-4',
  },
  itemGap: 'gap-3',        // 12px
  sectionGap: 'mb-6',      // 24px
  itemSpacing: 'space-y-3', // 12px between items
};
```

### Typography

```typescript
const DRAWER_TYPOGRAPHY = {
  userName: {
    size: 'text-base',      // 16px
    weight: 'font-semibold',
    lineHeight: 'leading-tight',
  },
  userHandle: {
    size: 'text-[13px]',    // 13px
    weight: 'font-normal',
    lineHeight: 'leading-tight',
  },
  sectionLabel: {
    size: 'text-xs',        // 12px
    weight: 'font-medium',
    tracking: 'tracking-wider',
    transform: 'uppercase',
  },
  itemLabel: {
    size: 'text-sm',        // 14px
    weight: 'font-medium',
  },
};
```

### Radii

```typescript
const DRAWER_RADII = {
  drawer: 'rounded-r-[24px]',  // 24px right corners
  item: 'rounded-xl',         // 12px
  badge: 'rounded-full',      // Full circle
  avatar: 'rounded-full',     // Full circle
};
```

### Sizes

```typescript
const DRAWER_SIZES = {
  avatar: {
    width: 'w-12',          // 48px
    height: 'h-12',          // 48px
  },
  item: {
    height: 'h-12',         // 48px (default)
    quickAction: 'h-14',    // 56px (quick actions)
  },
  icon: {
    default: 'w-5 h-5',     // 20px
  },
  badge: {
    size: 'w-6 h-6',        // 24px
  },
  activeIndicator: {
    width: 'w-1',           // 4px
    height: 'h-8',          // 32px
  },
};
```

### Shadows

```typescript
const DRAWER_SHADOWS = {
  drawer: 'shadow-2xl shadow-black/40',
  activeItem: 'shadow-lg shadow-[#7b5cff]/20',
  primaryAction: 'shadow-lg shadow-[#7b5cff]/30',
};
```

## Component Structure

### Layout

- **Drawer Width:**
  - Mobile: `78%` of viewport (max `320px`)
  - Tablet/Desktop: `320px` - `360px` fixed
  
- **Padding:**
  - Top/Bottom: `18px`
  - Left/Right: `16px` (px-4)

- **Scrollbar:**
  - Custom thin scrollbar: `1px` width
  - Thumb: `bg-white/20`
  - Track: transparent

### Item States

#### Default (Inactive)
```css
background: bg-black/30
border: border border-white/6
text: text-white/80
hover: hover:bg-white/6
```

#### Active
```css
background: bg-gradient-to-r from-[#7b5cff] to-[#5fd4ff]
text: text-white
shadow: shadow-lg shadow-[#7b5cff]/20
indicator: 4px left accent marker (white)
```

#### Primary Quick Action
```css
background: bg-gradient-to-r from-[#7b5cff] to-[#5fd4ff]
text: text-white
shadow: shadow-lg shadow-[#7b5cff]/30
height: h-14 (56px)
```

#### Accent Quick Action
```css
background: bg-green-500/10
border: border border-green-500/20
text: text-green-300
hover: hover:bg-green-500/15
```

#### Danger (Logout)
```css
background: bg-red-500/10
border: border border-red-500/20
text: text-red-300
hover: hover:bg-red-500/20
```

## Accessibility

### ARIA Attributes

- Drawer: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Items: `role="button"`, `aria-label="{item.label}"`, `aria-current={isActive ? 'page' : undefined}`
- Avatar: `alt="{userName}'s avatar"`

### Keyboard Navigation

- All items are focusable
- Focus ring: `ring-2 ring-[#6f4cff]/30`
- Tab order follows visual order

### Touch Targets

- Minimum height: `48px` (h-12)
- Quick actions: `56px` (h-14)
- Spacing between items: `12px` (space-y-3)

## Responsive Behavior

### Mobile (< 640px)
- Width: `78%` (max `320px`)
- Overlay: Full screen with backdrop blur
- Safe area: Respects notch/status bar

### Tablet (640px - 1024px)
- Width: `320px` fixed
- Overlay: Full screen with backdrop blur

### Desktop (≥ 1024px)
- Width: `360px` fixed
- Can be converted to fixed left rail (non-overlay)

## Animation

### Drawer Open/Close
```typescript
{
  type: "spring",
  stiffness: 300,
  damping: 30,
}
```

### Item Tap
```css
active:scale-[0.985]
transition-all duration-150
```

## Usage Example

```tsx
<PremiumDrawer
  open={showMenu}
  onClose={() => setShowMenu(false)}
  onNavigate={(path) => navigate(path)}
  onSetActiveTab={(tab) => setActiveTab(tab)}
  onLogout={() => setShowLogoutDialog(true)}
  activeItem="home" // Optional: 'home' | 'deals' | 'payments' | 'protection' | 'messages' | 'calendar'
  counts={{ messages: 3 }} // Optional: badge counts
/>
```

## Menu Data Structure

```typescript
interface DrawerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;        // For route navigation
  tab?: string;         // For tab-based navigation
  badge?: number;       // Optional badge count
  variant?: 'default' | 'primary' | 'accent' | 'danger';
}

interface DrawerMenuData {
  main: DrawerMenuItem[];
  quickActions: DrawerMenuItem[];
  settings: DrawerMenuItem[];
}
```

