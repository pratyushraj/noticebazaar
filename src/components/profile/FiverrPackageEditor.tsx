import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

const sanitizeDeliverables = (deliverables: unknown): string[] => {
  if (!Array.isArray(deliverables)) return [];
  return deliverables
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => !/^https?:\/\//i.test(item) && !/^localhost(:\d+)?\//i.test(item) && !item.includes('localhost:8080'));
};

interface FiverrPackageEditorProps {
  templates: DealTemplate[] | null;
  avg_rate_reel?: number;
  onChange: (updatedTemplates: DealTemplate[]) => void;
  disabled?: boolean;
  isDark?: boolean;
}

const FiverrPackageEditor: React.FC<FiverrPackageEditorProps> = ({
  templates,
  avg_rate_reel = 5000,
  onChange,
  disabled = false,
  isDark = true
}) => {
  const [localTemplates, setLocalTemplates] = useState<DealTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const reelRate = Math.max(0, Number(avg_rate_reel) || 0);
    const growthRate = Math.round(reelRate * 2);

    const syncTemplateWithRate = (template: DealTemplate): DealTemplate => {
      const normalizedBudget = Number(
        template.budget ?? (template as any).price ?? (template as any).rate ?? 0
      ) || 0;

      if (template.id === 'basic') {
        return { ...template, budget: reelRate };
      }

      if (template.id === 'standard') {
        return { ...template, budget: growthRate };
      }

      if (template.id === 'barter' || template.id === 'product_review') {
        return { ...template, budget: 0, type: 'barter' };
      }

      return { ...template, budget: normalizedBudget };
    };

    if (templates && templates.length > 0) {
      // Map old fields to new fields if necessary to avoid data loss
      const mappedTemplates = templates.map(t =>
        syncTemplateWithRate({
          ...t,
          label: t.label || (
            t.id === 'basic' ? '🚀 Starter Collab' :
            t.id === 'standard' ? '⭐ Growth Campaign' :
            (t.id === 'barter' || t.id === 'product_review') ? '🎁 Product Exchange' : (t as any).name || 'Package'
          ),
          description: t.description || (
            t.id === 'basic' ? 'High-performing Reel optimized for organic reach. Best for first-time brand discovery.' :
            t.id === 'standard' ? 'Includes 30-day usage rights so brands can run ads and drive conversions.' :
            (t.id === 'barter' || t.id === 'product_review') ? 'Product unboxing or review with no paid usage rights. Best for authentic product proof.' : ''
          ),
          deadlineDays: t.deadlineDays || (t as any).turnaround_days || 7,
          isPopular: t.id === 'standard' || t.isPopular || (t as any).is_default || false,
          icon: t.icon || (t.id === 'basic' ? '🚀' : t.id === 'standard' ? '⭐' : '🎁'),
          type: t.type || 'paid',
          category: t.category || 'Creator Service',
          deliverables: t.deliverables || (
            t.id === 'basic' ? ['1 Reel (15-30s)', 'Organic reach focus', 'Basic editing'] :
            t.id === 'standard' ? ['1 Premium Reel (30-60s)', '30-day usage rights (for ads)', 'Script + hook optimization', '1 Story shoutout'] :
            (t.id === 'barter' || t.id === 'product_review') ? ['Product Review / Unboxing', '1 Story mention', 'No paid usage rights'] : []
          ).filter((item): item is string => typeof item === 'string' && item.trim().length > 0 && !/^https?:\/\//i.test(item) && !item.includes('localhost:8080')),
          quantities: t.quantities || {},
        })
      );

      setLocalTemplates(mappedTemplates);

      if (JSON.stringify(mappedTemplates) !== JSON.stringify(templates)) {
        onChange(mappedTemplates);
      }
    } else {
      // Generate defaults based on avg_rate_reel
      const reelRate = Number(avg_rate_reel) || 3000;
      const defaults: DealTemplate[] = [
        {
          id: 'basic',
          label: '🚀 Starter Collab',
          icon: '🚀',
          description: 'High-performing Reel optimized for organic reach. Best for first-time brand discovery.',
          budget: reelRate,
          type: 'paid',
          category: 'Short-form',
          deliverables: sanitizeDeliverables(['1 Reel (15-30s)', 'Organic reach focus', 'Basic editing']),
          quantities: { 'Reel': 1 },
          deadlineDays: 5,
        },
        {
          id: 'standard',
          label: '⭐ Growth Campaign',
          icon: '⭐',
          description: 'Includes 30-day usage rights so brands can run ads and drive conversions.',
          budget: Math.round(reelRate * 2),
          type: 'paid',
          category: 'Premium',
          deliverables: sanitizeDeliverables(['1 Premium Reel (30-60s)', '30-day usage rights (for ads)', 'Script + hook optimization', '1 Story shoutout']),
          quantities: { 'Reel': 1, 'Story': 1 },
          deadlineDays: 7,
          isPopular: true,
        },
        {
          id: 'barter',
          label: '🎁 Product Exchange',
          icon: '🎁',
          description: 'Product unboxing or review with no paid usage rights. Best for authentic product proof.',
          budget: 0,
          type: 'barter',
          category: 'Unboxing',
          deliverables: sanitizeDeliverables(['Product Review / Unboxing', '1 Story mention', 'No paid usage rights']),
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden",
            isDark ? "bg-primary/10 border border-primary/20" : "bg-primary/5 border border-primary/10"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <Layout className="w-6 h-6 text-primary relative z-10" />
          </div>
          <div>
            <h3 className={cn("text-xl font-black italic tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Pricing Packages
            </h3>
            <p className={cn("text-[12px] font-medium opacity-60 leading-tight", isDark ? "text-white" : "text-slate-600")}>
              Based on your profile, this pricing is optimized for deal acceptance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {localTemplates.map((template) => {
          const isExpanded = expandedId === template.id;
          const isPremium = template.id === 'premium' || template.id === 'barter';
          const isStandard = template.id === 'standard';
          const isBasic = template.id === 'basic';

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: localTemplates.indexOf(template) * 0.1 }}
              key={template.id}
            >
              <Card 
                className={cn(
                  "relative overflow-hidden rounded-[2.5rem] border transition-all duration-500",
                  isDark 
                    ? "bg-[#111820] border-white/5 shadow-[0_22px_70px_rgba(0,0,0,0.4)]" 
                    : "bg-white border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.05)]",
                  isDark 
                    ? "hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
                    : "hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]",
                  isStandard && (isDark ? "border-emerald-500/30 shadow-[0_25px_80px_rgba(16,185,129,0.12)]" : "border-emerald-500/20 shadow-[0_15px_50px_rgba(16,185,129,0.08)]"),
                  isPremium && (isDark ? "border-amber-500/30 shadow-[0_25px_80px_rgba(245,158,11,0.12)]" : "border-amber-500/20 shadow-[0_15px_50px_rgba(245,158,11,0.08)]"),
                  isExpanded && (isDark ? "ring-2 ring-primary/30 scale-[1.02]" : "ring-2 ring-primary/10 scale-[1.02]")
                )}
              >
              <div className={cn(
                "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                isBasic ? (isDark ? "from-slate-200/60 via-slate-400/30 to-transparent" : "from-slate-300 via-slate-100 to-transparent") :
                isStandard ? "from-emerald-400/60 via-green-400/30 to-transparent" :
                "from-amber-400/60 via-orange-400/30 to-transparent"
              )} />
              {/* Header */}
              <div className={cn("p-4 sm:p-5 border-b", isDark ? "border-white/6" : "border-slate-100")}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.26em] px-2.5 py-1 rounded-full border",
                      isBasic ? (isDark ? "bg-white/6 text-white/55 border-white/8" : "bg-slate-50 text-slate-500 border-slate-200") :
                      isStandard ? "bg-emerald-500/10 text-emerald-500 border-emerald-400/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-400/20"
                    )}>
                      {template.id}
                    </span>
                    {template.isPopular && (
                      <span className="text-[9px] bg-amber-500 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm">
                        Most chosen
                      </span>
                    )}
                  </div>
                  <button type="button" 
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className={cn(
                        "p-2 rounded-full border transition-colors",
                        isDark ? "border-white/6 hover:bg-white/6" : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <Settings2 className={cn("w-4 h-4", isDark ? "text-white/45" : "text-slate-400", isExpanded && "text-emerald-500")} />
                  </button>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border",
                    isBasic ? (isDark ? "bg-white/6 border-white/8" : "bg-slate-50 border-slate-200") :
                    isStandard ? (isDark ? "bg-emerald-500/10 border-emerald-400/20" : "bg-emerald-50 border-emerald-100") :
                    (isDark ? "bg-amber-500/10 border-amber-400/20" : "bg-amber-50 border-amber-100")
                  )}>
                    <span className="text-lg">{template.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={template.label}
                      onChange={(e) => handleUpdate(template.id, { label: e.target.value })}
                      disabled={disabled}
                      className={cn(
                        "bg-transparent border-none p-0 text-[1.02rem] font-extrabold tracking-tight shadow-none focus-visible:ring-0 h-auto",
                        isDark ? "text-white placeholder:text-white/35" : "text-slate-900 placeholder:text-slate-300"
                      )}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-[14px] font-black", isDark ? "text-white/40" : "text-slate-400")}>₹</span>
                        <Input
                          type="number"
                          value={template.budget || 0}
                          onChange={(e) => handleUpdate(template.id, { budget: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className={cn(
                            "bg-transparent border-none p-0 text-[1.85rem] sm:text-[2.15rem] font-black tracking-tight shadow-none focus-visible:ring-0 h-auto w-24",
                            isBasic ? (isDark ? "text-white" : "text-slate-900") : isStandard ? "text-emerald-500" : "text-amber-500"
                          )}
                        />
                      </div>
                      <div className={cn("pb-1 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap", isDark ? "text-white/30" : "text-slate-400")}>
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
                  placeholder="What the brand gets in this package"
                  className={cn(
                    "text-[13px] font-medium leading-relaxed border text-foreground resize-none min-h-[88px] rounded-2xl shadow-inner focus-visible:ring-emerald-400/20",
                    isDark 
                        ? "bg-white/5 border-white/10 placeholder:text-white/35 shadow-black/10" 
                        : "bg-slate-50 border-slate-200 placeholder:text-slate-400 shadow-slate-100"
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.24em]", isDark ? "text-white/45" : "text-slate-400")}>What the brand gets</span>
                    <button type="button" 
                      onClick={() => addDeliverable(template.id)}
                      className="text-[11px] text-emerald-500 hover:text-emerald-600 font-black tracking-wide"
                    >
                      + Add
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(template.deliverables || []).map((item, idx) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-2xl border transition-all duration-300",
                          isDark 
                              ? "border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-4 py-3 hover:bg-white/[0.06] hover:border-white/20" 
                              : "border-slate-100 bg-slate-50/50 px-4 py-3 hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                          isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                        )}>
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <Input
                          value={item}
                          onChange={(e) => updateDeliverable(template.id, idx, e.target.value)}
                          disabled={disabled}
                          className={cn(
                            "text-[13px] font-bold bg-transparent border-none p-0 h-auto shadow-none focus-visible:ring-0 flex-1",
                            isDark ? "text-white/90 placeholder:text-white/20" : "text-slate-700 placeholder:text-slate-300"
                          )}
                        />
                        <button type="button" 
                          onClick={() => removeDeliverable(template.id, idx)}
                          className={cn(
                            "p-2 rounded-xl transition-all active:scale-90",
                            isDark ? "text-white/20 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-300 hover:text-rose-500 hover:bg-rose-50",
                            "opacity-40 group-hover:opacity-100"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className={cn("pt-4 grid grid-cols-2 gap-3 border-t animate-in fade-in slide-in-from-top-2 duration-300", isDark ? "border-white/6" : "border-slate-100")}>
                    <div className="space-y-1">
                      <label className={cn("text-[10px] flex items-center gap-1 font-black uppercase tracking-[0.2em]", isDark ? "text-white/45" : "text-slate-400")}>
                        <Clock className="w-3 h-3" /> Delivery Time
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={template.deadlineDays || 0}
                          onChange={(e) => handleUpdate(template.id, { deadlineDays: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className={cn(
                            "h-8 text-sm w-16 rounded-xl",
                            isDark ? "bg-white/4 border-white/8 text-white/90" : "bg-slate-50 border-slate-200 text-slate-700"
                          )}
                        />
                        <span className={cn("text-[10px] font-medium", isDark ? "text-white/40" : "text-slate-400")}>Days</span>
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
                            : (isDark ? "bg-white/5 text-white/60 border-white/8 hover:bg-white/8" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100")
                        )}
                      >
                        {template.isPopular ? "Unmark Popular" : "Mark Popular"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FiverrPackageEditor;
