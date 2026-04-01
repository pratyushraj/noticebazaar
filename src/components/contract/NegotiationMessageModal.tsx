import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Download, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface NegotiationMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationMessage: string | null;
  onNegotiationMessageChange: (message: string) => void;
  onCopyEmail: () => Promise<void>;
  onCopyWhatsApp: () => Promise<void>;
  onDownloadPDF: () => Promise<void>;
  onSendEmail: (email: string) => Promise<void>;
  isSendingEmail: boolean;
}

export const NegotiationMessageModal: React.FC<NegotiationMessageModalProps> = ({
  open,
  onOpenChange,
  negotiationMessage,
  onNegotiationMessageChange,
  onCopyEmail,
  onCopyWhatsApp,
  onDownloadPDF,
  onSendEmail,
  isSendingEmail,
}) => {
  const [brandEmail, setBrandEmail] = useState('');

  const handleSendEmail = async () => {
    if (!brandEmail) return;
    await onSendEmail(brandEmail);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-purple-500/30 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white mb-2">
            Request Contract Changes from Brand
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Review and edit the AI-generated negotiation message before sending
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Editable Message Textarea */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Negotiation Message
            </label>
            <textarea
              value={negotiationMessage || ''}
              onChange={(e) => onNegotiationMessageChange(e.target.value)}
              className="w-full min-h-[300px] p-4 bg-white/10 border border-purple-400/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
              placeholder="Loading negotiation message..."
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <motion.button
              onClick={onCopyEmail}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Copy Email
            </motion.button>

            <motion.button
              onClick={onCopyWhatsApp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Copy WhatsApp
            </motion.button>

            <motion.button
              onClick={onDownloadPDF}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </motion.button>
          </div>

          {/* Email Input Section */}
          {brandEmail && (
            <div className="mt-4 p-4 bg-white/10 border border-purple-400/30 rounded-xl">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Brand Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={brandEmail}
                  onChange={(e) => setBrandEmail(e.target.value)}
                  placeholder="brand@example.com"
                  className="flex-1 px-4 py-2 bg-white/10 border border-purple-400/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !brandEmail}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              setBrandEmail('');
            }}
            className="w-full bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          >
            <X className="w-5 h-5" />
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
