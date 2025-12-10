// Brand-Side Signature Tracking Page
// Public page for brands to track contract signing progress

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Send, CheckCircle, XCircle, Download, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface DealData {
  id: string;
  brand_name: string;
  esign_status: 'pending' | 'sent' | 'signed' | 'failed';
  signed_pdf_url: string | null;
  signed_at: string | null;
  esign_url: string | null;
  creator_id: string;
}

interface CreatorProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

export default function BrandEsignStatusPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [deal, setDeal] = useState<DealData | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId) {
      setError('Invalid deal ID');
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch deal
        const { data: dealData, error: dealError } = await supabase
          .from('brand_deals')
          .select('id, brand_name, esign_status, signed_pdf_url, signed_at, esign_url, creator_id')
          .eq('id', dealId)
          .single();

        if (dealError || !dealData) {
          setError('Deal not found');
          setIsLoading(false);
          return;
        }

        setDeal(dealData);

        // Fetch creator profile
        if (dealData.creator_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone')
            .eq('id', dealData.creator_id)
            .single();

          if (!profileError && profileData) {
            setCreatorProfile(profileData);
          }
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('[BrandEsignStatusPage] Error:', err);
        setError(err.message || 'Failed to load deal information');
        setIsLoading(false);
      }
    }

    fetchData();
  }, [dealId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Deal Not Found</h1>
          <p className="text-white/80">{error || 'The deal you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'Creator has not signed yet',
      subtitle: 'We will notify automatically after signing.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    },
    sent: {
      icon: Send,
      title: 'Document has been sent for signature',
      subtitle: 'Waiting for creator to sign.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
    },
    signed: {
      icon: CheckCircle,
      title: 'Creator has completed signing',
      subtitle: 'The contract is now legally signed.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
    },
    failed: {
      icon: XCircle,
      title: 'Signature processing failed',
      subtitle: 'Contact creator to resend.',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
    },
  };

  const config = statusConfig[deal.esign_status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">NoticeBazaar</h1>
          <h2 className="text-xl md:text-2xl text-white/90 mb-1">{deal.brand_name} Collaboration</h2>
          <p className="text-white/70">Track contract signing progress</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl"
        >
          {/* Status Display */}
          <div className={`flex items-center gap-4 p-6 rounded-xl border-2 ${config.bgColor} ${config.borderColor} mb-6`}>
            <StatusIcon className={`w-12 h-12 flex-shrink-0 ${config.color}`} />
            <div className="flex-1">
              <h3 className={`text-xl font-semibold ${config.color} mb-1`}>
                {config.title}
              </h3>
              <p className="text-white/80 text-sm">{config.subtitle}</p>
            </div>
          </div>

          {/* Download Button (if signed) */}
          {deal.esign_status === 'signed' && deal.signed_pdf_url && (
            <motion.button
              onClick={() => {
                if (deal.signed_pdf_url) {
                  window.open(deal.signed_pdf_url, '_blank');
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Download className="w-5 h-5" />
              Download Signed PDF
            </motion.button>
          )}

          {/* Audit Info */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h4 className="text-white font-semibold mb-3">Audit Information</h4>
            
            {deal.signed_at && (
              <div className="flex items-center gap-3 text-white/80">
                <Clock className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-sm font-medium">Signed At</div>
                  <div className="text-xs text-white/60">
                    {new Date(deal.signed_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )}

            {creatorProfile?.email && (
              <div className="flex items-center gap-3 text-white/80">
                <Mail className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-sm font-medium">Creator Email</div>
                  <div className="text-xs text-white/60">{creatorProfile.email}</div>
                </div>
              </div>
            )}

            {creatorProfile?.phone && (
              <div className="flex items-center gap-3 text-white/80">
                <Phone className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-sm font-medium">Creator Phone</div>
                  <div className="text-xs text-white/60">{creatorProfile.phone}</div>
                </div>
              </div>
            )}

            {creatorProfile && (
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 flex items-center justify-center text-white/60">
                  👤
                </div>
                <div>
                  <div className="text-sm font-medium">Creator Name</div>
                  <div className="text-xs text-white/60">
                    {`${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Not provided'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-white/60 text-sm"
        >
          <p>NoticeBazaar • Secure Legal Portal ©2025</p>
        </motion.div>
      </div>
    </div>
  );
}

