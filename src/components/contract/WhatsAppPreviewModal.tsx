import React from 'react';
import { MessageSquare, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WhatsAppPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappPreviewMessage: string;
  negotiationMessage: string | null;
  onCopy: () => Promise<void>;
  onOpenWhatsApp: () => Promise<void>;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  open,
  onOpenChange,
  whatsappPreviewMessage,
  negotiationMessage,
  onCopy,
  onOpenWhatsApp,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-xl border border-green-500/30 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            WhatsApp Message Preview
          </DialogTitle>
          <DialogDescription className="text-green-200">
            Review your message before sending
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-border max-h-96 overflow-y-auto">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
            {whatsappPreviewMessage || (negotiationMessage ? 'Generating preview...' : 'No message available')}
          </pre>
        </div>
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-foreground px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy & Close
          </motion.button>
          <motion.button
            onClick={onOpenWhatsApp}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-green-500 hover:bg-green-600 text-foreground px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Open WhatsApp
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
