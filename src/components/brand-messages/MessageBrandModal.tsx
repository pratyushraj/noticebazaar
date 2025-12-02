import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useSendBrandMessage } from '@/lib/hooks/useBrandMessages';
import { AIEmailComposer } from './AIEmailComposer';

interface MessageBrandModalProps {
  open: boolean;
  onClose: () => void;
  brandName: string;
  brandEmail?: string;
  dealId?: string;
  dealTitle?: string;
  initialMessage?: string;
  onMessageChange?: (message: string) => void;
}

interface AttachmentFile {
  file: File;
  url?: string;
  name: string;
  type: string;
}

export const MessageBrandModal: React.FC<MessageBrandModalProps> = ({
  open,
  onClose,
  brandName,
  brandEmail,
  dealId,
  dealTitle,
  initialMessage = '',
  onMessageChange,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageMutation = useSendBrandMessage();

  // Update message when initialMessage changes
  useEffect(() => {
    if (initialMessage && open) {
      setMessage(initialMessage);
      // Auto-scroll to textarea after modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [initialMessage, open]);

  // Notify parent of message changes
  useEffect(() => {
    onMessageChange?.(message);
  }, [message, onMessageChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'video/mp4',
      'video/quicktime',
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB per file

    const newAttachments: AttachmentFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        continue;
      }
      
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name} (max 50MB)`);
        continue;
      }

      newAttachments.push({
        file,
        name: file.name,
        type: file.type,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        brandName,
        brandEmail,
        dealId,
        text: message.trim(),
        attachments: attachments.map(att => att.file),
        type: 'brand_message',
      });

      toast.success('Message sent!', {
        description: 'You\'ll be notified when the brand replies.',
      });

      // Reset form
      setMessage('');
      setAttachments([]);
      onClose();
    } catch (error: any) {
      toast.error('Failed to send message', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleClose = () => {
    if (!sendMessageMutation.isPending) {
      setMessage('');
      setAttachments([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-purple-900 to-indigo-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Message {brandName}
          </DialogTitle>
          {dealTitle && (
            <p className="text-sm text-purple-200 mt-1">
              About: {dealTitle}
            </p>
          )}
          <p className="text-sm text-purple-300 mt-2">
            Ask anything about your deliverables, timelines, or expectations.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="message" className="text-white mb-2 block">
              Your Message
            </Label>
            <Textarea
              ref={textareaRef}
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your question for the brand... (or use AI Assistant to generate)"
              className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-purple-300 resize-none px-4 py-3 shadow-inner"
              disabled={sendMessageMutation.isPending}
            />
            <AIEmailComposer
              value={message}
              onChange={setMessage}
              brandName={brandName}
              dealTitle={dealTitle}
              purpose="brand_message"
              disabled={sendMessageMutation.isPending}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-white mb-2 block flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attach Files (Optional)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
              onChange={handleFileSelect}
              className="hidden"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending}
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-purple-300 flex-shrink-0" />
                      <span className="text-sm text-white truncate">{att.name}</span>
                      <span className="text-xs text-purple-300 flex-shrink-0">
                        ({(att.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                      disabled={sendMessageMutation.isPending}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={sendMessageMutation.isPending}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sendMessageMutation.isPending || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

