"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Trash2, Clock, RotateCcw, Sparkles, Layout, Settings2 } from 'lucide-react';
import { DealTemplate } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FiverrPackageEditorProps {
  templates: DealTemplate[] | null;
  onChange: (updatedTemplates: DealTemplate[]) => void;
  disabled?: boolean;
}

const DEFAULT_TEMPLATES: DealTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Starter',
    description: '1 Professional Reel (up to 30s) with basic editing and raw footage.',
    rate: 5000,
    deliverables: ['1x Instagram Reel', 'Usage rights (30 days)'],
    turnaround_days: 3,
    revision_count: 1,
  },
  {
    id: 'standard',
    name: 'Standard Growth',
    description: '1 High-quality Reel + 2 Stories with trending audio and custom captions.',
    rate: 12000,
    deliverables: ['1x Premium Reel', '2x Instagram Stories', 'Usage rights (90 days)', 'Brand tagging'],
    turnaround_days: 5,
    revision_count: 2,
    is_default: true,
  },
  {
    id: 'premium',
    name: 'Premium Campaign',
    description: 'Full campaign including Reel, Stories, and static Post with professional grading.',
    rate: 25000,
    deliverables: ['1x Cinematic Reel', '3x Stories', '1x Carousel Post', 'Full usage rights', 'Source files'],
    turnaround_days: 7,
    revision_count: 3,
  }
];

const FiverrPackageEditor: React.FC<FiverrPackageEditorProps> = ({
  templates,
  onChange,
  disabled = false
}) => {
  const [localTemplates, setLocalTemplates] = useState<DealTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (templates && templates.length > 0) {
      setLocalTemplates(templates);
    } else {
      setLocalTemplates(DEFAULT_TEMPLATES);
    }
  }, [templates]);

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
        <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Fiverr Style
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
                isPremium && "border-amber-500/30 bg-amber-500/5",
                isExpanded && " ring-2 ring-primary/20 scale-[1.02]"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    template.id === 'basic' ? "bg-slate-500/20 text-slate-400" :
                    isStandard ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {template.id}
                  </span>
                  <button type="button" 
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Settings2 className={cn("w-4 h-4 text-muted-foreground", isExpanded && "text-primary")} />
                  </button>
                </div>
                
                <Input
                  value={template.name}
                  onChange={(e) => handleUpdate(template.id, { name: e.target.value })}
                  disabled={disabled}
                  className="bg-transparent border-none p-0 text-sm font-bold shadow-none focus-visible:ring-0 h-auto mb-1"
                />
                
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-lg font-black tracking-tight">₹</span>
                  <Input
                    type="number"
                    value={template.rate || 0}
                    onChange={(e) => handleUpdate(template.id, { rate: parseInt(e.target.value) || 0 })}
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
                  className="text-xs bg-muted/50 border-white/5 resize-none min-h-[60px]"
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
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <Input
                          value={item}
                          onChange={(e) => updateDeliverable(template.id, idx, e.target.value)}
                          disabled={disabled}
                          className="text-[11px] bg-transparent border-none p-0 h-auto shadow-none focus-visible:ring-0 flex-1 truncate"
                        />
                        <button type="button" 
                          onClick={() => removeDeliverable(template.id, idx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:bg-red-500/10 rounded transition-all"
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
                          value={template.turnaround_days || 0}
                          onChange={(e) => handleUpdate(template.id, { turnaround_days: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className="h-8 text-xs bg-muted/50 border-white/5 w-12"
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">Days</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Revisions
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={template.revision_count || 0}
                          onChange={(e) => handleUpdate(template.id, { revision_count: parseInt(e.target.value) || 0 })}
                          disabled={disabled}
                          className="h-8 text-xs bg-muted/50 border-white/5 w-12"
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">Times</span>
                      </div>
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
