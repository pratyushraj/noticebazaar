import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/bottom-sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Calendar, IndianRupee, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import type { DealTemplate } from '@/types';

interface QuickOfferSheetProps {
    isOpen: boolean;
    onClose: (didSubmit?: boolean) => void;
    creator: any;
    isDark: boolean;
}

const decodeHtmlEntities = (value: unknown) => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (typeof document === 'undefined') return text;

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value.trim();
};

const formatCurrency = (value: number | null | undefined) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return `₹${num.toLocaleString('en-IN')}`;
};

const normalizeCreatorName = (creator: any) => {
    return decodeHtmlEntities(
        creator?.first_name || creator?.business_name || creator?.name || creator?.username || 'Creator'
    );
};

const normalizeUsername = (creator: any) => {
    const handle = decodeHtmlEntities(creator?.instagram_handle || creator?.username || '');
    return String(handle || '').replace(/^@+/, '');
};

const getFallbackOptions = (creator: any) => {
    const options: Array<{
        key: string;
        label: string;
        rate: number;
        deliverables: string[];
        type: 'paid' | 'barter';
        description?: string;
    }> = [];
    const reelRate = Number(creator?.avg_rate_reel || creator?.reel_price || creator?.starting_price || 0);
    const storyRate = Number(creator?.story_price || creator?.typical_story_rate || 0);
    const postRate = Number(creator?.post_price || creator?.typical_post_rate || 0);
    const barterValue = Number(
        creator?.barter_min_value ||
        creator?.suggested_barter_value_min ||
        creator?.suggested_barter_value_max ||
        0
    );

    if (reelRate > 0) {
        options.push({ key: 'reel', label: 'Reel', rate: reelRate, deliverables: ['Instagram Reel'], type: 'paid' });
    }
    if (storyRate > 0) {
        options.push({ key: 'story', label: 'Story', rate: storyRate, deliverables: ['Story'], type: 'paid' });
    }
    if (postRate > 0) {
        options.push({ key: 'post', label: 'Post', rate: postRate, deliverables: ['Post'], type: 'paid' });
    }
    if (barterValue > 0) {
        options.push({
            key: 'barter',
            label: 'Free products as payment',
            rate: barterValue,
            deliverables: ['Product Review'],
            type: 'barter',
            description: 'Send product instead of cash payment',
        });
    }

    if (options.length === 0) {
        const baseRate = Number(creator?.starting_price || 0);
        options.push({
            key: 'general',
            label: 'Creator Offer',
            rate: Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 0,
            deliverables: ['Instagram Reel'],
            type: 'paid',
        });
    }

    return options;
};

const getCreatorPackages = (creator: any) => {
    const templates = Array.isArray(creator?.deal_templates)
        ? creator.deal_templates.filter((template: any) => template?.id !== '__creator_profile_meta__' && template?.type !== 'creator_profile_meta')
        : [];
    const validTemplates = templates
        .map((template: DealTemplate, index: number) => ({
            key: String(template?.id || `template-${index}`),
            label: String(template?.name || `Package ${index + 1}`),
            rate: Number(template?.rate || 0),
            deliverables: Array.isArray(template?.deliverables) && template.deliverables.length > 0
                ? template.deliverables
                : ['Instagram Reel'],
            description: template?.description || '',
            type: template?.type === 'barter' ? 'barter' : 'paid',
        }))
        .filter((template) => template.rate > 0 || template.type === 'barter');

    return validTemplates.length > 0 ? validTemplates : getFallbackOptions(creator);
};

