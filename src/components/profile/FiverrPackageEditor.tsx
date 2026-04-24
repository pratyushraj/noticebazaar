import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Trash2, Clock, RotateCcw, Sparkles, Layout, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Using the same interface as CollabLinkLanding
interface DealTemplate {
  id: string;
  label: string;
  icon: string;
  budget: number;
  type: 'paid' | 'barter';
  category: string;
  description: string;
  deliverables: string[];
  quantities: Record<string, number>;
  deadlineDays: number;
  notes?: string;
  isPopular?: boolean;
  addons?: { id: string, label: string, price: number }[];
}

interface FiverrPackageEditorProps {
  templates: DealTemplate[] | null;
  avg_rate_reel?: number;
  onChange: (updatedTemplates: DealTemplate[]) => void;
  disabled?: boolean;
}

const FiverrPackageEditor: React.FC<FiverrPackageEditorProps> = ({
  templates,
  avg_rate_reel = 5000,
  onChange,
  disabled = false
}) => {
  const [localTemplates, setLocalTemplates] = useState<DealTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (templates && templates.length > 0) {
      // Map old fields to new fields if necessary to avoid data loss
      const mappedTemplates = templates.map(t => ({
        ...t,
        label: t.label || (t as any).name || 'Package',
        budget: t.budget || (t as any).rate || 0,
        deadlineDays: t.deadlineDays || (t as any).turnaround_days || 7,
        isPopular: t.isPopular || (t as any).is_default || false,
        icon: t.icon || '📦',
        type: t.type || 'paid',
        category: t.category || 'Creator Service',
        quantities: t.quantities || {},
      }));

      // AUTO-UPDATE LOGIC: If the user changed their baseline rate, 
      // we should update standard templates IF they haven't been customized to a specific weird amount.
      // This solves the "wrong price" issue when changing baseline rate.
      const prevReelRate = Number(localTemplates.find(t => t.id === 'basic')?.budget) || 0;
      const currentReelRate = Number(avg_rate_reel);
      
      if (prevReelRate > 0 && currentReelRate !== prevReelRate) {
        const updated = mappedTemplates.map(t => {
          if (t.id === 'basic' && (t.budget === prevReelRate || t.budget === 0)) {
             return { ...t, budget: currentReelRate };
          }
          if (t.id === 'standard' && (t.budget === prevReelRate * 2 || t.budget === 0)) {
             return { ...t, budget: currentReelRate * 2 };
          }
          // Only update if they look like they were using the previous default logic
          return t;
        });
        setLocalTemplates(updated);
        onChange(updated);
      } else {
        setLocalTemplates(mappedTemplates);
      }
    } else {
      // Generate defaults based on avg_rate_reel
      const reelRate = Number(avg_rate_reel) || 5000;
      const defaults: DealTemplate[] = [
        {
          id: 'basic',
          label: 'Basic Starter',
          icon: '🚀',
          description: '1 Professional Reel (up to 30s) with basic editing and raw footage.',
          budget: reelRate,
          type: 'paid',
          category: 'Instagram Reel',
          deliverables: ['Instagram Reel'],
          quantities: { 'Instagram Reel': 1 },
          deadlineDays: 3,
        },
        {
          id: 'standard',
          label: 'Standard Growth',
          icon: '⭐',
          description: '1 High-quality Reel + 2 Stories with trending audio and custom captions.',
          budget: Math.round(reelRate * 2),
          type: 'paid',
          category: 'Instagram Reel + Stories',
          deliverables: ['Instagram Reel', 'Instagram Stories'],
          quantities: { 'Instagram Reel': 1, 'Instagram Stories': 2 },
          deadlineDays: 5,
          isPopular: true,
        },
        {
          id: 'barter',
          label: 'Product Review',
          icon: '📦',
          description: 'In-depth product unboxing and review with 1 story mention. Free product as payment.',
          budget: 0,
          type: 'barter',
          category: 'Unboxing',
          deliverables: ['Unboxing Video', 'Instagram Story'],
          quantities: { 'Unboxing Video': 1, 'Instagram Story': 1 },
          deadlineDays: 14,
        }
      ];
      setLocalTemplates(defaults);
      // Trigger update so parent knows about initial dynamic rates
      onChange(defaults);
    }
  }, [templates, avg_rate_reel]);

  const handleUpdate = (id: string, updates: Partial<DealTemplate>) => {
    const next = localTemplates.map(t => t.id === id ? { ...t, ...updates } : t);
    setLocalTemplates(next);
    onChange(next);
  };

  const addDeliverable = (id: string) => {
    const template = localTemplates.find(t => t.id === id);
    if (!template) return;
    
    const newDeliverables = [...(template.deliverables || []), 'New Deliverable'];
    handleUpdate(id, { deliverables: newDeliverables });
  };

  const removeDeliverable = (id: string, index: number) => {
    const template = localTemplates.find(t => t.id === id);
    if (!template) return;
    
    const newDeliverables = (template.deliverables || []).filter((_, i) => i !== index);
    handleUpdate(id, { deliverables: newDeliverables });
  };

  const updateDeliverable = (id: string, index: number, value: string) => {
    const template = localTemplates.find(t => t.id === id);
    if (!template) return;
    
    const newDeliverables = [...(template.deliverables || [])];
    newDeliverables[index] = value;
    handleUpdate(id, { deliverables: newDeliverables });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Layout className="w-4 h-4 text-primary" />
            Pricing Packages
          </h3>
          <p className="text-[11px] text-muted-foreground">Define your Basic, Standard, and Premium tiers.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {localTemplates.map((template) => {
          const isExpanded = expandedId === template.id;
          const isPremium = template.id === 'premium';
          const isStandard = template.id === 'standard';
          const isBasic = template.id === 'basic';

          return (
            <Card 
              key={template.id} 
              className={cn(
                "relative overflow-hidden rounded-[2rem] border bg-[#171b24] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-300",
                "border-white/8 hover:border-emerald-400/40 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(0,0,0,0.32)]",
                isStandard && "border-emerald-400/35 shadow-[0_20px_60px_rgba(16,185,129,0.10)]",
                isPremium && "border-amber-400/30 shadow-[0_20px_60px_rgba(245,158,11,0.10)]",
                isExpanded && "ring-2 ring-emerald-400/20 scale-[1.01]"
              )}
            >
              <div className={cn(
                "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                isBasic ? "from-slate-200/60 via-slate-400/30 to-transparent" :
                isStandard ? "from-emerald-400/60 via-green-400/30 to-transparent" :
                "from-amber-400/60 via-orange-400/30 to-transparent"
              )} />
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.26em] px-2.5 py-1 rounded-full border",
                      isBasic ? "bg-white/6 text-white/55 border-white/8" :
                      isStandard ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/20" :
                      "bg-amber-500/10 text-amber-300 border-amber-400/20"
                    )}>
                      {template.id}
                    </span>
                    {template.isPopular && (
                      <span className="text-[9px] bg-amber-500 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <button type="button" 
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="p-2 rounded-full border border-white/6 hover:bg-white/6 transition-colors"
                  >
                    <Settings2 className={cn("w-4 h-4 text-white/45", isExpanded && "text-emerald-300")} />
                  </button>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border",
                    isBasic ? "bg-white/6 border-white/8" :
                    isStandard ? "bg-emerald-500/10 border-emerald-400/20" :
                    "bg-amber-500/10 border-amber-400/20"
                  )}>
                    <span className="text-lg">{template.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={template.label}
                      onChange={(e) => handleUpdate(template.id, { label: e.target.value })}
                      disabled={disabled}
                      className="bg-transparent border-none p-0 text-[1.02rem] font-extrabold tracking-tight shadow-none focus-visible:ring-0 h-auto text-white placeholder:text-white/35"
                    />
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[13px] font-bold text-white/45">₹</span>
                        <Input
                          type="number"
                          value={template.budget || 0}
                          onChange={(e) => handleUpdate(template.id, { budget: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className={cn(
                            "bg-transparent border-none p-0 text-[2rem] sm:text-[2.15rem] font-black tracking-tight shadow-none focus-visible:ring-0 h-auto w-28",
                            isBasic ? "text-white" : isStandard ? "text-emerald-300" : "text-amber-300"
                          )}
                        />
                      </div>
                      <div className="pb-1 text-[10px] uppercase tracking-[0.24em] text-white/35">
                        Base rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 space-y-5">
                <Textarea
                  value={template.description || ''}
                  onChange={(e) => handleUpdate(template.id, { description: e.target.value })}
                  disabled={disabled}
                  placeholder="What's included in this package?"
                  className="text-sm leading-relaxed bg-white/4 border-white/8 text-white/90 placeholder:text-white/35 resize-none min-h-[92px] rounded-2xl"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-white/45 uppercase tracking-[0.24em]">Deliverables</span>
                    <button type="button" 
                      onClick={() => addDeliverable(template.id)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-black tracking-wide"
                    >
                      + Add
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(template.deliverables || []).map((item, idx) => (
                      <div key={idx} className="group flex items-center gap-2.5 rounded-2xl border border-white/6 bg-white/4 px-3 py-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <Input
                          value={item}
                          onChange={(e) => updateDeliverable(template.id, idx, e.target.value)}
                          disabled={disabled}
                          className="text-sm bg-transparent border-none p-0 h-auto shadow-none focus-visible:ring-0 flex-1 truncate text-white/90 placeholder:text-white/35"
                        />
                        <button type="button" 
                          onClick={() => removeDeliverable(template.id, idx)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:bg-white/6 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 grid grid-cols-2 gap-3 border-t border-white/6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/45 flex items-center gap-1 font-black uppercase tracking-[0.2em]">
                        <Clock className="w-3 h-3" /> Delivery Time
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={template.deadlineDays || 0}
                          onChange={(e) => handleUpdate(template.id, { deadlineDays: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className="h-8 text-sm bg-white/4 border-white/8 w-16 rounded-xl text-white/90"
                        />
                        <span className="text-[10px] text-white/40 font-medium">Days</span>
                      </div>
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdate(template.id, { isPopular: !template.isPopular })}
                        className={cn(
                          "h-8 px-2 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] border transition-all",
                          template.isPopular
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-white/5 text-white/60 border-white/8 hover:bg-white/8"
                        )}
                      >
                        {template.isPopular ? "Unmark Popular" : "Mark Popular"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FiverrPackageEditor;
