import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/bottom-sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Calendar, IndianRupee, Zap, Sparkles, CheckCircle2, Truck, Package, Upload, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import type { DealTemplate } from '@/types';

import { safeAvatarSrc } from '@/lib/utils/image';

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
        options.push({ key: 'reel', label: 'Reel', rate: reelRate, deliverables: ['Reel'], type: 'paid' });
    }
    if (storyRate > 0) {
        options.push({ key: 'story', label: 'Story', rate: storyRate, deliverables: ['Story'], type: 'paid' });
    }
    if (postRate > 0) {
        options.push({ key: 'post', label: 'Post', rate: postRate, deliverables: ['Post'], type: 'paid' });
    }
    options.push({
        key: 'barter',
        label: '🎁 Product Exchange',
        rate: barterValue > 0 ? barterValue : 0,
        deliverables: ['Product Review / Unboxing', '1 Story mention', 'No paid usage rights'],
        type: 'barter',
        description: 'Product unboxing or review with no paid usage rights.',
    });

    if (options.length === 0) {
        const baseRate = Number(creator?.starting_price || 0);
        options.push({
            key: 'general',
            label: 'Creator Offer',
            rate: Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 0,
            deliverables: ['Creator deliverable'],
            type: 'paid',
        });
    }

    return options;
};

const getCreatorPackages = (creator: any) => {
    const templates = Array.isArray(creator?.deal_templates) ? creator.deal_templates : [];
    const validTemplates = templates
        .map((template: DealTemplate, index: number) => ({
            key: String(template?.id || `template-${index}`),
            label: String((template as any)?.label || template?.name || `Package ${index + 1}`),
            rate: Number((template as any)?.budget || template?.rate || 0),
            deliverables: Array.isArray(template?.deliverables) && template.deliverables.length > 0
                ? template.deliverables
                : [String((template as any)?.label || template?.name || `Package ${index + 1}`)],
            description: template?.description || '',
            type: template?.type === 'barter' ? 'barter' : 'paid',
        }))
        .filter((template) => template.rate > 0 || template.type === 'barter');

    let finalPackages = [...validTemplates];
    
    if (finalPackages.length === 0) {
        finalPackages = getFallbackOptions(creator);
    }

    // Ensure barter is always the last card if not already present
    if (!finalPackages.some(t => t.type === 'barter')) {
        const barterValue = Number(creator?.barter_min_value || 0);
        finalPackages.push({
            key: 'barter-default',
            label: '🎁 Product Exchange',
            rate: barterValue,
            deliverables: ['Product unboxing / review', '1 Story mention', 'No paid usage rights'],
            description: 'Product unboxing or review with no paid usage rights.',
            type: 'barter',
        });
    }

    return finalPackages;
};

