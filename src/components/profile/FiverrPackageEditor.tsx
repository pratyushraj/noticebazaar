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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {localTemplates.map((template) => {
          const isExpanded = expandedId === template.id;
          const isPremium = template.id === 'premium';
          const isStandard = template.id === 'standard';

          return (
            <Card 
              key={template.id} 
              className={cn(
                "relative overflow-hidden transition-all duration-300 border bg-muted/30",
                isStandard && "border-primary/30 bg-primary/5",
                isPremium && "border-warning/30 bg-warning/5",
                isExpanded && " ring-2 ring-primary/20 scale-[1.02]"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                      template.id === 'basic' ? "bg-background/20 text-muted-foreground" :
                      isStandard ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"
                    )}>
                      {template.id}
                    </span>
                    {template.isPopular && (
                      <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Most Popular</span>
                    )}
                  </div>
                  <button type="button" 
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="p-1 hover:bg-secondary/50 rounded-full transition-colors"
                  >
                    <Settings2 className={cn("w-4 h-4 text-muted-foreground", isExpanded && "text-primary")} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.icon}</span>
                  <Input
                    value={template.label}
                    onChange={(e) => handleUpdate(template.id, { label: e.target.value })}
                    disabled={disabled}
                    className="bg-transparent border-none p-0 text-sm font-bold shadow-none focus-visible:ring-0 h-auto"
                  />
                </div>
                
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-lg font-black tracking-tight">₹</span>
                  <Input
                    type="number"
                    value={template.budget || 0}
                    onChange={(e) => handleUpdate(template.id, { budget: parseInt(e.target.value) || 0 })}
                    disabled={disabled}
                    className="bg-transparent border-none p-0 text-2xl font-black shadow-none focus-visible:ring-0 h-auto w-24"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                <Textarea
                  value={template.description || ''}
                  onChange={(e) => handleUpdate(template.id, { description: e.target.value })}
                  disabled={disabled}
                  placeholder="What's included in this package?"
                  className="text-xs bg-muted/50 border-border/5 resize-none min-h-[60px]"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Deliverables</span>
                    <button type="button" 
                      onClick={() => addDeliverable(template.id)}
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      + Add
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    {(template.deliverables || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <Input
                          value={item}
                          onChange={(e) => updateDeliverable(template.id, idx, e.target.value)}
                          disabled={disabled}
                          className="text-[11px] bg-transparent border-none p-0 h-auto shadow-none focus-visible:ring-0 flex-1 truncate"
                        />
                        <button type="button" 
                          onClick={() => removeDeliverable(template.id, idx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-destructive hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 grid grid-cols-2 gap-3 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Delivery Time
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={template.deadlineDays || 0}
                          onChange={(e) => handleUpdate(template.id, { deadlineDays: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className="h-8 text-xs bg-muted/50 border-border/5 w-12"
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">Days</span>
                      </div>
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdate(template.id, { isPopular: !template.isPopular })}
                        className={cn(
                          "h-8 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight border transition-all",
                          template.isPopular ? "bg-amber-500 text-white border-amber-600" : "bg-white text-muted-foreground border-border/50"
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
