"use client";

import React, { useState } from 'react';
import { Settings, Check, Plus, X, Globe, DollarSign, Tag, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { cn } from '@/lib/utils';
import { typography, animations } from '@/lib/design-system';
import { BaseCard } from '@/components/ui/card-variants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface CollabLinkSettingsProps {
    profile: Profile | null;
    onUpdate: () => void;
}

const CollabLinkSettings: React.FC<CollabLinkSettingsProps> = ({ profile, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [openToCollabs, setOpenToCollabs] = useState(profile?.open_to_collabs ?? true);
    const [avgRate, setAvgRate] = useState(profile?.avg_rate_reel?.toString() ?? '');
    const [niches, setNiches] = useState<string[]>(profile?.content_niches ?? []);
    const [newNiche, setNewNiche] = useState('');
    const [pastBrands, setPastBrands] = useState<string[]>(profile?.past_brands ?? []);
    const [newBrand, setNewBrand] = useState('');

    const handleSave = async () => {
        if (!profile?.id) return;

        setLoading(true);
        triggerHaptic(HapticPatterns.medium);

        try {
            const { error } = await (supabase
                .from('profiles') as any)
                .update({
                    open_to_collabs: openToCollabs,
                    avg_rate_reel: avgRate ? parseFloat(avgRate) : null,
                    content_niches: niches,
                    past_brands: pastBrands,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (error) throw error;

            toast.success('Collab settings updated!');
            triggerHaptic(HapticPatterns.success);
            onUpdate();
        } catch (error) {
            console.error('Error updating collab settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const addNiche = () => {
        if (newNiche.trim() && !niches.includes(newNiche.trim())) {
            setNiches([...niches, newNiche.trim()]);
            setNewNiche('');
            triggerHaptic(HapticPatterns.light);
        }
    };

    const removeNiche = (nicheToRemove: string) => {
        setNiches(niches.filter(n => n !== nicheToRemove));
        triggerHaptic(HapticPatterns.light);
    };

    const addBrand = () => {
        if (newBrand.trim() && !pastBrands.includes(newBrand.trim())) {
            setPastBrands([...pastBrands, newBrand.trim()]);
            setNewBrand('');
            triggerHaptic(HapticPatterns.light);
        }
    };

    const removeBrand = (brandToRemove: string) => {
        setPastBrands(pastBrands.filter(b => b !== brandToRemove));
        triggerHaptic(HapticPatterns.light);
    };

    return (
        <BaseCard variant="secondary" className="p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className={cn(typography.h4, "text-white font-bold")}>Collab Link Settings</h3>
            </div>

            <div className="space-y-6">
                {/* Visibility Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            Public Status
                        </Label>
                        <p className="text-xs text-white/50">Allow brands to send you requests via link.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="open-to-collabs"
                            checked={openToCollabs}
                            onCheckedChange={(checked) => setOpenToCollabs(checked === true)}
                            className="w-6 h-6 border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        Standard Reel Rate (₹)
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            value={avgRate}
                            onChange={(e) => setAvgRate(e.target.value)}
                            placeholder="e.g. 15000"
                            className="bg-white/5 border-white/10 text-white pl-8 focus:ring-purple-500/50"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">₹</span>
                    </div>
                    <p className="text-[10px] text-white/40">This helps brands understand your starting price point.</p>
                </div>

                {/* Niches */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        Content Niches
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={newNiche}
                            onChange={(e) => setNewNiche(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                            placeholder="Add niche (e.g. Fashion)"
                            className="bg-white/5 border-white/10 text-white focus:ring-purple-500/50"
                        />
                        <button
                            onClick={addNiche}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        <AnimatePresence>
                            {niches.map((niche) => (
                                <motion.div
                                    key={niche}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 gap-1.5 px-2.5 py-1">
                                        {niche}
                                        <button onClick={() => removeNiche(niche)} className="hover:text-white transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                            {niches.length === 0 && (
                                <p className="text-xs text-white/30 italic">No niches added yet.</p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Past Brands */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                        Trusted By (Past Brands)
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                            placeholder="Add brand name (e.g. Nike)"
                            className="bg-white/5 border-white/10 text-white focus:ring-purple-500/50"
                        />
                        <button
                            onClick={addBrand}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        <AnimatePresence>
                            {pastBrands.map((brand) => (
                                <motion.div
                                    key={brand}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge className="bg-white/10 text-white border-white/20 gap-1.5 px-2.5 py-1">
                                        {brand}
                                        <button onClick={() => removeBrand(brand)} className="hover:text-red-400 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                            {pastBrands.length === 0 && (
                                <p className="text-xs text-white/30 italic">Add brands you've worked with for social proof.</p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10">
                <motion.button
                    onClick={handleSave}
                    disabled={loading}
                    whileTap={animations.microTap}
                    className={cn(
                        "w-full min-h-[48px] rounded-xl flex items-center justify-center gap-2",
                        "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
                        "shadow-lg shadow-purple-500/20 text-white font-bold transition-all",
                        "disabled:opacity-50 disabled:grayscale"
                    )}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </motion.button>
            </div>
        </BaseCard>
    );
};

export default CollabLinkSettings;