export const QuickOfferSheet: React.FC<QuickOfferSheetProps> = ({
    isOpen,
    onClose,
    creator,
    isDark
}) => {
    const { profile, session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
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
    const [requiresShipping, setRequiresShipping] = useState(false);
    const [barterProductName, setBarterProductName] = useState('');
    const [barterProductImageUrl, setBarterProductImageUrl] = useState('');
    const [barterImageUploading, setBarterImageUploading] = useState(false);

    useEffect(() => {
        if (creator && isOpen) {
            const initialPackage = getCreatorPackages(creator)[0];
            setSelectedPackageKey(initialPackage?.key || '');
            setBudget(initialPackage?.rate ? String(initialPackage.rate) : '');
            setDeliverables(initialPackage?.deliverables || []);
            setCollabType(initialPackage?.type === 'barter' ? 'barter' : 'paid');
            // Default deadline to 14 days out
            const date = new Date();
            date.setDate(date.getDate() + 14);
            setDeadline(date.toISOString().split('T')[0]);
            setIsSuccess(false);
            setDescription('');
            setRequiresShipping(initialPackage?.type === 'barter');
            setBarterProductName('');
            setBarterProductImageUrl('');
        }
    }, [creator, isOpen]);

    const handleBarterImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            toast.error('Please upload a JPEG, PNG, WebP, or GIF image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB.');
            return;
        }

        setBarterImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const apiBaseUrl = getApiBaseUrl();
            const res = await fetch(
                `${apiBaseUrl}/api/collab/${encodeURIComponent(creatorUsername)}/upload-barter-image`,
                {
                    method: 'POST',
                    body: formData,
                }
            );
            const data = await res.json().catch(() => ({}));
            if (data.success && data.url) {
                setBarterProductImageUrl(data.url);
                toast.success('Product image uploaded.');
            } else {
                toast.error(data.error || 'Failed to upload image.');
            }
        } catch {
            toast.error('Failed to upload image.');
        } finally {
            setBarterImageUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handlePackageChange = (pkgKey: string) => {
        const selectedPackage = creatorPackages.find((pkg) => pkg.key === pkgKey);
        setSelectedPackageKey(pkgKey);
        if (selectedPackage) {
            setBudget(String(selectedPackage.rate || ''));
            setDeliverables(selectedPackage.deliverables || []);
            setCollabType(selectedPackage.type === 'barter' ? 'barter' : 'paid');
            
            // Auto-detect shipping requirement based on package label/description
            const needsShipping = 
                selectedPackage.type === 'barter' || 
                /product|ship|deliver|unboxing|physical/i.test(selectedPackage.label) ||
                /product|ship|deliver|unboxing|physical/i.test(selectedPackage.description);
                
            setRequiresShipping(needsShipping);
        }
    };

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        triggerHaptic(HapticPatterns.light);

        try {
            const apiBaseUrl = getApiBaseUrl();
            const brandEmail = profile?.email || session?.user?.email || '';
            const selectedPackage = creatorPackages.find(p => p.key === selectedPackageKey);
            const packageName = selectedPackage?.label || 'Custom';
            
            const formData = {
                budget,
                deliverables,
                collabType,
                deadline,
                description: `${description} ||Package: ${packageName}`,
                selected_package_id: selectedPackage?.key || null,
                selected_package_label: packageName,
                selected_package_type: selectedPackage?.type || collabType,
                selected_addons: Array.isArray((selectedPackage as any)?.addons) ? (selectedPackage as any).addons : [],
                content_quantity: deliverables.length || null,
                content_duration: null,
                content_requirements: description ? [description] : [],
                barter_types: collabType === 'barter' ? ['product_exchange'] : [],
                requiresShipping,
                barterProductName,
                barterProductImageUrl
            };

            const response = await fetch(`${apiBaseUrl}/api/collab/${creatorUsername}/save-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_email: brandEmail,
                    form_data: formData
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Draft saved!', {
                    description: 'You can resume this offer anytime from your drafts.',
                });
                triggerHaptic(HapticPatterns.success);
            } else {
                throw new Error(data.error || 'Failed to save draft');
            }
        } catch (error: any) {
            console.error('[QuickOfferSheet] Save Draft Error:', error);
            toast.error(error.message || 'Failed to save draft. Please try again.');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSubmit = async () => {
        const needsProductDetails = collabType === 'barter' || requiresShipping;
        if (!budget || deliverables.length === 0 || !deadline || (needsProductDetails && (!barterProductName || !barterProductImageUrl))) {
            toast.error(needsProductDetails
                ? 'Please fill in all required fields including product details and photo'
                : 'Please fill in budget, deliverables, and deadline');
            return;
        }

        setIsSubmitting(true);
        triggerHaptic(HapticPatterns.medium);

        try {
            const apiBaseUrl = getApiBaseUrl();
            const brandEmail = profile?.email || session?.user?.email || '';
            const selectedPackage = creatorPackages.find(p => p.key === selectedPackageKey);
            const packageName = selectedPackage?.label || 'Custom';
            const descriptionValue = `${description || `Marketing collaboration for ${brandName}`} ||Package: ${packageName}`;

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
                selected_package_id: selectedPackage?.key || null,
                selected_package_label: packageName,
                selected_package_type: selectedPackage?.type || collabType,
                selected_addons: Array.isArray((selectedPackage as any)?.addons) ? (selectedPackage as any).addons : [],
                content_quantity: deliverables.length || null,
                content_duration: null,
                content_requirements: description ? [description] : [],
                barter_types: collabType === 'barter' ? ['product_exchange'] : [],
                deadline: deadline,
                // These are required by the backend API 
                campaign_category: 'General',
                usage_rights: false,
                requires_shipping: requiresShipping,
                barter_product_name: barterProductName || null,
                barter_product_image_url: barterProductImageUrl || null
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
                                    src={safeAvatarSrc(creator.avatar_url) || `https://ui-avatars.com/api/?name=${creatorName}`}
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
                                        inputMode="numeric"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        enterKeyHint="done"
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
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        enterKeyHint="done"
                                        className="h-14 rounded-2xl border border-slate-200 bg-white pl-10 font-bold text-sm text-slate-900 shadow-sm focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Any other requirements */}
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest opacity-60 text-slate-500">Any other requirements</Label>
                            <Input 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                enterKeyHint="done"
                                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 font-medium text-sm text-slate-900 shadow-sm focus:border-emerald-500/50"
                                placeholder="Give 1–2 reference videos (optional but recommended)"
                            />
                        </div>

                        {/* Shipping Toggle */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic(HapticPatterns.light);
                                    setRequiresShipping(!requiresShipping);
                                }}
                                className={cn(
                                    "w-full rounded-2xl p-4 flex items-center justify-between transition-all border",
                                    requiresShipping 
                                        ? "bg-blue-50 border-blue-200 shadow-sm" 
                                        : "bg-white border-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        requiresShipping ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[14px] font-black text-slate-900">Physical Product Shipment</p>
                                        <p className="text-[11px] font-bold text-slate-500">Brand will ship a product to the creator</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-12 h-6 rounded-full relative transition-all duration-300",
                                    requiresShipping ? "bg-blue-500" : "bg-slate-200"
                                )}>
                                    <div className={cn(
                                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                        requiresShipping ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </div>
                            </button>
                        </div>

                        {/* Product Image & Name Upload - Always visible to ensure every deal has a visual asset */}
                        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                        Product Details
                                    </Label>
                                    <Input 
                                        placeholder="Enter product name..."
                                        value={barterProductName}
                                        onChange={(e) => setBarterProductName(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-bold text-slate-900 focus-visible:ring-emerald-500/20"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                        Product Photo
                                    </Label>
                                    
                                    {barterProductImageUrl ? (
                                        <div className="relative group">
                                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                                <img 
                                                    src={barterProductImageUrl} 
                                                    alt="Product preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => setBarterProductImageUrl('')}
                                                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 transition-all transform hover:scale-110"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                                                Tap image to remove and change
                                            </p>
                                        </div>
                                    ) : (
                                        <label className={cn(
                                            "flex flex-col items-center justify-center w-full aspect-[2/1] rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                                            barterImageUploading 
                                                ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed" 
                                                : "border-slate-200 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/10 shadow-inner"
                                        )}>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                    {barterImageUploading ? (
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-6 h-6" />
                                                    )}
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="text-[14px] font-black text-slate-900">
                                                        {barterImageUploading ? 'Uploading...' : 'Add Product Photo'}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Required for product review</p>
                                                </div>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleBarterImageChange}
                                                disabled={barterImageUploading}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-3">
                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting || isSavingDraft}
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

                            <Button 
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={isSubmitting || isSavingDraft}
                                className="flex h-14 w-full items-center justify-center gap-2 rounded-[1.75rem] border-slate-200 bg-white text-[13px] font-black text-slate-600 shadow-sm transition-all active:scale-[0.98] hover:bg-slate-50 hover:border-slate-300"
                            >
                                {isSavingDraft ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        SAVING...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        SAVE AS DRAFT
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
