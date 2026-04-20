import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/bottom-sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Send, Calendar, IndianRupee, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';

interface QuickOfferSheetProps {
    isOpen: boolean;
    onClose: (didSubmit?: boolean) => void;
    creator: any;
    isDark: boolean;
}


const DELIVERABLE_OPTIONS = [
    { label: 'Reel', value: 'Instagram Reel' },
    { label: 'Story', value: 'Story' },
    { label: 'Post', value: 'Post' },
];

export const QuickOfferSheet: React.FC<QuickOfferSheetProps> = ({
    isOpen,
    onClose,
    creator,
    isDark
}) => {
    const { profile, session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Form State
    const [budget, setBudget] = useState('');
    const [deliverables, setDeliverables] = useState<string[]>(['Instagram Reel']);
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (creator && isOpen) {
            setBudget(creator.starting_price?.toString() || '');
            // Default deadline to 14 days out
            const date = new Date();
            date.setDate(date.getDate() + 14);
            setDeadline(date.toISOString().split('T')[0]);
            setIsSuccess(false);
        }
    }, [creator, isOpen]);

    const toggleDeliverable = (val: string) => {
        if (deliverables.includes(val)) {
            setDeliverables(deliverables.filter(d => d !== val));
        } else {
            setDeliverables([...deliverables, val]);
        }
    };

    const handleSubmit = async () => {
        if (!budget || deliverables.length === 0 || !deadline) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        triggerHaptic(HapticPatterns.medium);

        try {
            const apiBaseUrl = getApiBaseUrl();
            const brandName = profile?.business_name || profile?.first_name || profile?.full_name || 'Brand';
            const brandEmail = profile?.email || session?.user?.email || '';
            const descriptionValue = description || `Marketing collaboration for ${brandName}`;

            const payload = {
                brand_name: brandName,
                brand_email: brandEmail,
                brand_instagram: (profile as any)?.instagram_handle || null,
                brand_logo_url: profile?.avatar_url || null,
                collab_type: 'paid',
                exact_budget: parseFloat(budget),
                campaign_description: descriptionValue,
                deliverables: deliverables,
                deadline: deadline,
                // These are required by the backend API 
                campaign_category: 'General',
                usage_rights: false,
                requires_shipping: false
            };

            const submitHandle = creator.instagram_handle || creator.username;
            const response = await fetch(`${apiBaseUrl}/api/collab/${submitHandle}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                setIsSuccess(true);
                triggerHaptic(HapticPatterns.success);
                toast.success('Offer sent successfully!');
                setTimeout(() => {
                    onClose(true);
                }, 2000);
            } else {

                throw new Error(data.error || 'Failed to send offer');
            }
        } catch (error: any) {
            console.error('[QuickOfferSheet] Error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!creator) return null;

    return (
        <BottomSheet 
            open={isOpen} 
            onClose={onClose} 
            title={`Send Offer to ${creator.first_name}`}
            className={cn(isDark ? "bg-[#0F172A]" : "bg-white")}
        >
            <div className="space-y-8 py-4">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Offer Sent!</h3>
                        <p className="text-muted-foreground text-sm max-w-[240px]">
                            {creator.first_name} has been notified. You can track this in your Collabs tab.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Creator Summary */}
                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-secondary/10 border border-border/50">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20">
                                <img 
                                    src={creator.avatar_url || `https://ui-avatars.com/api/?name=${creator.first_name}`} 
                                    alt={creator.username} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div>
                                <p className="text-sm font-black italic uppercase tracking-widest">{creator.first_name}</p>
                                <p className="text-xs text-muted-foreground">@{creator.username}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Base Rate</p>
                                <p className="text-lg font-black text-primary italic">₹{creator.starting_price?.toLocaleString() || '---'}</p>
                            </div>
                        </div>

                        {/* Deliverables */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest opacity-60">Deliverables</Label>
                            <div className="flex flex-wrap gap-2">
                                {DELIVERABLE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleDeliverable(opt.value)}
                                        className={cn(
                                            "px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2",
                                            deliverables.includes(opt.value) 
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                                : "bg-secondary/20 border-transparent text-muted-foreground hover:bg-secondary/40"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget & Date Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-black uppercase tracking-widest opacity-60">Your Offer (₹)</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="h-14 pl-10 rounded-2xl bg-secondary/10 border-transparent font-bold text-lg focus:border-primary/50 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-black uppercase tracking-widest opacity-60">Deadline</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="h-14 pl-10 rounded-2xl bg-secondary/10 border-transparent font-bold text-sm focus:border-primary/50 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Campaign Brief */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest opacity-60">Campaign Brief (Optional)</Label>
                            <Input 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-14 px-4 rounded-2xl bg-secondary/10 border-transparent font-medium text-sm focus:border-primary/50 transition-all"
                                placeholder="Describe your requirements..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        SENDING...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-5 w-5 fill-current" />
                                        SEND SECURE OFFER
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center mt-4 text-muted-foreground font-medium uppercase tracking-widest italic flex items-center justify-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                Protected by Creator Armour
                            </p>
                        </div>
                    </>
                )}
            </div>
        </BottomSheet>
    );
};