export const QuickOfferSheet: React.FC<QuickOfferSheetProps> = ({
    isOpen,
    onClose,
    creator,
    isDark
}) => {
    const { profile, session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const creatorName = normalizeCreatorName(creator);
    const creatorUsername = normalizeUsername(creator);
    const creatorPackages = getCreatorPackages(creator);
    
    // Form State
    const [budget, setBudget] = useState('');
    const [selectedPackageKey, setSelectedPackageKey] = useState('');
    const [deliverables, setDeliverables] = useState<string[]>([]);
    const [collabType, setCollabType] = useState<'paid' | 'barter'>('paid');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (creator && isOpen) {
            const initialPackage = getCreatorPackages(creator)[0];
            setSelectedPackageKey(initialPackage?.key || '');
            setBudget(initialPackage?.rate ? String(initialPackage.rate) : '');
            setDeliverables(initialPackage?.deliverables || ['Instagram Reel']);
            setCollabType(initialPackage?.type === 'barter' ? 'barter' : 'paid');
            // Default deadline to 14 days out
            const date = new Date();
            date.setDate(date.getDate() + 14);
            setDeadline(date.toISOString().split('T')[0]);
            setIsSuccess(false);
            setDescription('');
        }
    }, [creator, isOpen]);

    const handlePackageChange = (pkgKey: string) => {
        const selectedPackage = creatorPackages.find((pkg) => pkg.key === pkgKey);
        setSelectedPackageKey(pkgKey);
        if (selectedPackage) {
            setBudget(String(selectedPackage.rate || ''));
            setDeliverables(selectedPackage.deliverables || []);
            setCollabType(selectedPackage.type === 'barter' ? 'barter' : 'paid');
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
                collab_type: collabType,
                exact_budget: collabType === 'paid' ? parseFloat(budget) : null,
                barter_value: collabType === 'barter' ? parseFloat(budget) : null,
                campaign_description: descriptionValue,
                deliverables: deliverables,
                deadline: deadline,
                // These are required by the backend API 
                campaign_category: 'General',
                usage_rights: false,
                requires_shipping: false
            };

            const submitHandle = creatorUsername;
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
            title={`Send Offer to ${creatorName}`}
            className="bg-[#F5F8FB]"
        >
            <div className="space-y-7 py-2 text-slate-900">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Offer Sent!</h3>
                        <p className="text-muted-foreground text-sm max-w-[240px]">
                            {creatorName} has been notified. You can track this in your Collabs tab.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Creator Summary */}
                        <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                            <div className="w-14 h-14 rounded-[18px] overflow-hidden border border-slate-200 bg-slate-50">
                                <img 
                                    src={creator.avatar_url || `https://ui-avatars.com/api/?name=${creatorName}`}
                                    alt={creatorUsername || creatorName}
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[17px] font-black tracking-tight text-slate-900 truncate">{creatorName}</p>
                                <p className="text-[12px] font-bold tracking-wide text-slate-500 lowercase truncate">@{creatorUsername || 'creator'}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{creatorPackages.length > 1 ? 'Starting At' : 'Base Rate'}</p>
                                <p className="text-[24px] font-black tracking-tight text-emerald-500">
                                    {creatorPackages[0]?.type === 'barter'
                                        ? 'Barter'
                                        : formatCurrency(Number(creatorPackages[0]?.rate || 0)) || '₹---'}
                                </p>
                                {creatorPackages[0]?.type === 'barter' && Number(creatorPackages[0]?.rate || 0) > 0 ? (
                                    <p className="text-[11px] font-bold text-slate-500">{formatCurrency(Number(creatorPackages[0]?.rate || 0))} value</p>
                                ) : null}
                            </div>
                        </div>

                        {/* Creator Packages */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                {creatorPackages.length > 1 ? 'Services' : 'Creator Rate'}
                            </Label>
                            <div className="grid gap-4">
                                {creatorPackages.map((pkg) => {
                                    const isSelected = selectedPackageKey === pkg.key;
                                    return (
                                    <button
                                        key={pkg.key}
                                        onClick={() => handlePackageChange(pkg.key)}
                                        className={cn(
                                            "relative w-full rounded-[28px] px-5 py-5 text-left transition-all duration-200",
                                            isSelected
                                                ? "border-2 border-emerald-500 bg-white shadow-[0_16px_32px_rgba(34,197,94,0.14)]"
                                                : "border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:-translate-y-0.5"
                                        )}
                                    >
                                        {isSelected ? (
                                            <div className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white shadow-sm">
                                                Selected
                                            </div>
                                        ) : null}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-[20px] font-black tracking-tight text-slate-900">{pkg.label}</p>
                                                <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500">
                                                    {pkg.deliverables.join(' • ')}
                                                </p>
                                                {pkg.description ? (
                                                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-400">{pkg.description}</p>
                                                ) : null}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className={cn(
                                                    "text-[24px] font-black tracking-tight",
                                                    pkg.type === 'barter' ? "text-slate-900" : isSelected ? "text-emerald-500" : "text-slate-900"
                                                )}>
                                                    {pkg.type === 'barter'
                                                        ? 'Barter'
                                                        : formatCurrency(pkg.rate) || '₹---'}
                                                </p>
                                                {pkg.type === 'barter' && pkg.rate > 0 ? (
                                                    <p className="mt-1 text-[11px] font-bold text-slate-500">{formatCurrency(pkg.rate)} value</p>
                                                ) : null}
                                                <div className={cn(
                                                    "mt-4 inline-flex h-11 items-center justify-center rounded-full px-6 text-[13px] font-black transition-all",
                                                    isSelected
                                                        ? "bg-emerald-500 text-white shadow-[0_10px_22px_rgba(34,197,94,0.2)]"
                                                        : "border border-slate-200 bg-slate-50 text-slate-600"
                                                )}>
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Budget & Date Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-black uppercase tracking-widest opacity-60">
                                    {collabType === 'barter' ? 'Product Value (₹)' : 'Your Offer (₹)'}
                                </Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="h-14 rounded-2xl border border-slate-200 bg-white pl-10 font-black text-lg text-slate-900 shadow-sm focus:border-emerald-500/50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-black uppercase tracking-widest opacity-60 text-slate-500">Deadline</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="h-14 rounded-2xl border border-slate-200 bg-white pl-10 font-bold text-sm text-slate-900 shadow-sm focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Campaign Brief */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest opacity-60 text-slate-500">Campaign Brief (Optional)</Label>
                            <Input 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 font-medium text-sm text-slate-900 shadow-sm focus:border-emerald-500/50"
                                placeholder="Describe your requirements..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex h-16 w-full items-center justify-center gap-3 rounded-[2rem] bg-[#0FA47F] text-lg font-black text-white shadow-[0_14px_30px_rgba(15,164,127,0.24)] transition-all active:scale-[0.98] hover:bg-emerald-600"
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
                            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] font-medium uppercase tracking-widest italic text-slate-400">
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
