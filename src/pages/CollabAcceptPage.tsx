"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';

interface PreviewData {
  success: boolean;
  alreadyHandled?: boolean;
  status?: string;
  message?: string;
  brand_name: string;
  collab_type: string;
  deal_type_label: string;
  amount: number | null;
  deliverables: string[];
  deadline: string | null;
  creator_email?: string;
  expires_at?: string;
}

export default function CollabAcceptPage() {
  const { requestToken } = useParams<{ requestToken: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const verified = searchParams.get('verified') === 'true';

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [success, setSuccess] = useState<{ dealId: string; needsDeliveryDetails?: boolean } | null>(null);

  useEffect(() => {
    if (!requestToken) {
      setPreviewError('Invalid link');
      setLoading(false);
      return;
    }
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/collab/accept/preview/${encodeURIComponent(requestToken)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPreview(data);
          setPreviewError(null);
        } else {
          setPreviewError(data.message || data.error || 'Invalid link');
          if (data.error === 'expired') {
            setPreviewError('This link has expired');
          }
        }
      })
      .catch(() => setPreviewError('Something went wrong'))
      .finally(() => setLoading(false));
  }, [requestToken]);

  // When landed with ?verified=true and we have session, auto-confirm once
  useEffect(() => {
    if (!verified || !requestToken || !preview?.success || preview.alreadyHandled || success) return;
    if (sessionLoading || !session?.access_token) return;
    if (confirming) return;

    setConfirming(true);
    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/collab-requests/accept/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ requestToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSuccess({
            dealId: data.deal?.id,
            needsDeliveryDetails: data.needs_delivery_details,
          });
          toast.success('Deal accepted. Contract has been generated and sent to the brand.');
          if (data.deal?.id) {
            if (data.needs_delivery_details) {
              navigate(`/creator-contracts/${data.deal.id}/delivery-details`, { replace: true });
            } else {
              navigate(`/creator-contracts/${data.deal.id}`, { replace: true });
            }
          }
        } else {
          setConfirming(false);
          toast.error(data.error || 'Failed to accept');
        }
      })
      .catch(() => {
        setConfirming(false);
        toast.error('Something went wrong');
      });
  }, [verified, requestToken, preview?.success, preview?.alreadyHandled, session, sessionLoading, success, navigate]);

  const handleConfirmClick = async () => {
    if (!requestToken || !preview?.success || preview.alreadyHandled) return;
    const apiBase = getApiBaseUrl();

    if (session?.access_token) {
      setConfirming(true);
      try {
        const res = await fetch(`${apiBase}/api/collab-requests/accept/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ requestToken }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccess({
            dealId: data.deal?.id,
            needsDeliveryDetails: data.needs_delivery_details,
          });
          toast.success('Deal accepted. Contract has been generated and sent to the brand.');
          if (data.deal?.id) {
            if (data.needs_delivery_details) {
              navigate(`/creator-contracts/${data.deal.id}/delivery-details`, { replace: true });
            } else {
              navigate(`/creator-contracts/${data.deal.id}`, { replace: true });
            }
          }
        } else {
          toast.error(data.error || 'Failed to accept');
        }
      } catch {
        toast.error('Something went wrong');
      } finally {
        setConfirming(false);
      }
      return;
    }

    // Not authenticated: send magic link
    setSendingVerification(true);
    try {
      const res = await fetch(`${apiBase}/api/collab/accept/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestToken }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationSent(true);
        toast.success('Verification link sent to your email');
      } else {
        toast.error(data.error || 'Failed to send verification');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSendingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (previewError || !preview?.success || preview.alreadyHandled) {
    const isExpired = previewError === 'This link has expired' || (preview?.success && !preview.alreadyHandled && previewError?.toLowerCase().includes('expired'));
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <span className="font-medium">
                {isExpired ? 'This link has expired' : 'This request has already been handled'}
              </span>
            </div>
            <p className="text-slate-600 text-sm">
              {isExpired
                ? 'Request a new link from your dashboard or the original email.'
                : 'You can view this request in your Creator Armour dashboard.'}
            </p>
            <p className="text-sm mt-3">
              <a href="mailto:support@creatorarmour.com" className="text-violet-600 hover:underline">Help / Contact us</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <span className="font-medium">✅ Deal accepted. Contract has been generated and sent to the brand.</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              Redirecting you to your deal...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const ctaDisabled = preview.alreadyHandled || confirming || sendingVerification;
  const amountText =
    preview.amount != null
      ? `₹${Number(preview.amount).toLocaleString('en-IN')}`
      : preview.collab_type === 'barter'
        ? 'Product value as agreed'
        : '—';
  const deadlineText = preview.deadline
    ? new Date(preview.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not specified';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2 text-center">Accept collaboration</h1>
        <p className="text-slate-600 text-center text-sm mb-6">{preview.brand_name}</p>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-slate-500">Deal type</span>
            <span className="text-slate-900">{preview.deal_type_label}</span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">Amount / value</span>
              <p className="font-medium text-slate-900">{amountText}</p>
            </div>
            <div>
              <span className="text-sm text-slate-500">Deliverables</span>
              <ul className="list-disc list-inside text-slate-700 text-sm mt-1">
                {preview.deliverables.length ? preview.deliverables.map((d, i) => <li key={i}>{d}</li>) : <li>As per agreement</li>}
              </ul>
            </div>
            <div>
              <span className="text-sm text-slate-500">Deadline</span>
              <p className="text-slate-900">{deadlineText}</p>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
          <p className="text-amber-800 text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0" />
            🔒 This action is legally binding. Please verify your identity.
          </p>
        </div>

        {verificationSent && (
          <div className="rounded-lg bg-violet-50 border border-violet-200 p-4 mb-6">
            <p className="text-violet-800 text-sm">
              We sent a magic link to your email. Click it to verify and complete the acceptance. Do not close this page.
            </p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={ctaDisabled}
          onClick={handleConfirmClick}
        >
          {confirming || sendingVerification ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {confirming ? 'Accepting...' : sendingVerification ? 'Sending link...' : 'Confirm & Generate Contract'}
        </Button>

        <p className="text-center text-sm text-slate-500 mt-6">
          <a href="mailto:support@creatorarmour.com" className="text-violet-600 hover:text-violet-700 underline">
            Help / Contact us
          </a>
          <span className="ml-1">— we’re here before any issue becomes a dispute.</span>
        </p>
      </div>
    </div>
  );
}
