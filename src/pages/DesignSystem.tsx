

import { useState } from 'react';
import {
  ArrowRight, Check, Copy, ExternalLink, Loader2, MessageCircleMore,
  AlertCircle, ShieldCheck, Star, ChevronDown, Clock, FileText, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================
// DESIGN TOKENS (for reference)
// ============================================================
//
// COLORS
//   --background     Dark: #111318 | Light: #FAFAFA
//   --foreground     Dark: #FAFAFA  | Light: #18181B
//   --card           Dark: #18181C  | Light: #FFFFFF
//   --border         Dark: rgba(255,255,255,0.06) | Light: #E4E4E7
//   --primary        #22C55E (emerald-500) — ONE accent, used sparingly
//   --muted          Dark: #27272A  | Light: #F4F4F5
//   --muted-foreground  #A1A1AA (60% grey)
//   --destructive    #EF4444 (red-500)
//   --warning        #F59E0B (amber-500)
//
// TYPOGRAPHY
//   text-3xl   font-semibold  tracking-tight   (page titles)
//   text-2xl   font-semibold  tracking-tight   (section titles)
//   text-xl    font-semibold  tracking-tight   (card titles)
//   text-lg    font-medium                    (subheadings)
//   text-base  font-normal                    (body)
//   text-sm    font-medium                    (labels, secondary)
//   text-xs    font-medium                    (badges, metadata)
//   text-[11px] font-medium                  (timestamps)
//
// SPACING
//   px-4       Mobile horizontal padding
//   py-4       Vertical section padding
//   gap-3      Card internal spacing
//   gap-4      Section item spacing
//   gap-6      Section spacing
//   space-y-6  Page section spacing
//
// RADII
//   rounded-2xl  = 16px   Cards, large containers
//   rounded-xl   = 12px   Buttons, inputs, medium cards
//   rounded-lg   = 8px    Small elements
//   rounded-full         Pills, badges
//
// SHADOWS
//   shadow-sm    Subtle, resting state
//   shadow-md    Card hover, elevated
//   shadow-lg    Modals, sheets
//
// ============================================================
// PAGE
// ============================================================

const DesignSystem = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => undefined);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">

        {/* ── HEADER ─────────────────────────────────────── */}
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">NoticeBazaar Design System</h1>
          <p className="mt-2 text-sm text-muted-foreground">One accent color · Rounded-2xl cards · Soft shadows · Minimal borders</p>
        </header>

        {/* ══════════════════════════════════════════════════ */}
        {/* COLORS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Colors</h2>

          {/* Semantic palette */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary accent — emerald-500</p>
            <div className="flex items-center gap-3">
              {['bg-primary', 'bg-primary/90', 'bg-primary/70', 'bg-primary/50', 'bg-primary/20', 'bg-primary/10'].map((c, i) => (
                <div key={i} className={cn("w-12 h-12 rounded-xl", c)} />
              ))}
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">Surface colors</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { cls: 'bg-background', label: 'Background', dark: '#111318', light: '#FAFAFA' },
                { cls: 'bg-card', label: 'Card', dark: '#18181C', light: '#FFFFFF' },
                { cls: 'bg-secondary', label: 'Secondary', dark: '#27272A', light: '#F4F4F5' },
                { cls: 'bg-muted', label: 'Muted', dark: '#27272A', light: '#F4F4F5' },
              ].map(({ cls, label, dark, light }) => (
                <div key={label} className="space-y-1.5">
                  <div className={cn("h-16 rounded-xl border border-border", cls)} />
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">D: {dark}</p>
                  <p className="text-[10px] text-muted-foreground">L: {light}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">Status colors</p>
            <div className="flex flex-wrap gap-3">
              {[
                { cls: 'bg-destructive', label: 'Destructive' },
                { cls: 'bg-warning', label: 'Warning' },
                { cls: 'bg-info', label: 'Info' },
                { cls: 'bg-success', label: 'Success' },
              ].map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-lg", cls)} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* TYPOGRAPHY */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Typography</h2>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            {[
              { size: 'text-3xl font-semibold tracking-tight', label: 'Page title', sample: 'Creator Dashboard' },
              { size: 'text-2xl font-semibold tracking-tight', label: 'Section title', sample: 'Your deals' },
              { size: 'text-xl font-semibold tracking-tight', label: 'Card title', sample: 'Active deal' },
              { size: 'text-base font-medium', label: 'Subheading', sample: 'Share your link' },
              { size: 'text-sm font-medium', label: 'Label', sample: '₹5,000 · 3 days' },
              { size: 'text-sm font-normal', label: 'Body', sample: 'When a brand sends an offer, it shows here.' },
              { size: 'text-xs font-medium', label: 'Badge / Meta', sample: 'Action needed · 2h ago' },
              { size: 'text-[11px] font-medium text-muted-foreground', label: 'Timestamp', sample: '10:30 AM' },
            ].map(({ size, label, sample }) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="w-32 shrink-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className={cn('text-foreground flex-1', size)}>{sample}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* SPACING */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Spacing scale</h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="space-y-2">
              {[
                { px: 'px-2', label: '2 (gap-1)' },
                { px: 'px-3', label: '3 (gap-1.5)' },
                { px: 'px-4', label: '4 (gap-2)' },
                { px: 'px-5', label: '5 (gap-2.5)' },
                { px: 'px-6', label: '6 (gap-3)' },
                { px: 'px-8', label: '8 (gap-4)' },
                { px: 'px-12', label: '12 (gap-6)' },
              ].map(({ px, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={cn("h-3 bg-primary/40 rounded-full", px)} />
                  <span className="text-xs text-muted-foreground w-16">{px}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* BORDER RADIUS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Border radius</h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap gap-4">
              {[
                { r: 'rounded', label: '4px sm' },
                { r: 'rounded-lg', label: '8px lg' },
                { r: 'rounded-xl', label: '12px xl (buttons)' },
                { r: 'rounded-2xl', label: '16px 2xl (cards)' },
                { r: 'rounded-full', label: 'full (pills)' },
              ].map(({ r, label }) => (
                <div key={label} className="text-center space-y-2">
                  <div className={cn("w-14 h-14 bg-secondary border border-border", r)} />
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* SHADOWS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Shadows</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { shadow: 'shadow-sm', label: 'shadow-sm', desc: 'Resting cards' },
              { shadow: 'shadow-md', label: 'shadow-md', desc: 'Hover, elevated' },
              { shadow: 'shadow-lg', label: 'shadow-lg', desc: 'Modals, sheets' },
              { shadow: 'shadow-xl', label: 'shadow-xl', desc: 'Bottom sheets' },
            ].map(({ shadow, label, desc }) => (
              <div key={label} className="text-center space-y-2">
                <div className={cn("w-full h-16 bg-card rounded-2xl border border-border flex items-center justify-center", shadow)}>
                  <div className="w-8 h-2 bg-secondary rounded-full" />
                </div>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* BUTTONS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Buttons</h2>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">

            {/* Sizes */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Loader2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* With icons */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">With icons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button><MessageCircleMore className="h-4 w-4" /> Share</Button>
                <Button variant="outline"><Copy className="h-4 w-4" /> Copy link</Button>
                <Button variant="secondary">View deal <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
              </div>
            </div>

            {/* States */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">States</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button><Loader2 className="h-4 w-4 animate-spin" /> Loading</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* INPUTS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Inputs</h2>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Default</p>
              <Input placeholder="e.g. ₹5,000 – ₹15,000" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">With value</p>
              <Input defaultValue="contact@brand.com" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Disabled</p>
              <Input placeholder="Disabled" disabled />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Textarea</p>
              <textarea
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all resize-none"
                rows={3}
                placeholder="Tell them about your brand..."
                defaultValue=""
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* BADGES */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Badges</h2>
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Variants</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sizes</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm">Small</Badge>
                <Badge>Default</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pills (rounded-full)</p>
              <div className="flex flex-wrap gap-2">
                {['Action needed', 'Waiting on brand', 'Changes needed', 'Submit post link', 'Deal completed'].map(label => (
                  <Badge key={label}>{label}</Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* CARDS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Basic card */}
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Card description goes here with muted text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card content body text.</p>
              </CardContent>
            </Card>

            {/* Interactive card */}
            <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader>
                <CardTitle>Interactive card</CardTitle>
                <CardDescription>Hover me — I lift up.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm">Action</Button>
              </CardContent>
            </Card>

            {/* Accent card */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Verified creator
                </CardTitle>
                <CardDescription>With accent border treatment.</CardDescription>
              </CardHeader>
            </Card>

            {/* Warning card */}
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-warning">Warning state</CardTitle>
                <CardDescription>With tinted background.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* MODALS / ALERT DIALOG */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Modals</h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-4">Use shadcn AlertDialog or Sheet components. Modal style:</p>
            <ul className="space-y-1.5">
              {[
                'rounded-2xl border border-border bg-card',
                'shadow-xl for elevation',
                'Max height 85vh, overflow-y-auto',
                'Backdrop: fixed inset-0 bg-black/40 backdrop-blur-sm',
                'Header with title + optional close button',
                'Footer with primary + ghost/cancel actions',
              ].map(item => (
                <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* NAVIGATION */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Navigation</h2>
          <div className="space-y-4">
            {/* Top bar style */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Top bar</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">NoticeBazaar</p>
                <div className="flex items-center gap-1">
                  {['Home', 'Deals', 'Payments'].map((item, i) => (
                    <div
                      key={item}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        i === 0 ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar item */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Sidebar item</p>
              <div className="space-y-1">
                {['Dashboard', 'Deals', 'Payments', 'Settings'].map((item, i) => (
                  <div
                    key={item}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="w-4 h-4 rounded bg-secondary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom nav item */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Mobile bottom nav</p>
              <div className="flex justify-around items-center">
                {['Home', 'Deals', 'Payments'].map((item, i) => (
                  <div key={item} className="flex flex-col items-center gap-1 px-4 py-2">
                    <div className={cn("w-5 h-5 rounded-full", i === 0 ? "bg-primary" : "bg-secondary")} />
                    <span className={cn("text-[10px] font-medium", i === 0 ? "text-primary" : "text-muted-foreground")}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* TABLES */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Tables</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {['Brand', 'Amount', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { brand: 'Noise', amount: '₹8,000', status: 'Active', action: true },
                  { brand: 'boAt', amount: '₹12,500', status: 'Completed', action: false },
                  { brand: 'Mamaearth', amount: '₹5,000', status: 'Pending', action: false },
                ].map((row, i) => (
                  <tr key={i} className="bg-card hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{row.brand}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.amount}</td>
                    <td className="px-4 py-3"><Badge variant={row.status === 'Active' ? 'default' : row.status === 'Pending' ? 'warning' : 'secondary'}>{row.status}</Badge></td>
                    <td className="px-4 py-3 text-right">{row.action && <Button size="sm" variant="ghost">View</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Note: Avoid dense tables. Use cards for complex data. Reserve tables for sortable/admin data only.</p>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* TIMELINE */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Timeline</h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="space-y-0">
              {[
                { done: true, current: false, label: 'Deal signed', time: 'Mar 15' },
                { done: true, current: false, label: 'Content in progress', time: 'Mar 18' },
                { done: false, current: true, label: 'Submit content', time: 'Mar 22' },
                { done: false, current: false, label: 'Brand review', time: 'Mar 24' },
                { done: false, current: false, label: 'Payment released', time: 'Mar 26' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                      step.done ? "bg-primary text-primary-foreground" :
                      step.current ? "bg-primary/20 text-primary ring-2 ring-primary/40" :
                      "bg-secondary text-muted-foreground"
                    )}>
                      {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < 4 && <div className={cn("w-0.5 flex-1 my-1", step.done ? "bg-primary" : "bg-secondary")} />}
                  </div>
                  {/* Label */}
                  <div className={cn("flex-1 pb-5", step.current && "pb-5")}>
                    <p className={cn("text-sm font-medium", step.current ? "text-primary" : step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* EMPTY STATES */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Empty states</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* With action */}
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No offers yet</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Share your link to start receiving brand offers.</p>
              <Button size="sm" className="mt-4">Share link →</Button>
            </div>

            {/* With CTA */}
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No deals active</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Complete your profile to attract more brands.</p>
              <Button size="sm" variant="outline" className="mt-4">Complete profile</Button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* FORM LAYOUTS */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Form layouts</h2>
          <div className="space-y-6">
            {/* Stack layout */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground mb-4">Vertical stack (preferred)</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Brand name</label>
                  <Input placeholder="e.g. Noise" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input type="email" placeholder="contact@brand.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Budget</label>
                  <Input placeholder="e.g. ₹5,000 – ₹15,000" />
                </div>
                <Button className="w-full">Submit</Button>
              </div>
            </div>

            {/* Grid layout */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs font-medium text-muted-foreground mb-4">Grid layout (2-col for wider forms)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">First name</label>
                  <Input placeholder="Rahul" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Last name</label>
                  <Input placeholder="Sharma" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input type="email" placeholder="rahul@brand.com" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════ */}
        {/* STICKY MOBILE CTA */}
        {/* ══════════════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-tight">Sticky mobile CTA</h2>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-medium text-muted-foreground mb-3">Fixed bottom bar — mobile only</p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-mono">md:hidden</p>
              {[
                "fixed bottom-0 left-0 right-0 z-50",
                "bg-gradient-to-t from-background via-background/95 to-transparent",
                "pt-8 pb-4 px-4",
                "Button w-full h-14 rounded-2xl",
              ].map(item => (
                <p key={item} className="text-xs text-muted-foreground font-mono">· {item}</p>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DesignSystem;
