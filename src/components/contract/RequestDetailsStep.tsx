import React from 'react';
import { MessageSquare, Loader2, Copy, Mail, Share2, MessageCircle } from 'lucide-react';

interface RequestDetailsStepProps {
  collaborationLink: string | null;
  isGeneratingLink: boolean;
  handleRequestDetailsClick: () => void;
  handleCopyLink: () => void;
  handleShareEmail: () => void;
  handleShareWhatsApp: () => void;
  handleShareInstagram: () => void;
}

export const RequestDetailsStep: React.FC<RequestDetailsStepProps> = ({
  collaborationLink,
  isGeneratingLink,
  handleRequestDetailsClick,
  handleCopyLink,
  handleShareEmail,
  handleShareWhatsApp,
  handleShareInstagram,
}) => {
  return (
    <div className="space-y-6">
      {/* Request Collaboration Details Card */}
      <div className="bg-card backdrop-blur-md rounded-2xl p-5 border border-border">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-foreground/60" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-foreground/90">No contract yet?</h3>
            <p className="text-sm text-foreground/60 mb-3">Let the brand share deal details — we'll generate a clean agreement for you.</p>

            {!collaborationLink ? (
              <button type="button"
                onClick={handleRequestDetailsClick}
                disabled={isGeneratingLink}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
              >
                {isGeneratingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Request Collaboration Details from Brand
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                {/* Link Display */}
                <div className="bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/50 mb-1">Share this link:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={collaborationLink}
                          className="flex-1 bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground/90 font-mono truncate focus:outline-none focus:ring-1 focus:ring-purple-500"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button type="button"
                          onClick={handleCopyLink}
                          className="p-2 bg-secondary/50 hover:bg-secondary/20 rounded-lg transition-colors flex-shrink-0"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4 text-foreground/80" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button type="button"
                    onClick={handleShareEmail}
                    className="flex-1 min-w-[100px] bg-secondary/50 hover:bg-secondary/20 border border-border px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 min-w-[100px] bg-secondary/50 hover:bg-secondary/20 border border-border px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button type="button"
                    onClick={handleShareInstagram}
                    className="flex-1 min-w-[100px] bg-secondary/50 hover:bg-secondary/20 border border-border px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
