import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, IndianRupee,
  FileText, Copy, ExternalLink, Calendar, ShieldCheck, MessageSquare, Send, Wallet,
  Package, MapPin, User, Phone
} from 'lucide-react';
import { isBarterLikeCollab } from '@/lib/deals/collabType';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const BrandDealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { session } = useSession();

  const [deal, setDeal] = useState<BrandDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brandFeedback, setBrandFeedback] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isReviewingContent, setIsReviewingContent] = useState(false);
  const [isReleasingPayment, setIsReleasingPayment] = useState(false);
  const [loggedContentLink, setLoggedContentLink] = useState('');
  const [loggedContentNotes, setLoggedContentNotes] = useState('');
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);

  const loadDeal = async () => {
    if (!dealId || !session?.access_token) {
      setDeal(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/brand-dashboard/deals`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        console.error('[BrandDealDetailPage] Failed to fetch deals:', json);
        setDeal(null);
        return;
      }

      const matchedDeal = ((json.deals as BrandDeal[] | undefined) || []).find(
        (item) => String(item?.id || '') === String(dealId)
      ) || null;

      setDeal(matchedDeal);
    } catch (error) {
      console.error('[BrandDealDetailPage] Failed to fetch deal:', error);
      setDeal(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeal();
  }, [dealId, session?.access_token]);

  const normalizedStatus = String(deal?.status || '').trim().toUpperCase().replaceAll(' ', '_');
  const canReviewContent = normalizedStatus === 'CONTENT_DELIVERED' || normalizedStatus === 'REVISION_DONE';
  const paymentMarkedSent = Boolean((deal as any)?.payment_released_at) || normalizedStatus === 'PAYMENT_RELEASED';
  const paymentStatus = String((deal as any)?.payment_status || '').trim().toLowerCase();
  const paymentId = String((deal as any)?.payment_id || '').trim();
  const isEscrowDeal = Boolean(paymentStatus === 'captured' || (paymentId.startsWith('pay_') && Number((deal as any)?.amount_paid || 0) > 0));
  const canReleasePayment = normalizedStatus === 'CONTENT_APPROVED' && !paymentMarkedSent && !isEscrowDeal;
  const directContentLink = String((deal as any)?.content_submission_url || (deal as any)?.content_url || '').trim();
  const directContentNotes = String((deal as any)?.content_notes || '').trim();
  const contentLink = directContentLink || loggedContentLink;
  const contentNotes = directContentNotes || loggedContentNotes;
  const brandApprovalStatus = String((deal as any)?.brand_approval_status || '').trim().toLowerCase();
  
  const requiresShipping = Boolean((deal as any)?.shipping_required) || isBarterLikeCollab(deal);
  const shippingStatus = String((deal as any)?.shipping_status || '').trim().toLowerCase();
  const isAwaitingShipment = requiresShipping && shippingStatus !== 'shipped' && shippingStatus !== 'delivered' && shippingStatus !== 'received';

  useEffect(() => {
    let cancelled = false;

    const loadLoggedContent = async () => {
      if (!deal?.id || directContentLink) {
        setLoggedContentLink('');
        setLoggedContentNotes('');
        return;
      }

      const { data, error } = await supabase
        .from('deal_action_logs')
        .select('event, metadata, created_at')
        .eq('deal_id', deal.id)
        .in('event', ['CONTENT_SUBMITTED', 'REVISION_SUBMITTED'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (cancelled || error || !data?.length) return;

      const latest = data[0] as any;
      const metadata = latest?.metadata || {};
      const links = Array.isArray(metadata?.content_links) ? metadata.content_links : [];
      const fallbackLink = String(metadata?.content_url || links[0] || '').trim();
      const fallbackNotes = String(metadata?.notes || '').trim();

      if (!cancelled) {
        setLoggedContentLink(fallbackLink);
        setLoggedContentNotes(fallbackNotes);
      }
    };

    void loadLoggedContent();

    return () => {
      cancelled = true;
    };
  }, [deal?.id, directContentLink]);

  const patchDeal = async (path: string, body?: Record<string, unknown>) => {
    const token = session?.access_token;
    if (!token) throw new Error('Please log in again.');

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error((data as any)?.error || 'Request failed');
    }
    return data;
  };

  const handleReviewContent = async (status: 'approved' | 'changes_requested') => {
    if (!deal?.id) return;
    if (status === 'changes_requested' && !brandFeedback.trim()) {
      toast.error('Add feedback before requesting changes.');
      return;
    }

    try {
      setIsReviewingContent(true);
      await patchDeal(`/api/deals/${deal.id}/review-content`, {
        status,
        feedback: brandFeedback.trim() || undefined,
      });
      toast.success(status === 'approved' ? 'Content approved.' : 'Changes requested.');
      if (status === 'approved') {
        setBrandFeedback('');
      }
      await loadDeal();
    } catch (error: any) {
      toast.error(error?.message || 'Could not update content review.');
    } finally {
      setIsReviewingContent(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!deal?.id) return;
    if (!paymentReference.trim()) {
      toast.error('Payment reference is required.');
      return;
    }

    try {
      setIsReleasingPayment(true);
      await patchDeal(`/api/deals/${deal.id}/release-payment`, {
        paymentReference: paymentReference.trim(),
        paymentNotes: paymentNotes.trim() || undefined,
      });
      toast.success('Payment marked as sent.');
      setPaymentReference('');
      setPaymentNotes('');
      await loadDeal();
    } catch (error: any) {
      toast.error(error?.message || 'Could not mark payment as sent.');
    } finally {
      setIsReleasingPayment(false);
    }
  };

  const handleProductPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !deal?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    try {
      setIsUploadingProductPhoto(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiBaseUrl()}/api/brand-dashboard/deals/${deal.id}/upload-product-photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Upload failed');

      const imageUrl = json.url;
      
      // Update deal record with new URL
      await patchDeal(`/api/brand-dashboard/deals/${deal.id}/product-photo`, {
        url: imageUrl
      });

      toast.success('Product photo updated!');
      await loadDeal();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingProductPhoto(false);
    }
  };

  const nextStepLabel = useMemo(() => {
    if (canReviewContent) return 'Review the creator content';
    if (canReleasePayment) return 'Mark payment as sent';
    if (isAwaitingShipment) return 'Ship the product to creator';
    if (brandApprovalStatus === 'changes_requested') return 'Waiting for creator revision';
    if (brandApprovalStatus === 'approved' && paymentMarkedSent) return 'Waiting for creator confirmation';
    return 'Track this deal';
  }, [brandApprovalStatus, canReleasePayment, canReviewContent, paymentMarkedSent, isAwaitingShipment]);

  const getStageColor = (status: string | null) => {
    if (!status) return 'bg-slate-500/20 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('content') && s.includes('making')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-purple-500/20 text-purple-400';
    if (s.includes('approved') || s.includes('signed')) return 'bg-emerald-500/20 text-emerald-400';
    if (s.includes('payment') || s.includes('paid')) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision')) return 'bg-amber-500/20 text-amber-400';
    if (s.includes('completed')) return 'bg-green-500/20 text-green-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const copyDealLink = () => {
    if (deal?.id) {
      const link = `${window.location.origin}/deal/${deal.id}`;
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Deal link copied!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-3">Deal not found</h2>
          <Button onClick={() => navigate('/brand-dashboard')} className="bg-purple-600 hover:bg-purple-500">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{deal.brand_name || 'Deal'}</h1>
            {(deal as any).brand_verified && (
              <ShieldCheck className="h-5 w-5 text-blue-400 flex-shrink-0" aria-label="Verified brand" />
            )}
          </div>
          <span className={cn('text-xs px-3 py-1 rounded-full font-medium', getStageColor(deal.status))}>
            {deal.status || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Deal Value Card */}
        <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Deal Value</p>
                <p className="text-2xl font-black text-white">
                  {deal.deal_type === 'barter' ? 'Free products' : formatCurrency(deal.deal_amount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Due Date</p>
                <p className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/40" />
                  {formatDate(deal.due_date)}
                </p>
              </div>
            </div>

            {/* Progress */}
            {deal.progress_percentage != null && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>Progress</span>
                  <span>{deal.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${deal.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Step Card — with actionable context */}
        <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Your Action</p>
            <p className="text-lg font-bold text-white">{nextStepLabel}</p>
            <p className="text-sm text-white/60">
              {canReviewContent
                ? 'Check the submitted post. Approve it if it looks good, or request one clear change with feedback.'
                : canReleasePayment
                  ? 'Add a payment reference (UTR or transaction ID) so the creator knows the payment is on the way. They will be notified automatically.'
                  : isAwaitingShipment
                    ? 'The creator is waiting for the product to start working. Ship it and update the tracking details.'
                    : brandApprovalStatus === 'changes_requested'
                      ? 'The creator has been notified and will re-submit with revisions. You will get an email when the updated link is ready.'
                      : brandApprovalStatus === 'approved' && paymentMarkedSent
                        ? 'Waiting for the creator to confirm the payment has arrived in their account.'
                        : 'Monitor this collaboration. Content and payment updates will appear here.'}
            </p>
            {canReleasePayment && (
              <p className="text-xs text-white/40 border border-white/10 rounded-lg px-3 py-2 mt-2">
                💡 The creator has already approved the content. Add the payment reference to release funds.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Product Photo section - Always visible as requested */}
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Product Photo</p>
              
              {deal.barter_product_image_url ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <img 
                      src={deal.barter_product_image_url} 
                      alt="Product" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Label 
                      htmlFor="product-photo-upload" 
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                    >
                      {isUploadingProductPhoto ? 'Uploading...' : 'Change Photo'}
                    </Label>
                    <input 
                      id="product-photo-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleProductPhotoUpload}
                      disabled={isUploadingProductPhoto}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <Package className="h-6 w-6 text-white/40" />
                    </div>
                    <p className="text-sm font-medium text-white/60 mb-1">No product photo added</p>
                    <p className="text-xs text-white/40 mb-4">Adding a photo helps the creator understand the product better.</p>
                    
                    <Label 
                      htmlFor="product-photo-upload" 
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isUploadingProductPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                      {isUploadingProductPhoto ? 'Uploading...' : 'Upload Photo'}
                    </Label>
                    <input 
                      id="product-photo-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleProductPhotoUpload}
                      disabled={isUploadingProductPhoto}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Deliverables */}
        {deal.deliverables && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Deliverables</p>
              <p className="text-base font-medium text-white">{deal.deliverables}</p>
            </CardContent>
          </Card>
        )}
 
        {/* Shipping & Fulfillment */}
        {requiresShipping && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-white/40">Shipping & Fulfillment</p>
                <div className="flex items-center gap-1.5">
                   <Package className="h-3.5 w-3.5 text-blue-400" />
                   <span className="text-[10px] font-bold text-blue-300 uppercase tracking-tight">
                     {shippingStatus === 'delivered' ? 'Delivered' : shippingStatus === 'shipped' ? 'In Transit' : 'Pending'}
                   </span>
                </div>
              </div>

              {/* Creator's receiving address */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/70">Creator's Delivery Address</p>
                {deal.delivery_address ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-white/40" />
                      <p className="text-sm font-medium text-white">{deal.delivery_name || 'Creator'}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-white/40 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white/80 leading-relaxed">{deal.delivery_address}</p>
                        {(() => {
                          const addr = String(deal.delivery_address || '').trim();
                          const pincodeMatch = addr.match(/(?:^|\D)(\d{6})(?:\D|$)/);
                          const extractedPin = (pincodeMatch ? pincodeMatch[1] : '') || String((deal as any)?.profiles?.pincode || '').trim();
                          if (extractedPin) {
                            return (
                              <p className="text-[11px] font-black mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-tight">
                                PIN: {extractedPin}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    {deal.delivery_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-white/40" />
                        <p className="text-sm text-white/80">{deal.delivery_phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                    <p className="text-xs text-white/40">Waiting for creator to provide delivery address.</p>
                  </div>
                )}
              </div>

              {/* Brand's shipping address (if relevant for returns/contract) */}
              {(deal.brand_address || (deal as any).address) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/70">Your Shipping Address</p>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm text-white/80">{deal.brand_address || (deal as any).address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(contentLink || contentNotes || canReviewContent || brandApprovalStatus === 'changes_requested' || brandApprovalStatus === 'approved') && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Creator Content</p>
                {contentLink ? (() => {
                  const urlParts = contentLink.split('/');
                  const rawFile = urlParts[urlParts.length - 1] || 'content-file';
                  const cleanFile = decodeURIComponent(rawFile).replace(/-\d{13,}\./, '.');
                  const ext = cleanFile.split('.').pop()?.toLowerCase() || '';
                  const isVideo = ['mp4', 'mov', 'webm', 'm4v', 'avi'].includes(ext);
                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                  const fileIcon = isVideo ? '🎬' : isImage ? '🖼️' : '📄';
                  const fileType = isVideo ? 'Video File' : isImage ? 'Image File' : ext.toUpperCase() + ' File';

                  return (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
                          {fileIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{cleanFile}</p>
                          <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
                            <span>{fileType}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="uppercase">.{ext}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex border-t border-white/10">
                        <a
                          href={contentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-purple-300 hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {isVideo ? 'Watch' : 'View'} Content
                        </a>
                        <div className="w-px bg-white/10" />
                        <button
                          onClick={() => { navigator.clipboard.writeText(contentLink); toast.success('Link copied!'); }}
                          className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-white/60">
                    {isAwaitingShipment 
                      ? 'The creator is waiting for the product to start working.' 
                      : 'The creator has not shared a live post link yet.'}
                  </p>
                )}
              </div>

              {contentNotes && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Creator note</p>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{contentNotes}</p>
                </div>
              )}

              {(canReviewContent || brandApprovalStatus === 'changes_requested' || brandApprovalStatus === 'approved') && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Review status</p>
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-medium', getStageColor(deal.status))}>
                      {brandApprovalStatus ? brandApprovalStatus.replace('_', ' ') : 'pending'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-feedback" className="text-[11px] uppercase tracking-wider text-white/50">
                      Feedback for creator
                    </Label>
                    <Textarea
                      id="brand-feedback"
                      value={brandFeedback}
                      onChange={(e) => setBrandFeedback(e.target.value)}
                      placeholder="Optional when approving. Required if you need changes."
                      className="min-h-[96px] bg-white/5 border-white/10 text-white placeholder:text-white/35"
                    />
                  </div>

                  {/* Context hint based on approval status */}
                  {canReviewContent && (
                    <p className="text-xs text-white/50 bg-white/[0.03] rounded-lg px-3 py-2">
                      ✅ Creator submitted their post. Review and approve or request changes.
                    </p>
                  )}
                  {brandApprovalStatus === 'approved' && (
                    <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                      ✅ You approved the content. Scroll down to Payment to mark payment sent.
                    </p>
                  )}
                  {brandApprovalStatus === 'changes_requested' && (
                    <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      🔔 Feedback sent to creator. You will be notified when they update the link.
                    </p>
                  )}

                  {canReviewContent && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isReviewingContent}
                        onClick={() => handleReviewContent('changes_requested')}
                        className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button
                        type="button"
                        disabled={isReviewingContent}
                        onClick={() => handleReviewContent('approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Content
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contract */}
        {deal.contract_file_url && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Contract</p>
              <Button
                onClick={() => window.open(deal.contract_file_url!, '_blank')}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                View Contract
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        {deal.deal_type !== 'barter' && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Payment</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Amount</span>
                  <span className="font-semibold text-white">{formatCurrency(deal.deal_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Expected date</span>
                  <span className="font-semibold text-white">{formatDate(deal.payment_expected_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Status</span>
                  <span className="font-semibold text-white">
                    {paymentMarkedSent ? 'Sent to creator' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Escrow Receipt Link */}
              {(deal as any).escrow_receipt_url && (
                <a
                  href={(deal as any).escrow_receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  View Escrow Payment Receipt
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}

              {canReviewContent && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="h-4 w-4" />
                    <p className="text-sm font-bold uppercase tracking-tight">Review Period Active</p>
                  </div>
                  <p className="text-xs text-amber-100/70 leading-relaxed">
                    You have <strong>72 hours</strong> to review this content. If no action is taken, the funds held in escrow will be <strong>automatically released</strong> to the creator to ensure fair payment.
                  </p>
                </div>
              )}

              {canReleasePayment && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <p className="text-xs text-white/40 bg-white/[0.03] rounded-lg px-3 py-2 mb-1">
                    💡 Content approved. Add a payment reference so the creator knows the payment is on the way.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="payment-reference" className="text-[11px] uppercase tracking-wider text-white/50">
                      Payment reference (UTR / Transaction ID)
                    </Label>
                    <Input
                      id="payment-reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="UTR, transaction ID, or bank reference"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment-notes" className="text-[11px] uppercase tracking-wider text-white/50">
                      Note to creator
                    </Label>
                    <Textarea
                      id="payment-notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Optional note about when the payment should reflect."
                      className="min-h-[96px] bg-white/5 border-white/10 text-white placeholder:text-white/35"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleReleasePayment}
                    disabled={isReleasingPayment}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isReleasingPayment ? 'Marking Payment...' : 'Mark Payment Sent'}
                  </Button>
                </div>
              )}

              {normalizedStatus === 'CONTENT_APPROVED' && isEscrowDeal && !paymentMarkedSent && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm font-bold uppercase tracking-tight">Payout Processing</p>
                  </div>
                  <p className="text-xs text-emerald-100/70 leading-relaxed">
                    Funds are securely held in escrow. Since you have approved the content, our finance team is now processing the payout to the creator. No further action is required from your side.
                  </p>
                </div>
              )}

              {paymentMarkedSent && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <p className="text-sm font-semibold text-emerald-200 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment sent to creator
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Marked on {formatDate((deal as any).payment_released_at || deal.updated_at)}{deal.utr_number ? ` • Ref ${deal.utr_number}` : ''}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={copyDealLink}
            className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white rounded-xl flex items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Deal Link
          </Button>
        </div>
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDealDetailPage;
