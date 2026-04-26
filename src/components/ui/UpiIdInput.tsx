import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink, CheckCircle2, Copy, Eye, EyeOff, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateUpiId, buildUpiVerificationDeeplink, type UpiValidationResult } from '@/lib/utils/upiValidation';

interface UpiIdInputProps {
  /** Current saved/committed value (from DB) */
  value: string;
  /** Whether the saved value is verified (upi_verified_at is set) */
  isVerified?: boolean;
  /** Read-only mode (display only) */
  readOnly?: boolean;
  /** Called with the normalised UPI ID when the user commits a valid entry */
  onChange: (normalisedValue: string, isVerified: false) => void;
  /** Called when user explicitly marks as verified via the deeplink flow */
  onVerified?: (normalisedValue: string) => void;
  /** Dark mode flag */
  isDark?: boolean;
  className?: string;
}

export function UpiIdInput({
  value,
  isVerified = false,
  readOnly = false,
  onChange,
  onVerified,
  isDark = true,
  className,
}: UpiIdInputProps) {
  const [draft, setDraft] = useState(value || '');
  const [confirmDraft, setConfirmDraft] = useState(value || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVerifyFlow, setShowVerifyFlow] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [selfConfirmed, setSelfConfirmed] = useState(false);

  // Sync external value changes (e.g. profile reload)
  useEffect(() => {
    setDraft(value || '');
    setConfirmDraft(value || '');
  }, [value]);

  const validation: UpiValidationResult = validateUpiId(draft);

  const confirmValidation: UpiValidationResult = validateUpiId(confirmDraft);
  const confirmMismatch = showConfirm && confirmDraft.length > 0 && confirmDraft !== draft;
  const confirmMatch = showConfirm && confirmDraft === draft && validation.valid;

  const handleDraftChange = useCallback((raw: string) => {
    // Strip spaces, force lowercase
    const cleaned = raw.replace(/\s/g, '').toLowerCase();
    setDraft(cleaned);
    setShowConfirm(false);
    setConfirmDraft('');
    setSelfConfirmed(false);
    setShowVerifyFlow(false);
  }, []);

  const handleDraftBlur = () => {
    if (validation.valid && draft !== value) {
      // Show confirm field
      setShowConfirm(true);
    }
  };

  const handleConfirmBlur = () => {
    if (confirmMatch) {
      // Commit the change — mark as unverified (changed)
      onChange(validation.normalised, false);
      setShowConfirm(false);
    }
  };

  const handleCommit = () => {
    if (!confirmMatch) return;
    onChange(validation.normalised, false);
    setShowConfirm(false);
    toast.success('UPI ID saved. Verify it below to get the ✓ badge.');
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setHasCopied(true);
      toast.success('UPI ID copied');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleSelfVerify = () => {
    setSelfConfirmed(true);
    onVerified?.(validation.normalised || value);
    setShowVerifyFlow(false);
    toast.success('UPI ID verified ✓');
  };

  const deeplink = buildUpiVerificationDeeplink(validation.valid ? validation.normalised : value);
  const isDesktop = typeof window !== 'undefined' && !/Mobi|Android/i.test(navigator.userAgent);

  const inputBase = cn(
    'w-full bg-transparent outline-none font-bold text-[15px] p-0 border-none focus:ring-0 font-mono tracking-wide',
    isDark ? 'text-blue-400' : 'text-blue-600'
  );

  if (readOnly) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('font-bold text-[15px] font-mono truncate', isDark ? 'text-blue-400' : 'text-blue-600')}>
          {value || <span className="opacity-30 italic font-sans font-normal">Not set</span>}
        </span>
        {value && isVerified && (
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        )}
        {value && !isVerified && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* ── Main input ── */}
      <div className="relative group">
        <input
          className={inputBase}
          value={draft}
          onChange={e => handleDraftChange(e.target.value)}
          onBlur={handleDraftBlur}
          placeholder="yourname@okaxis"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          aria-label="UPI ID"
          aria-describedby="upi-hint"
        />
        {/* Copy icon */}
        {draft && (
          <button
            type="button"
            onClick={handleCopyUpi}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
            tabIndex={-1}
            aria-label="Copy UPI ID"
          >
            {hasCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ── Real-time validation feedback ── */}
      {draft.length > 3 && (
        <div id="upi-hint" className="space-y-1">
          {validation.error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {validation.error}
            </p>
          )}
          {!validation.error && validation.warning && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {validation.warning}
            </p>
          )}
          {validation.valid && !validation.warning && (
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              Valid format
              {isVerified && ' · Verified'}
            </p>
          )}
        </div>
      )}

      {/* ── Confirm-entry field (shown when draft changes and is valid) ── */}
      {showConfirm && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 space-y-2">
          <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            Re-enter UPI ID to confirm — typos mean brands can't pay you
          </p>
          <input
            className={cn(inputBase, 'text-[14px]',
              confirmMismatch ? 'text-red-400' : confirmMatch ? 'text-emerald-400' : ''
            )}
            value={confirmDraft}
            onChange={e => setConfirmDraft(e.target.value.replace(/\s/g, '').toLowerCase())}
            onBlur={handleConfirmBlur}
            placeholder="Re-enter your UPI ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            aria-label="Confirm UPI ID"
          />
          {confirmMismatch && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Doesn't match — check for typos
            </p>
          )}
          {confirmMatch && (
            <button
              type="button"
              onClick={handleCommit}
              className="w-full text-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg py-1.5 hover:bg-emerald-500/20 transition-colors"
            >
              ✓ Confirm & Save
            </button>
          )}
        </div>
      )}

      {/* ── Verified badge OR verify-now prompt ── */}
      {value && !showConfirm && (
        <div className="mt-1">
          {isVerified ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold">Verified UPI</span>
              <span className="opacity-50">— brands see a ✓ badge next to your ID</span>
            </div>
          ) : (
            <div>
              {!showVerifyFlow ? (
                <button
                  type="button"
                  onClick={() => setShowVerifyFlow(true)}
                  className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  <Smartphone className="h-3.5 w-3.5 shrink-0" />
                  Verify this UPI ID on your phone
                  <span className="text-white/25 font-normal">(brands trust verified IDs)</span>
                </button>
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2.5">
                  <p className="text-[12px] font-bold text-white/70">
                    Verify your UPI ID
                  </p>
                  <p className="text-[11px] text-white/45 leading-relaxed">
                    Open this link on your phone. Your UPI app will load and show the name
                    registered to <span className="text-white/70 font-semibold">{value}</span>.
                    If it matches you, tap the button below.
                  </p>

                  {isDesktop ? (
                    <div className="text-[11px] text-white/45 bg-white/4 rounded-lg px-3 py-2 font-mono break-all">
                      {deeplink}
                    </div>
                  ) : (
                    <a
                      href={deeplink}
                      className="flex items-center justify-center gap-2 w-full text-center text-[12px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded-lg py-2 hover:bg-blue-500/20 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in UPI App
                    </a>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVerifyFlow(false)}
                      className="flex-1 text-[11px] text-white/40 hover:text-white/70 transition-colors py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSelfVerify}
                      className="flex-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg py-1.5 hover:bg-emerald-500/20 transition-colors"
                    >
                      ✓ My name appeared — mark as verified
                    </button>
                  </div>

                  <p className="text-[10px] text-white/25 text-center">
                    By tapping above, you confirm this UPI ID belongs to you.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
