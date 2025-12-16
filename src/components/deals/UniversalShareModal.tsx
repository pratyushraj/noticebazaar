import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Copy, Mail, MessageSquare, Send, X, Check, Link2, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

interface UniversalShareModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
  brandReplyLink: string;
  dealId?: string;
  onShareComplete?: (method: string) => void;
  primaryCtaText?: string; // Optional: "Share with Brand" or "Share Contract Summary"
}

// Sanitize message for sharing
const sanitizeMessage = (message: string, brandReplyLink: string): string => {
  let sanitized = message;
  
  // Max 1500 characters
  if (sanitized.length > 1500) {
    sanitized = sanitized.substring(0, 1497) + '...';
  }
  
  // Strip URLs except brand reply link
  const brandLinkPattern = new RegExp(brandReplyLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, (url) => {
    // Keep brand reply link
    if (brandLinkPattern.test(url)) {
      return url;
    }
    // Remove other URLs
    return '';
  });
  
  // Remove emails (except creatorarmour.com)
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@(?!.*creatorarmour\.com)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email]');
  
  // Remove phone numbers
  sanitized = sanitized.replace(/\b(?:\+91|91)?[6-9]\d{9}\b/g, '[Phone]');
  
  // Remove prompt injection patterns
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Ensure brand reply link is included
  if (!sanitized.includes(brandReplyLink)) {
    sanitized += `\n\nPlease confirm your decision: ${brandReplyLink}`;
  }
  
  return sanitized.trim();
};

export const UniversalShareModal: React.FC<UniversalShareModalProps> = ({
  open,
  onClose,
  message,
  brandReplyLink,
  dealId,
  onShareComplete,
  primaryCtaText = 'Share with Brand',
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  
  // Check if we have a valid link
  const hasValidLink = brandReplyLink && !brandReplyLink.includes('/pending') && !brandReplyLink.includes('undefined');
  
  const sanitizedMessage = hasValidLink ? sanitizeMessage(message, brandReplyLink) : message;
  
  // Handle native share
  const handleNativeShare = async () => {
    if (typeof navigator.share !== 'function') {
      // Fallback to modal options
      return false;
    }
    
    try {
      await navigator.share({
        title: 'Contract Revision Request',
        text: sanitizedMessage,
        url: brandReplyLink,
      });
      
      // Log share
      await logShare('native', dealId);
      onShareComplete?.('native');
      triggerHaptic(HapticPatterns.medium);
      toast.success('✅ Message shared');
      onClose();
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return true;
      }
      // Fallback to modal
      return false;
    }
  };
  
  // Log share to backend
  const logShare = async (method: string, dealId?: string) => {
    if (!dealId) return;
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
          ? 'https://api.creatorarmour.com' 
          : 'http://localhost:3001');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.access_token) {
        console.warn('[UniversalShareModal] No auth session, skipping log');
        return;
      }
      
      await fetch(`${apiBaseUrl}/api/deals/log-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          dealId,
          message: sanitizedMessage,
          metadata: {
            channel: 'share',
            method,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error('[UniversalShareModal] Failed to log share:', error);
      // Don't fail the share if logging fails
    }
  };
  
  // Copy full message
  const handleCopyFullMessage = async () => {
    await navigator.clipboard.writeText(sanitizedMessage);
    setCopiedItem('full');
    triggerHaptic(HapticPatterns.light);
    toast.success('Message copied');
    await logShare('copy', dealId);
    onShareComplete?.('copy');
    setTimeout(() => setCopiedItem(null), 2000);
  };
  
  // Copy link only
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(brandReplyLink);
    setCopiedItem('link');
    triggerHaptic(HapticPatterns.light);
    toast.success('Link copied');
    setTimeout(() => setCopiedItem(null), 2000);
  };
  
  // Open WhatsApp
  const handleOpenWhatsApp = async () => {
    const encodedMessage = encodeURIComponent(sanitizedMessage);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    await logShare('whatsapp', dealId);
    onShareComplete?.('whatsapp');
    triggerHaptic(HapticPatterns.medium);
    toast.success('Opening WhatsApp...');
    onClose();
  };
  
  // Open Email
  const handleOpenEmail = async () => {
    const subject = encodeURIComponent('Contract Revision Request');
    const body = encodeURIComponent(sanitizedMessage);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    await logShare('email', dealId);
    onShareComplete?.('email');
    triggerHaptic(HapticPatterns.medium);
    toast.success('Opening email client...');
    onClose();
  };
  
  // Open Telegram
  const handleOpenTelegram = async () => {
    const encodedMessage = encodeURIComponent(sanitizedMessage);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(brandReplyLink)}&text=${encodedMessage}`;
    window.open(telegramUrl, '_blank');
    await logShare('telegram', dealId);
    onShareComplete?.('telegram');
    triggerHaptic(HapticPatterns.medium);
    toast.success('Opening Telegram...');
    onClose();
  };
  
  // Open Instagram DM (web)
  const handleOpenInstagram = async () => {
    // Instagram doesn't have a direct DM link, so we'll copy the message
    await navigator.clipboard.writeText(sanitizedMessage);
    toast.success('Message copied! Paste it in Instagram DM');
    await logShare('instagram', dealId);
    onShareComplete?.('instagram');
    triggerHaptic(HapticPatterns.light);
  };
  
  // Try native share first when modal opens
  const handleOpen = async () => {
    if (typeof navigator.share === 'function') {
      const shared = await handleNativeShare();
      if (shared) {
        return; // Native share succeeded or was cancelled
      }
    }
    // If native share not available or failed, modal is already shown
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-purple-500/30 text-white overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Try native share when modal opens
          if (typeof navigator.share === 'function') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Share with Brand
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Choose how you'd like to share your contract feedback
          </DialogDescription>
        </DialogHeader>

        {!hasValidLink ? (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-300 font-semibold mb-2">⚠️ Deal not saved</p>
            <p className="text-red-200 text-sm">
              Please wait a moment while we save your deal, then try sharing again.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
          {/* Primary CTA */}
          <motion.button
            onClick={async () => {
              if (typeof navigator.share === 'function') {
                const shared = await handleNativeShare();
                if (shared) {
                  return; // Native share succeeded or was cancelled
                }
              }
              // If native share not available or failed, do nothing (user can use other buttons)
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30"
          >
            <Share2 className="w-6 h-6" />
            <span>{primaryCtaText}</span>
          </motion.button>

          {/* Copy Options */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={handleCopyFullMessage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                copiedItem === 'full'
                  ? "bg-purple-600/80 text-white border border-purple-400/50"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-white/90"
              )}
            >
              {copiedItem === 'full' ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Full Message</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              onClick={handleCopyLink}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                copiedItem === 'link'
                  ? "bg-purple-600/80 text-white border border-purple-400/50"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-white/90"
              )}
            >
              {copiedItem === 'link' ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  <span>Copy Link Only</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <motion.button
              onClick={handleOpenWhatsApp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Open WhatsApp</span>
            </motion.button>
            
            <motion.button
              onClick={handleOpenEmail}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
            >
              <Mail className="w-6 h-6" />
              <span>Open Email</span>
            </motion.button>
            
            <motion.button
              onClick={handleOpenTelegram}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
            >
              <Send className="w-6 h-6" />
              <span>Open Telegram</span>
            </motion.button>
            
            <motion.button
              onClick={handleOpenInstagram}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
            >
              <Instagram className="w-6 h-6" />
              <span>Copy for Instagram DM</span>
            </motion.button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mt-2"
          >
            <X className="w-5 h-5" />
            Close
          </button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

